import { createClient } from "@/lib/supabase/server";

export interface ReflectionRow {
  id: string;
  user_id: string;
  surah: number;
  ayah: number;
  content: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  author: { full_name: string; avatar_url: string | null };
}

export async function fetchMyReflections(): Promise<ReflectionRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: reflections } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!reflections || reflections.length === 0) return [];
  return enrichReflections(supabase, reflections, user.id);
}

export async function fetchFeedReflections(): Promise<ReflectionRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = (followRows ?? []).map((r) => r.following_id);
  if (followedIds.length === 0) return [];

  const { data: reflections } = await supabase
    .from("reflections")
    .select("*")
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!reflections || reflections.length === 0) return [];
  return enrichReflections(supabase, reflections, user.id);
}

export async function fetchUserReflections(userId: string): Promise<ReflectionRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reflections } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!reflections || reflections.length === 0) return [];
  return enrichReflections(supabase, reflections, user?.id ?? null);
}

export async function fetchSingleReflection(id: string): Promise<ReflectionRow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reflection } = await supabase
    .from("reflections")
    .select("*")
    .eq("id", id)
    .single();

  if (!reflection) return null;
  const rows = await enrichReflections(supabase, [reflection], user?.id ?? null);
  return rows[0] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichReflections(supabase: any, reflections: any[], currentUserId: string | null): Promise<ReflectionRow[]> {
  const reflectionIds = reflections.map((r) => r.id);
  const userIds = [...new Set(reflections.map((r) => r.user_id))];

  const [likeCounts, commentCounts, userLikes, profiles] = await Promise.all([
    supabase.from("reflection_likes").select("reflection_id").in("reflection_id", reflectionIds)
      .then(({ data }: { data: { reflection_id: string }[] | null }) => {
        const map = new Map<string, number>();
        for (const l of data ?? []) map.set(l.reflection_id, (map.get(l.reflection_id) ?? 0) + 1);
        return map;
      }),
    supabase.from("reflection_comments").select("reflection_id").in("reflection_id", reflectionIds)
      .then(({ data }: { data: { reflection_id: string }[] | null }) => {
        const map = new Map<string, number>();
        for (const c of data ?? []) map.set(c.reflection_id, (map.get(c.reflection_id) ?? 0) + 1);
        return map;
      }),
    currentUserId
      ? supabase.from("reflection_likes").select("reflection_id").in("reflection_id", reflectionIds).eq("user_id", currentUserId)
          .then(({ data }: { data: { reflection_id: string }[] | null }) => new Set((data ?? []).map((l) => l.reflection_id)))
      : Promise.resolve(new Set<string>()),
    supabase.rpc("get_profiles", { uids: userIds })
      .then(({ data }: { data: { id: string; full_name: string; avatar_url: string | null }[] | null }) => {
        const map = new Map<string, { full_name: string; avatar_url: string | null }>();
        if (Array.isArray(data)) for (const p of data) map.set(p.id, p);
        return map;
      }),
  ]);

  return reflections.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    surah: r.surah,
    ayah: r.ayah,
    content: r.content,
    created_at: r.created_at,
    like_count: likeCounts.get(r.id) ?? 0,
    comment_count: commentCounts.get(r.id) ?? 0,
    user_has_liked: userLikes.has(r.id),
    author: profiles.get(r.user_id) ?? { full_name: "Anonymous", avatar_url: null },
  }));
}
