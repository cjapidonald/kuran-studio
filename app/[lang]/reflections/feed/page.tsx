import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedReflections } from "@/lib/reflections/queries";
import { ReflectionFeed } from "@/components/reflections/reflection-feed";

export const dynamic = "force-dynamic";

export default async function FeedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const reflections = await fetchFeedReflections();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}/reflections`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest">&larr; My Reflections</Link>
          <span className="text-sm font-semibold text-white">Community Feed</span>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ReflectionFeed reflections={reflections} lang={lang} currentUserId={user?.id ?? null} emptyMessage="Follow other users to see their reflections here." />
      </div>
    </div>
  );
}
