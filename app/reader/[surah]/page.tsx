import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSurah } from "@/lib/quran/api";
import { SURAHS } from "@/lib/quran/surahs";
import { AyahDisplay } from "@/components/reader/ayah-display";

interface PageProps {
  params: Promise<{ surah: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { surah: surahParam } = await params;
  const surahNum = parseInt(surahParam, 10);
  const meta = SURAHS.find((s) => s.number === surahNum);
  if (!meta) return { title: "Nuk u gjet" };
  return { title: `${meta.transliteration} — ${meta.translation}` };
}

export default async function SurahPage({ params }: PageProps) {
  const { surah: surahParam } = await params;
  const surahNum = parseInt(surahParam, 10);
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) notFound();

  const meta = SURAHS.find((s) => s.number === surahNum);
  if (!meta) notFound();

  const ayahs = await fetchSurah(surahNum);

  const prev = surahNum > 1 ? SURAHS[surahNum - 2] : null;
  const next = surahNum < 114 ? SURAHS[surahNum] : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/reader" className="inline-block text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest mb-3 transition-colors">
          &larr; TE GJITHA SURET
        </Link>
        <h1 className="text-3xl font-bold">{meta.transliteration}</h1>
        <p className="text-xl font-serif text-gray-400 mt-1" dir="rtl">{meta.name}</p>
        <p className="text-sm text-gray-500 mt-2">
          {meta.translation} &bull; {meta.ayahCount} ajete &bull; {meta.revelationType}
        </p>
      </div>

      {/* Bismillah (skip for surah 9) */}
      {surahNum !== 9 && surahNum !== 1 && (
        <div className="text-center mb-6 py-4">
          <p className="text-lg font-serif text-emerald-400" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <p className="text-xs text-gray-500 mt-1">Me emrin e Allahut, te Gjithemeshirshmit, Meshireplotit</p>
        </div>
      )}

      {/* Ayahs */}
      <div className="space-y-3">
        {ayahs.map((ayah) => (
          <AyahDisplay key={ayah.id} ayah={ayah} />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-800/50">
        {prev ? (
          <Link href={`/reader/${prev.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            &larr; {prev.transliteration}
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/reader/${next.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            {next.transliteration} &rarr;
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
