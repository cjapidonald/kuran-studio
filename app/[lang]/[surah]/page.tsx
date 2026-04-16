import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSurah } from "@/lib/quran/api";
import { SURAHS } from "@/lib/quran/surahs";
import { LANGUAGES, SUPPORTED_LOCALES } from "@/lib/i18n/languages";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AyahDisplay } from "@/components/reader/ayah-display";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ lang: string; surah: string }>;
}

export async function generateStaticParams() {
  const priorityLocales = ["sq", "en", "fr", "de", "tr", "es", "ar", "ru", "id", "ur"];
  const params: { lang: string; surah: string }[] = [];

  for (const lang of priorityLocales) {
    if (LANGUAGES[lang]) {
      for (let i = 1; i <= 114; i++) {
        params.push({ lang, surah: String(i) });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, surah: surahParam } = await params;
  const surahNum = parseInt(surahParam, 10);
  const meta = SURAHS.find((s) => s.number === surahNum);
  const dict = await getDictionary(lang);

  if (!meta) return { title: dict["reader.not_found"] };

  const surahName = dict[`surah.${meta.number}`] || meta.transliteration;
  const title = `${meta.transliteration} - ${surahName}`;

  return {
    title,
    description: `${meta.transliteration} (${meta.name}) - ${surahName}. ${meta.ayahCount} ${dict["reader.ayahs"]}.`,
    alternates: {
      canonical: `https://kuran.studio/${lang}/${surahNum}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `https://kuran.studio/${l}/${surahNum}`])
      ),
    },
    openGraph: {
      title: `${meta.transliteration} - ${surahName} | Kuran.studio`,
      locale: lang,
    },
  };
}

export const revalidate = 86400;

export default async function SurahPage({ params }: PageProps) {
  const { lang, surah: surahParam } = await params;
  const surahNum = parseInt(surahParam, 10);
  if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) notFound();

  const meta = SURAHS.find((s) => s.number === surahNum);
  if (!meta) notFound();

  const language = LANGUAGES[lang];
  if (!language) notFound();

  const dict = await getDictionary(lang);
  const ayahs = await fetchSurah(language.translationKey, surahNum);

  const prev = surahNum > 1 ? SURAHS[surahNum - 2] : null;
  const next = surahNum < 114 ? SURAHS[surahNum] : null;

  const surahName = dict[`surah.${meta.number}`] || meta.transliteration;
  const revelationLabel = meta.revelationType === "meccan" ? dict["reader.meccan"] : dict["reader.medinan"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: meta.transliteration,
    alternateName: meta.name,
    position: meta.number,
    inLanguage: lang,
    isPartOf: {
      "@type": "Book",
      name: "The Quran",
      alternateName: "القرآن الكريم",
    },
    url: `https://kuran.studio/${lang}/${surahNum}`,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header bar */}
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest transition-colors">
            &larr; {dict["reader.back"]}
          </Link>
          <span className="text-xs text-gray-500 font-mono">{meta.transliteration}</span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Surah header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{meta.transliteration}</h1>
          <p className="text-xl font-serif text-gray-400 mt-1" dir="rtl">{meta.name}</p>
          <p className="text-sm text-gray-500 mt-2">
            {surahName} &bull; {meta.ayahCount} {dict["reader.ayahs"]} &bull; {revelationLabel}
          </p>
        </div>

        {/* Bismillah */}
        {surahNum !== 9 && surahNum !== 1 && (
          <div className="text-center mb-6 py-4">
            <p className="text-lg font-serif text-emerald-400" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          </div>
        )}

        {/* Ayahs */}
        <div className="space-y-3">
          {ayahs.map((ayah) => (
            <AyahDisplay key={ayah.id} ayah={ayah} footnotesLabel={dict["reader.footnotes"]} />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-800/50">
          {prev ? (
            <Link href={`/${lang}/${prev.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
              &larr; {prev.transliteration}
            </Link>
          ) : <div />}
          {next ? (
            <Link href={`/${lang}/${next.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
              {next.transliteration} &rarr;
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
