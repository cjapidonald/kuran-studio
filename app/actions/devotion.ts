"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ---- Prayers ----

export async function togglePrayer(day: string, prayer: string): Promise<{ completed: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("devotion_prayers")
    .select("id, completed")
    .eq("user_id", user.id)
    .eq("day", day)
    .eq("prayer", prayer)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("devotion_prayers")
      .update({ completed: !existing.completed })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return { completed: !existing.completed };
  } else {
    const { error } = await supabase
      .from("devotion_prayers")
      .insert({ user_id: user.id, day, prayer, completed: true });
    if (error) return { error: error.message };
    return { completed: true };
  }
}

export async function getPrayers(startDay: string, endDay: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("devotion_prayers")
    .select("*")
    .eq("user_id", user.id)
    .gte("day", startDay)
    .lte("day", endDay)
    .eq("completed", true);

  return data ?? [];
}

// ---- Dhikr ----

export async function upsertDhikr(input: {
  day: string;
  type: string;
  label?: string;
  count: number;
  target?: number;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("devotion_dhikr")
    .select("id")
    .eq("user_id", user.id)
    .eq("day", input.day)
    .eq("type", input.type)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("devotion_dhikr")
      .update({ count: input.count, target: input.target ?? null, label: input.label ?? null })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return { id: existing.id };
  } else {
    const { data, error } = await supabase
      .from("devotion_dhikr")
      .insert({
        user_id: user.id,
        day: input.day,
        type: input.type,
        label: input.label ?? null,
        count: input.count,
        target: input.target ?? null,
      })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message || "Failed." };
    return { id: data.id };
  }
}

export async function getDhikrForDay(day: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("devotion_dhikr")
    .select("*")
    .eq("user_id", user.id)
    .eq("day", day)
    .order("created_at");

  return data ?? [];
}

// ---- Fasting ----

export async function toggleFasting(day: string, type: string = "voluntary"): Promise<{ completed: boolean } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("devotion_fasting")
    .select("id, completed")
    .eq("user_id", user.id)
    .eq("day", day)
    .single();

  if (existing) {
    if (existing.completed) {
      await supabase.from("devotion_fasting").delete().eq("id", existing.id);
      return { completed: false };
    } else {
      await supabase.from("devotion_fasting").update({ completed: true, type }).eq("id", existing.id);
      return { completed: true };
    }
  } else {
    const { error } = await supabase
      .from("devotion_fasting")
      .insert({ user_id: user.id, day, type, completed: true });
    if (error) return { error: error.message };
    return { completed: true };
  }
}

export async function getFasting(month: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const startDay = `${month}-01`;
  const endDay = `${month}-31`;

  const { data } = await supabase
    .from("devotion_fasting")
    .select("*")
    .eq("user_id", user.id)
    .gte("day", startDay)
    .lte("day", endDay)
    .eq("completed", true);

  return data ?? [];
}

// ---- Duas ----

export async function createDua(input: {
  title: string;
  content: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  if (!input.title.trim() || !input.content.trim()) return { error: "Title and content required." };

  const { data: last } = await supabase
    .from("devotion_duas")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("devotion_duas")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      content: input.content.trim(),
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Failed." };
  revalidatePath("/[lang]/devotion", "layout");
  return { id: data.id };
}

export async function updateDua(id: string, input: {
  title?: string;
  content?: string;
  sort_order?: number;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("devotion_duas")
    .update(input)
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteDua(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("devotion_duas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/[lang]/devotion", "layout");
  return { ok: true };
}

export async function getDuas() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("devotion_duas")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order");

  return data ?? [];
}
