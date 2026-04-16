import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSurah } from "@/lib/quran/api";
import { SURAHS } from "@/lib/quran/surahs";
import { getSurahDescription, getRelatedSurahs } from "@/lib/quran/descriptions";
import { LANGUAGES, SUPPORTED_LOCALES } from "@/lib/i18n/languages";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AyahDisplay } from "@/components/reader/ayah-display";
import { LanguageSelector } from "@/components/layout/language-selector";
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

  // Unique description per surah (from Supabase), falls back to template
  const uniqueDesc = await getSurahDescription(lang, surahNum);
  const description =
    uniqueDesc ||
    `${meta.transliteration} (${meta.name}) - ${surahName}. ${meta.ayahCount} ${dict["reader.ayahs"]}.`;

  const url = `https://kuran.studio/${lang}/${surahNum}`;
  const ogTitle = `${meta.transliteration} - ${surahName} | Kuran.studio`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `https://kuran.studio/${l}/${surahNum}`])
      ),
    },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: "Kuran.studio",
      locale: lang,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
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

  const relatedSurahNumbers = await getRelatedSurahs(surahNum, 4);
  const related = relatedSurahNumbers
    .map((n) => SURAHS.find((s) => s.number === n))
    .filter((s): s is (typeof SURAHS)[number] => Boolean(s));

  const surahName = dict[`surah.${meta.number}`] || meta.transliteration;
  const revelationLabel = meta.revelationType === "meccan" ? dict["reader.meccan"] : dict["reader.medinan"];

  const chapterJsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: meta.transliteration,
    alternateName: meta.name,
    position: meta.number,
    inLanguage: lang,
    isPartOf: {
      "@type": "Book",
      "@id": "https://kuran.studio#the-quran",
      name: "The Quran",
      alternateName: "القرآن الكريم",
      inLanguage: "ar",
    },
    url: `https://kuran.studio/${lang}/${surahNum}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict["site.name"] || "Kuran.studio", item: `https://kuran.studio/${lang}` },
      { "@type": "ListItem", position: 2, name: dict["reader.title"] || "Quran", item: `https://kuran.studio/${lang}` },
      { "@type": "ListItem", position: 3, name: `${meta.transliteration} - ${surahName}`, item: `https://kuran.studio/${lang}/${surahNum}` },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Header bar */}
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <Link href={`/${lang}`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest transition-colors shrink-0">
            &larr; {dict["reader.back"]}
          </Link>
          <span className="text-xs text-gray-500 font-mono hidden sm:inline">{meta.transliteration}</span>
          <LanguageSelector currentLang={lang} />
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

        {/* Related Surahs */}
        {related.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-800/30">
            <h2 className="text-xs font-mono text-emerald-500 tracking-widest mb-4">RELATED SURAHS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((r) => {
                const name = dict[`surah.${r.number}`] || r.transliteration;
                return (
                  <Link
                    key={r.number}
                    href={`/${lang}/${r.number}`}
                    className="group bg-gray-900/50 border border-gray-800/50 hover:border-emerald-500/40 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
                        {r.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {r.transliteration}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{name}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Browse all surahs link */}
        <div className="mt-10 pt-6 border-t border-gray-800/30 text-center">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Browse all 114 surahs
          </Link>
        </div>
      </div>
    </div>
  );
}
