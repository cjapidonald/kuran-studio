import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchSingleReflection } from "@/lib/reflections/queries";
import { ReflectionCard } from "@/components/reflections/reflection-card";

export const dynamic = "force-dynamic";

export default async function SingleReflectionPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const reflection = await fetchSingleReflection(id);
  if (!reflection) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}/reflections`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest">&larr; Reflections</Link>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ReflectionCard reflection={reflection} lang={lang} currentUserId={user?.id ?? null} />
      </div>
    </div>
  );
}
