import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SURAHS } from "@/lib/quran/surahs";
import {
  displayGoal,
  goalInAyahs,
  lastNDays,
  progressPercent,
  streakDays,
  todayReads,
  totalAyahsRead,
  TOTAL_AYAHS,
  type Khatm,
  type ReadingDay,
} from "@/lib/quran/khatm";
import { ProgressRing } from "@/components/khatm/progress-ring";
import { StatCard } from "@/components/khatm/stat-card";
import { DailyBars } from "@/components/khatm/daily-bars";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

export default async function KhatmDetailPage({ params }: PageProps) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang);
  const supabase = await createClient();

  const { data: khatmRaw } = await supabase
    .from("khatms")
    .select("*")
    .eq("id", id)
    .single();
  if (!khatmRaw) notFound();
  const khatm = khatmRaw as Khatm;

  const { data: daysRaw } = await supabase
    .from("reading_days")
    .select("*")
    .eq("khatm_id", id);
  const days = (daysRaw ?? []) as ReadingDay[];

  const pct = progressPercent(days);
  const totalRead = totalAyahsRead(days);
  const streak = streakDays(days);
  const todayCount = todayReads(days);
  const goalAyahs = goalInAyahs(khatm.goal_unit, khatm.goal_per_day);
  const last30 = lastNDays(days, 30);
  const currentSurahMeta = SURAHS.find((s) => s.number === khatm.current_surah);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <nav className="border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/${lang}/khatm`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono">
              &larr; {dict["khatm.title"] || "Khatm"}
            </Link>
          </div>
          <Link
            href={`/${lang}/khatm/${khatm.id}/read/${khatm.current_surah}`}
            className="text-sm px-5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition shadow-md shadow-emerald-500/20"
          >
            {dict["khatm.resume"] || "Continue reading"} →
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">{khatm.name}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {displayGoal(khatm.goal_unit, khatm.goal_per_day)}
            {khatm.target_completion_at ? (
              <> · target {new Date(khatm.target_completion_at).toLocaleDateString()}</>
            ) : null}
          </p>
        </header>

        {/* Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center">
            <ProgressRing
              percent={pct}
              size={140}
              label={`${pct.toFixed(1)}%`}
              sublabel={`${totalRead} / ${TOTAL_AYAHS}`}
            />
            <p className="mt-3 text-[10px] font-mono text-white/50 tracking-widest">
              {dict["khatm.progress"] || "PROGRESS"}
            </p>
          </div>

          <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <StatCard
              label={dict["khatm.streak"] || "STREAK"}
              value={`${streak}d`}
              hint={streak === 0 ? "Read today to start" : "Keep it going"}
              accent="amber"
            />
            <StatCard
              label={dict["khatm.today"] || "TODAY"}
              value={`${todayCount}/${goalAyahs}`}
              hint={todayCount >= goalAyahs ? "Goal met ✓" : `${Math.max(0, goalAyahs - todayCount)} to go`}
              accent={todayCount >= goalAyahs ? "emerald" : "blue"}
            />
            <StatCard
              label={dict["khatm.position"] || "POSITION"}
              value={currentSurahMeta ? currentSurahMeta.transliteration : `Surah ${khatm.current_surah}`}
              hint={`Ayah ${khatm.current_ayah}`}
              accent="purple"
            />
            <div className="col-span-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-mono text-white/50 tracking-widest mb-2">
                {dict["khatm.last30"] || "LAST 30 DAYS"}
              </p>
              <DailyBars data={last30} goal={goalAyahs} height={72} />
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${lang}/khatm/${khatm.id}/read/${khatm.current_surah}`}
            className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition"
          >
            {dict["khatm.resume"] || "Continue reading"} →
          </Link>
          <Link
            href={`/${lang}/${khatm.current_surah}`}
            className="px-4 py-2 rounded-md border border-white/10 hover:bg-white/5 text-sm text-gray-300 transition"
          >
            {dict["khatm.openPlain"] || "Open plain reader"}
          </Link>
        </div>
      </div>
    </div>
  );
}
