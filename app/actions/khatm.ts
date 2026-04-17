"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { juzFor, positionBefore, toDateKey, type GoalUnit } from "@/lib/quran/khatm";

export interface CreateKhatmInput {
  name: string;
  goal_unit: GoalUnit;
  goal_per_day: number;
  target_completion_at?: string | null;
  notes?: string;
}

export async function createKhatm(input: CreateKhatmInput): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (!input.name.trim()) return { error: "Name is required." };
  if (!["ayahs", "juz", "surahs"].includes(input.goal_unit)) return { error: "Invalid goal unit." };
  if (!Number.isInteger(input.goal_per_day) || input.goal_per_day <= 0) return { error: "Goal must be a positive integer." };

  const { data, error } = await supabase
    .from("khatms")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      goal_unit: input.goal_unit,
      goal_per_day: input.goal_per_day,
      target_completion_at: input.target_completion_at ?? null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Failed to create khatm." };
  return { id: data.id };
}

export async function archiveKhatm(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("khatms")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/[lang]/khatm", "layout");
  return { ok: true };
}

export async function deleteKhatm(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("khatms").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/[lang]/khatm", "layout");
  return { ok: true };
}

/**
 * Record a batch of (surah, ayah) pairs the user has spent time looking at.
 * Writes to `reading_days` (upserting the day row), advances the khatm's
 * cursor, and mirrors the latest position into `user_preferences`.
 */
export async function recordAyahsRead(
  khatmId: string,
  ayahs: { surah: number; ayah: number }[],
): Promise<{ ok: true; ayahs_read: number } | { error: string }> {
  if (!ayahs.length) return { ok: true, ayahs_read: 0 };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Read the khatm (RLS enforces ownership).
  const { data: khatm, error: khatmErr } = await supabase
    .from("khatms")
    .select("id, user_id, current_surah, current_ayah")
    .eq("id", khatmId)
    .single();
  if (khatmErr || !khatm) return { error: khatmErr?.message || "Khatm not found." };

  // Dedupe the incoming batch.
  const uniq = new Map<string, { surah: number; ayah: number }>();
  for (const a of ayahs) {
    if (a.surah < 1 || a.surah > 114 || a.ayah < 1) continue;
    uniq.set(`${a.surah}:${a.ayah}`, a);
  }
  const list = Array.from(uniq.values());
  if (!list.length) return { ok: true, ayahs_read: 0 };

  const day = toDateKey(new Date());
  const surahsTouched = new Set(list.map((a) => a.surah)).size;
  const juzTouched = new Set(list.map((a) => juzFor(a.surah, a.ayah))).size;

  // Upsert the reading_days row. Two-step so we can add to existing count.
  const { data: existing } = await supabase
    .from("reading_days")
    .select("ayahs_read, surahs_touched, juz_touched")
    .eq("khatm_id", khatmId)
    .eq("day", day)
    .maybeSingle();

  if (existing) {
    const { error: updErr } = await supabase
      .from("reading_days")
      .update({
        ayahs_read: (existing.ayahs_read ?? 0) + list.length,
        surahs_touched: Math.max(existing.surahs_touched ?? 0, surahsTouched),
        juz_touched: Math.max(Number(existing.juz_touched ?? 0), juzTouched),
      })
      .eq("khatm_id", khatmId)
      .eq("day", day);
    if (updErr) return { error: updErr.message };
  } else {
    const { error: insErr } = await supabase.from("reading_days").insert({
      khatm_id: khatmId,
      user_id: user.id,
      day,
      ayahs_read: list.length,
      surahs_touched: surahsTouched,
      juz_touched: juzTouched,
    });
    if (insErr) return { error: insErr.message };
  }

  // Advance the khatm's cursor to the furthest-read position.
  let furthest = { surah: khatm.current_surah, ayah: khatm.current_ayah };
  for (const a of list) {
    if (positionBefore(furthest.surah, furthest.ayah, a.surah, a.ayah)) {
      furthest = a;
    }
  }
  if (
    furthest.surah !== khatm.current_surah ||
    furthest.ayah !== khatm.current_ayah
  ) {
    await supabase
      .from("khatms")
      .update({
        current_surah: furthest.surah,
        current_ayah: furthest.ayah,
        updated_at: new Date().toISOString(),
      })
      .eq("id", khatmId);
  }

  // Mirror latest position into user_preferences for the global "last read"
  // pointer. Upsert on user_id.
  await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      last_read_surah: furthest.surah,
      last_read_ayah: furthest.ayah,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath(`/[lang]/khatm/${khatmId}`, "page");
  return { ok: true, ayahs_read: list.length };
}
