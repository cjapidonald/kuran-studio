"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createReflection(input: {
  surah: number;
  ayah: number;
  content: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  if (!input.content.trim()) return { error: "Content is required." };

  const { data, error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      surah: input.surah,
      ayah: input.ayah,
      content: input.content.trim(),
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Failed to create reflection." };
  revalidatePath("/[lang]/reflections", "layout");
  return { id: data.id };
}

export async function deleteReflection(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("reflections").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/[lang]/reflections", "layout");
  return { ok: true };
}

export async function likeReflection(reflectionId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("reflection_likes")
    .insert({ reflection_id: reflectionId, user_id: user.id });

  if (error?.code === "23505") return { ok: true };
  if (error) return { error: error.message };
  return { ok: true };
}

export async function unlikeReflection(reflectionId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("reflection_likes")
    .delete()
    .eq("reflection_id", reflectionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function addComment(input: {
  reflectionId: string;
  content: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  if (!input.content.trim()) return { error: "Content is required." };

  const { data, error } = await supabase
    .from("reflection_comments")
    .insert({
      reflection_id: input.reflectionId,
      user_id: user.id,
      content: input.content.trim(),
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Failed to add comment." };
  return { id: data.id };
}

export async function deleteComment(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("reflection_comments").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
