import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchUserReflections } from "@/lib/reflections/queries";
import { ReflectionFeed } from "@/components/reflections/reflection-feed";
import { FollowButton } from "@/components/reflections/follow-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ lang: string; userId: string }> }) {
  const { lang, userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.rpc("get_profile", { uid: userId });
  if (!profile) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === userId;

  let isFollowing = false;
  if (user && !isOwnProfile) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single();
    isFollowing = Boolean(data);
  }

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  const reflections = await fetchUserReflections(userId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}/reflections/feed`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest">&larr; Feed</Link>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold">
              {profile.full_name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{profile.full_name}</h1>
            <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
              <span><strong className="text-white/70">{followerCount ?? 0}</strong> followers</span>
              <span><strong className="text-white/70">{followingCount ?? 0}</strong> following</span>
              <span><strong className="text-white/70">{reflections.length}</strong> reflections</span>
            </div>
          </div>
          {user && !isOwnProfile && (
            <FollowButton targetUserId={userId} initialFollowing={isFollowing} />
          )}
        </div>
        <ReflectionFeed reflections={reflections} lang={lang} currentUserId={user?.id ?? null} emptyMessage="This user hasn't shared any reflections yet." />
      </div>
    </div>
  );
}
