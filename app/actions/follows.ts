"use server";

import { createClient } from "@/lib/supabase/server";

export async function followUser(followingId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  if (user.id === followingId) return { error: "Cannot follow yourself." };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: followingId });

  if (error?.code === "23505") return { ok: true };
  if (error) return { error: error.message };
  return { ok: true };
}

export async function unfollowUser(followingId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return { error: error.message };
  return { ok: true };
}
