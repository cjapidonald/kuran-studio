import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LANGUAGES } from "@/lib/i18n/languages";
import { SURAHS } from "@/lib/quran/surahs";
import { fetchSurah } from "@/lib/quran/api";
import { ArabicBlock } from "@/components/reader/arabic-block";
import { TranslationParagraph } from "@/components/reader/translation-paragraph";
import { ReadingTracker } from "@/components/khatm/reading-tracker";
import type { Khatm } from "@/lib/quran/khatm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string; id: string; surah: string }>;
}

export default async function KhatmReaderPage({ params }: PageProps) {
  const { lang, id, surah: surahParam } = await params;
  const surahNum = parseInt(surahParam, 10);
  if (Number.isNaN(surahNum) || surahNum < 1 || surahNum > 114) notFound();

  const meta = SURAHS.find((s) => s.number === surahNum);
  const language = LANGUAGES[lang];
  if (!meta || !language) notFound();

  const dict = await getDictionary(lang);
  const supabase = await createClient();

  const { data: khatmRaw } = await supabase
    .from("khatms")
    .select("id, name, goal_unit, goal_per_day, current_surah, current_ayah")
    .eq("id", id)
    .single();
  if (!khatmRaw) notFound();
  const khatm = khatmRaw as Pick<
    Khatm,
    "id" | "name" | "goal_unit" | "goal_per_day" | "current_surah" | "current_ayah"
  >;

  const ayahs = await fetchSurah(language.translationKey, surahNum);
  const prev = surahNum > 1 ? SURAHS[surahNum - 2] : null;
  const next = surahNum < 114 ? SURAHS[surahNum] : null;
  const surahName = dict[`surah.${meta.number}`] || meta.transliteration;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <ReadingTracker khatmId={khatm.id} surah={surahNum} />

      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <Link
            href={`/${lang}/khatm/${khatm.id}`}
            className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest transition-colors"
          >
            &larr; {khatm.name}
          </Link>
          <span className="text-[10px] text-white/40 font-mono">
            {dict["khatm.tracked"] || "recording"}
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{meta.transliteration}</h1>
          <p className="text-xl font-serif text-gray-400 mt-1" dir="rtl">
            {meta.name}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {surahName} &bull; {meta.ayahCount} {dict["reader.ayahs"] || "ayahs"}
          </p>
        </div>

        {surahNum !== 9 && surahNum !== 1 && (
          <div className="text-center mb-6 py-4">
            <p className="text-lg font-serif text-emerald-400" dir="rtl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        )}

        <ArabicBlock ayahs={ayahs} />
        <TranslationParagraph
          ayahs={ayahs}
          footnotesLabel={dict["reader.footnotes"] || "Footnotes"}
        />

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-800/50">
          {prev ? (
            <Link
              href={`/${lang}/khatm/${khatm.id}/read/${prev.number}`}
              className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              &larr; {prev.transliteration}
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/${lang}/khatm/${khatm.id}/read/${next.number}`}
              className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
            >
              {next.transliteration} &rarr;
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
