import Link from "next/link";
import { PrayerTracker } from "@/components/devotion/prayer-tracker";
import { DhikrCounter } from "@/components/devotion/dhikr-counter";
import { FastingLog } from "@/components/devotion/fasting-log";
import { DuaList } from "@/components/devotion/dua-list";

export const dynamic = "force-dynamic";

export default async function DevotionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest">&larr; Home</Link>
          <span className="text-sm font-semibold text-white">Devotion</span>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-12">
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
