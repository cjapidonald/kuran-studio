import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LanguageSelector } from "@/components/layout/language-selector";
import { KhatmNavLink } from "@/components/layout/khatm-nav-link";
import { AuthNavLink } from "@/components/layout/auth-nav-link";
import { PrayerTracker } from "@/components/devotion/prayer-tracker";
import { DhikrCounter } from "@/components/devotion/dhikr-counter";
import { FastingLog } from "@/components/devotion/fasting-log";
import { DuaList } from "@/components/devotion/dua-list";

export const dynamic = "force-dynamic";

export default async function DevotionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

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
              className="text-sm px-4 py-2 rounded-md text-white bg-white/10 transition hidden sm:inline"
            />
            <AuthNavLink
              href={`/${lang}/reflections`}
              label={dict["nav.reflections"] || "Reflections"}
              className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline"
            />
            <LanguageSelector currentLang={lang} />
          </div>
        </nav>
      </div>
      <div className="h-16" />
      <div className="px-6 py-8 space-y-12">
        <section>
          <h2 className="text-xs font-mono text-emerald-500 tracking-widest mb-4">DAILY PRAYERS</h2>
          <PrayerTracker />
        </section>
        <section>
          <h2 className="text-xs font-mono text-emerald-500 tracking-widest mb-4">DHIKR</h2>
          <DhikrCounter />
        </section>
        <section>
          <h2 className="text-xs font-mono text-emerald-500 tracking-widest mb-4">FASTING</h2>
          <FastingLog />
        </section>
        <section>
          <h2 className="text-xs font-mono text-emerald-500 tracking-widest mb-4">MY DUAS</h2>
          <DuaList />
        </section>
      </div>
    </div>
  );
}
