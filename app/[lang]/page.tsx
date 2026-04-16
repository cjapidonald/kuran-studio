import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LANGUAGES, SUPPORTED_LOCALES } from "@/lib/i18n/languages";
import { LandingFooter } from "@/components/landing/footer";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { FadeIn } from "@/components/landing/fade-in";
import { LanguageSelector } from "@/components/layout/language-selector";
import { fetchReciters, fetchRecitation, pickDefaultReciter } from "@/lib/quran/recitations";
import { RecitationProvider } from "@/components/reader/recitation-provider";
import { ReciterPlayer } from "@/components/reader/reciter-player";

interface PageProps {
  params: Promise<{ lang: string }>;
}

function ReaderMockup({ dict, lang }: { dict: Record<string, string>; lang: string }) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-900 overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 border-b border-gray-700/50">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/80" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
          <div className="w-2 h-2 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 mx-6">
          <div className="bg-gray-700/50 rounded px-2 py-0.5 text-[8px] text-gray-400 text-center font-mono">
            kuran.studio/{lang}/1
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="text-center">
          <p className="text-emerald-400 text-[10px] font-mono tracking-widest mb-1">SURAH 1</p>
          <p className="text-white font-semibold text-sm">Al-Fatiha</p>
          <p className="text-gray-500 text-[10px]">{dict["surah.1"]} &bull; 7 {dict["reader.ayahs"]}</p>
        </div>
        <div className="space-y-3">
          {[
            { ar: "\u0628\u0650\u0633\u06e1\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u06e1\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650", n: 1 },
            { ar: "\u0671\u0644\u06e1\u062d\u064e\u0645\u06e1\u062f\u064f \u0644\u0650\u0644\u0651\u064e\u0647\u0650 \u0631\u064e\u0628\u0651\u0650 \u0671\u0644\u06e1\u0639\u064e\u0670\u0644\u064e\u0645\u0650\u064a\u0646\u064e", n: 2 },
            { ar: "\u0671\u0644\u0631\u0651\u064e\u062d\u06e1\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650", n: 3 },
          ].map((a) => (
            <div key={a.n} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] flex items-center justify-center font-mono">{a.n}</span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-right text-white text-sm leading-loose font-serif" dir="rtl">{a.ar}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  // Sample player: Al-Fatiha with default reciter.
  const reciters = await fetchReciters();
  const defaultReciter = pickDefaultReciter(reciters);
  const initialRecitation = defaultReciter
    ? await fetchRecitation(defaultReciter.slug, 1)
    : [];
  const hasPlayer = Boolean(defaultReciter) && initialRecitation.length > 0;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://kuran.studio#website",
    name: dict["site.name"] || "Kuran.studio",
    alternateName: "Kuran Studio",
    url: `https://kuran.studio/${lang}`,
    inLanguage: lang,
    description: dict["site.description"],
    publisher: { "@id": "https://kuran.studio#organization" },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://kuran.studio/${lang}/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://kuran.studio#organization",
    name: "Kuran.studio",
    url: "https://kuran.studio",
    logo: "https://kuran.studio/icon.png",
    sameAs: ["https://github.com/cjapidonald/kuran-studio"],
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <span className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
          <span className="font-bold text-white text-base">Kuran<span className="text-emerald-400">.</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/${lang}`} className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline">{dict["nav.home"] || "Home"}</Link>
          <a href={`/${lang}#features`} className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline">{dict["nav.features"]}</a>
          <Link href={`/${lang}/blog`} className="text-sm px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition hidden sm:inline">{dict["nav.blog"]}</Link>
          <LanguageSelector currentLang={lang} />
          <Link href={`/${lang}/login`} className="text-sm px-5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition shadow-md shadow-emerald-500/20">
            {dict["nav.login"]}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-16 px-6">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid className="relative inset-0 z-0 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]" squareSize={4} gridGap={6} color="#10B981" maxOpacity={0.5} flickerChance={0.1} />
        </div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full" />

        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Left: text + CTAs */}
          <div className="text-left">
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-800 bg-gray-900/50 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {dict["landing.badge"]}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
              {dict["landing.title.line1"]}<br />
              <span className="text-emerald-400">{dict["landing.title.line2"]}</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-lg leading-relaxed">
              {dict["landing.subtitle"]}
            </p>

            <div className="mt-8 flex gap-3">
              <Link href={`/${lang}/1`} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-base transition shadow-lg shadow-emerald-500/20">
                {dict["landing.cta.start"]}
              </Link>
              <a href={`/${lang}#features`} className="px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 rounded-lg transition">
                {dict["landing.cta.learn"]}
              </a>
            </div>
          </div>

          {/* Right: sample player */}
          <div className="flex md:justify-end justify-center">
            {hasPlayer && defaultReciter ? (
              <RecitationProvider
                surah={1}
                reciters={reciters}
                initialReciter={defaultReciter}
                initialRecitation={initialRecitation}
                disableGlobalShortcuts
              >
                <div className="w-full max-w-sm">
                  <p className="text-[10px] text-emerald-500 font-mono tracking-widest mb-3 text-center md:text-right">
                    AL-FATIHA &middot; {defaultReciter.display_name.split(" ").slice(-2).join(" ")}
                  </p>
                  <div className="flex md:justify-end justify-center">
                    <ReciterPlayer defaultExpanded />
                  </div>
                </div>
              </RecitationProvider>
            ) : null}
          </div>
        </div>
      </section>

      {/* Browser Mockup */}
      <section className="px-6 pb-20 max-w-5xl mx-auto relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]" squareSize={4} gridGap={6} color="#A855F7" maxOpacity={0.5} flickerChance={0.1} />
        </div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full" />
        <FadeIn>
          <div className="relative flex items-center gap-10">
            <div className="flex-1 min-w-[240px] hidden md:block">
              <p className="text-[10px] text-emerald-500 font-mono tracking-widest mb-3">{dict["landing.mockup.label"]}</p>
              <h3 className="text-2xl font-bold leading-tight">
                {dict["landing.mockup.title"]}<br />{dict["landing.mockup.title2"]}
              </h3>
              <p className="mt-4 text-sm text-gray-400 leading-relaxed">{dict["landing.mockup.desc"]}</p>
              <div className="mt-6 flex gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500">{dict["landing.mockup.surahs"]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-500">{dict["landing.mockup.ayahs"]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-xs text-gray-500">{dict["landing.mockup.notes"]}</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-[55%] shrink-0">
              <ReaderMockup dict={dict} lang={lang} />
              <p className="text-center text-[10px] text-gray-600 mt-2 font-mono">Kuran.studio &mdash; {dict["nav.reader"]}</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]" squareSize={4} gridGap={6} color="#60A5FA" maxOpacity={0.5} flickerChance={0.1} />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <FadeIn>
            <p className="text-center text-xs text-emerald-500 font-mono tracking-widest mb-2">{dict["landing.features.label"]}</p>
            <h2 className="text-center text-3xl font-bold mb-12">{dict["landing.features.title"]}</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "01", color: "border-emerald-500/30 hover:border-emerald-500/60", title: dict["landing.features.1.title"], desc: dict["landing.features.1.desc"] },
              { icon: "02", color: "border-blue-500/30 hover:border-blue-500/60", title: dict["landing.features.2.title"], desc: dict["landing.features.2.desc"] },
              { icon: "03", color: "border-purple-500/30 hover:border-purple-500/60", title: dict["landing.features.3.title"], desc: dict["landing.features.3.desc"] },
              { icon: "04", color: "border-amber-500/30 hover:border-amber-500/60", title: dict["landing.features.4.title"], desc: dict["landing.features.4.desc"] },
              { icon: "05", color: "border-cyan-500/30 hover:border-cyan-500/60", title: dict["landing.features.5.title"], desc: dict["landing.features.5.desc"] },
              { icon: "06", color: "border-pink-500/30 hover:border-pink-500/60", title: dict["landing.features.6.title"], desc: dict["landing.features.6.desc"] },
            ].map((f, i) => (
              <FadeIn key={f.icon} delay={i * 100}>
                <div className={`bg-gray-900/50 border ${f.color} rounded-xl p-5 transition-all`}>
                  <span className="text-[10px] font-mono text-gray-600">{f.icon}</span>
                  <h3 className="mt-2 font-semibold text-sm">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]" squareSize={4} gridGap={6} color="#34D399" maxOpacity={0.5} flickerChance={0.1} />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeIn>
            <p className="text-center text-xs text-emerald-500 font-mono tracking-widest mb-2">{dict["landing.howto.label"]}</p>
            <h2 className="text-center text-3xl font-bold mb-12">{dict["landing.howto.title"]}</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: dict["landing.howto.1.title"], desc: dict["landing.howto.1.desc"], color: "text-emerald-500" },
              { step: "02", title: dict["landing.howto.2.title"], desc: dict["landing.howto.2.desc"], color: "text-blue-500" },
              { step: "03", title: dict["landing.howto.3.title"], desc: dict["landing.howto.3.desc"], color: "text-amber-500" },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 150}>
                <div className="relative">
                  <span className={`text-5xl font-black ${s.color} opacity-10`}>{s.step}</span>
                  <h3 className="mt-1 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]" squareSize={4} gridGap={6} color="#10B981" maxOpacity={0.5} flickerChance={0.1} />
        </div>
        <FadeIn>
          <div className="relative">
            <h2 className="text-4xl font-bold">{dict["landing.cta2.title"]}</h2>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">{dict["landing.cta2.subtitle"]}</p>
            <Link href={`/${lang}/login`} className="inline-block mt-8 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-lg transition shadow-lg shadow-emerald-500/20">
              {dict["landing.cta.register"]}
            </Link>
            <p className="mt-3 text-[10px] text-gray-600">{dict["landing.cta.nocredit"]}</p>
          </div>
        </FadeIn>
      </section>

      <LandingFooter lang={lang} dict={dict} />
    </div>
  );
}
