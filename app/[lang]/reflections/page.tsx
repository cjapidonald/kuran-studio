import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LanguageSelector } from "@/components/layout/language-selector";
import { KhatmNavLink } from "@/components/layout/khatm-nav-link";
import { AuthNavLink } from "@/components/layout/auth-nav-link";
import { fetchMyReflections } from "@/lib/reflections/queries";
import { ReflectionFeed } from "@/components/reflections/reflection-feed";

export const dynamic = "force-dynamic";

export default async function MyReflectionsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const reflections = await fetchMyReflections();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
            <span className="font-bold text-white text-base">Kuran<span className="text-emerald-400">.</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${lang}`} className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline">{dict["nav.home"] || "Home"}</Link>
            <KhatmNavLink
              lang={lang}
              label={dict["nav.khatm"] || "Khatm"}
              className="text-sm px-4 py-2 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition hidden sm:inline"
            />
            <AuthNavLink
              href={`/${lang}/devotion`}
              label={dict["nav.devotion"] || "Devotion"}
              className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline"
            />
            <AuthNavLink
              href={`/${lang}/reflections`}
              label={dict["nav.reflections"] || "Reflections"}
              className="text-sm px-4 py-2 rounded-md text-white bg-white/10 transition hidden sm:inline"
            />
            <Link href={`/${lang}/reflections/feed`} className="text-sm px-4 py-2 rounded-md text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition hidden sm:inline">Community Feed</Link>
            <LanguageSelector currentLang={lang} />
          </div>
        </nav>
      </div>
      <div className="h-16" />
      <div className="px-6 py-8">
        <ReflectionFeed reflections={reflections} lang={lang} currentUserId={user?.id ?? null} emptyMessage="You haven't written any reflections yet. Open any surah and tap the reflect button on an ayah." />
      </div>
    </div>
  );
}
