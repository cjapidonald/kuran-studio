import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchMyReflections } from "@/lib/reflections/queries";
import { ReflectionFeed } from "@/components/reflections/reflection-feed";

export const dynamic = "force-dynamic";

export default async function MyReflectionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const reflections = await fetchMyReflections();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest">&larr; Home</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-white">My Reflections</span>
            <Link href={`/${lang}/reflections/feed`} className="text-xs text-emerald-400 hover:text-emerald-300 font-mono">Community Feed</Link>
          </div>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ReflectionFeed reflections={reflections} lang={lang} currentUserId={user?.id ?? null} emptyMessage="You haven't written any reflections yet. Open any surah and tap the reflect button on an ayah." />
      </div>
    </div>
  );
}
