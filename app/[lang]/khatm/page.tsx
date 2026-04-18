import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LanguageSelector } from "@/components/layout/language-selector";
import { AuthNavLink } from "@/components/layout/auth-nav-link";
import {
  displayGoal,
  progressPercent,
  type Khatm,
  type ReadingDay,
} from "@/lib/quran/khatm";
import { SURAHS } from "@/lib/quran/surahs";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function KhatmListPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const supabase = await createClient();

  const { data: khatmsRaw } = await supabase
    .from("khatms")
    .select("*")
    .eq("archived", false)
    .order("updated_at", { ascending: false });

  const khatms = (khatmsRaw ?? []) as Khatm[];
  const ids = khatms.map((k) => k.id);

  const { data: daysRaw } =
    ids.length > 0
      ? await supabase.from("reading_days").select("*").in("khatm_id", ids)
      : { data: [] as ReadingDay[] };
  const days = (daysRaw ?? []) as ReadingDay[];

  const daysByKhatm = new Map<string, ReadingDay[]>();
  for (const row of days) {
    const list = daysByKhatm.get(row.khatm_id) || [];
    list.push(row);
    daysByKhatm.set(row.khatm_id, list);
  }

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
            <Link href={`/${lang}/khatm`} className="text-sm px-4 py-2 rounded-md text-white bg-white/10 transition hidden sm:inline">{dict["nav.khatm"] || "Khatm"}</Link>
            <AuthNavLink
              href={`/${lang}/devotion`}
              label={dict["nav.devotion"] || "Devotion"}
              className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline"
            />
            <AuthNavLink
              href={`/${lang}/reflections`}
              label={dict["nav.reflections"] || "Reflections"}
              className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline"
            />
            <LanguageSelector currentLang={lang} />
            <Link
              href={`/${lang}/khatm/new`}
              className="text-sm px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition"
            >
              + {dict["khatm.new"] || "New Khatm"}
            </Link>
          </div>
        </nav>
      </div>

      <div className="h-16" />

      <div className="px-6 py-10">
        <header className="mb-8">
          <p className="text-[10px] text-emerald-500 font-mono tracking-widest">
            {dict["khatm.label"] || "YOUR KHATMS"}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            {dict["khatm.title"] || "Khatm"}
          </h1>
          <p className="mt-2 text-sm text-gray-400 max-w-xl">
            {dict["khatm.subtitle"] ||
              "Track your journey through the Noble Quran. Set a daily goal, build a streak, and see your progress grow."}
          </p>
        </header>

        {khatms.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-lg font-semibold text-white">
              {dict["khatm.empty.title"] || "Start your first Khatm"}
            </p>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
              {dict["khatm.empty.desc"] ||
                "Pick a goal you can keep — a few ayahs a day, a juz a week, whatever fits your life. You can always change it."}
            </p>
            <Link
              href={`/${lang}/khatm/new`}
              className="inline-block mt-6 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition"
            >
              {dict["khatm.empty.cta"] || "Create a Khatm"}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {khatms.map((k) => {
              const kDays = daysByKhatm.get(k.id) ?? [];
              const pct = progressPercent(kDays);
              const currentSurahMeta = SURAHS.find((s) => s.number === k.current_surah);
              return (
                <Link
                  key={k.id}
                  href={`/${lang}/khatm/${k.id}`}
                  className="group rounded-xl border border-white/10 bg-white/5 hover:border-emerald-500/40 hover:bg-white/8 p-5 transition"
                >
                  <p className="text-base font-semibold text-white group-hover:text-emerald-400 transition">
                    {k.name}
                  </p>
                  <p className="mt-1 text-[11px] font-mono text-white/50">
                    {displayGoal(k.goal_unit, k.goal_per_day)}
                  </p>
                  <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-mono">
                    <span className="text-white/50">{pct.toFixed(1)}%</span>
                    <span className="text-white/50">
                      {currentSurahMeta
                        ? `${currentSurahMeta.transliteration} ${k.current_ayah}`
                        : `—`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
