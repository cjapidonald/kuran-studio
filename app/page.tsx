import Link from "next/link";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { FadeIn } from "@/components/landing/fade-in";

function ReaderMockup() {
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
            kurani.studio/reader/1
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="text-center">
          <p className="text-emerald-400 text-[10px] font-mono tracking-widest mb-1">SURJA 1</p>
          <p className="text-white font-semibold text-sm">El-Fatiha</p>
          <p className="text-gray-500 text-[10px]">Hapja &bull; 7 ajete &bull; Mekke</p>
        </div>
        <div className="space-y-3">
          {[
            { ar: "\u0628\u0650\u0633\u06e1\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u06e1\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650", sq: "Me emrin e Allahut, te Gjithemeshirshmit, Meshireplotit!", n: 1 },
            { ar: "\u0671\u0644\u06e1\u062d\u064e\u0645\u06e1\u062f\u064f \u0644\u0650\u0644\u0651\u064e\u0647\u0650 \u0631\u064e\u0628\u0651\u0650 \u0671\u0644\u06e1\u0639\u064e\u0670\u0644\u064e\u0645\u0650\u064a\u0646\u064e", sq: "Falenderimi i takon Allahut, Zotit te boteve!", n: 2 },
            { ar: "\u0671\u0644\u0631\u0651\u064e\u062d\u06e1\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650", sq: "Te Gjithemeshirshmit, Meshireplotit!", n: 3 },
          ].map((a) => (
            <div key={a.n} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] flex items-center justify-center font-mono">{a.n}</span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-right text-white text-sm leading-loose font-serif" dir="rtl">{a.ar}</p>
                  <p className="text-gray-400 text-[11px] leading-relaxed">{a.sq}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <LandingNav />

      {/* Hero */}
      <section className="relative py-16 px-6">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#6B7280"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-800 bg-gray-900/50 text-xs text-gray-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Perkthimi shqip nga Hasan Efendi Nahi
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
            Lexo Kuranin<br />
            <span className="text-emerald-400">ne shqip</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
            Platforma e pare dixhitale per te lexuar dhe studiuar Kuranin Fisnik ne gjuhen shqipe.
          </p>

          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/login" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-base transition shadow-lg shadow-emerald-500/20">
              Fillo Leximin
            </Link>
            <a href="#features" className="px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 rounded-lg transition">
              Meso Me Shume
            </a>
          </div>
        </div>
      </section>

      {/* Browser Mockup */}
      <section className="px-6 pb-20 max-w-5xl mx-auto relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#10B981"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full" />
        <FadeIn>
          <div className="relative flex items-center gap-10">
            <div className="flex-1 min-w-[240px] hidden md:block">
              <p className="text-[10px] text-emerald-500 font-mono tracking-widest mb-3">LEXUESI KURANOR</p>
              <h3 className="text-2xl font-bold leading-tight">
                Kurani Fisnik<br />ne ekranin tend<span className="text-emerald-400">.</span>
              </h3>
              <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                Lexo 114 suret me perkthimin shqip, tekst arabisht, dhe shenime. Pa reklama, pa pengesa.
              </p>
              <div className="mt-6 flex gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-500">114 Sure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-500">6236 Ajete</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-xs text-gray-500">Shenime</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-[55%] shrink-0">
              <ReaderMockup />
              <p className="text-center text-[10px] text-gray-600 mt-2 font-mono">Kurani.studio &mdash; Lexuesi</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#60A5FA"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <FadeIn>
            <p className="text-center text-xs text-emerald-500 font-mono tracking-widest mb-2">VECORI</p>
            <h2 className="text-center text-3xl font-bold mb-12">Gjithcka ne nje vend</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "01", color: "border-emerald-500/30 hover:border-emerald-500/60", title: "Lexues i Thjeshte", desc: "Lexo suret dhe ajetet me nderfaqe te paster dhe te qarte. Arabic dhe shqip krah per krah." },
              { icon: "02", color: "border-blue-500/30 hover:border-blue-500/60", title: "Kerkim i Avancuar", desc: "Gjej ajete dhe tema ne te gjithe Kuranin. Kerkoni ne shqip ose arabisht." },
              { icon: "03", color: "border-purple-500/30 hover:border-purple-500/60", title: "Ruaj Progresin", desc: "Ruaj faqeruajtesat tuaja dhe kthehu me vone aty ku e ke lene leximin." },
              { icon: "04", color: "border-amber-500/30 hover:border-amber-500/60", title: "Tema Dite / Nate", desc: "Kalo midis temes se drites dhe te erresires per lexim te rehatshem ne cdo kohe." },
              { icon: "05", color: "border-cyan-500/30 hover:border-cyan-500/60", title: "Perkthim Shqip", desc: "Perkthimi i plote nga Hasan Efendi Nahi me shenime dhe komente te detajuara." },
              { icon: "06", color: "border-pink-500/30 hover:border-pink-500/60", title: "Shenim & Reflektime", desc: "Shto shenimet tuaja personale per cdo ajet qe lexon." },
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
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#34D399"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeIn>
            <p className="text-center text-xs text-emerald-500 font-mono tracking-widest mb-2">SI FUNKSIONON</p>
            <h2 className="text-center text-3xl font-bold mb-12">Tri hapa per te filluar</h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Regjistrohu", desc: "Krijo nje llogari me Google. Falas dhe e shpejte.", color: "text-emerald-500" },
              { step: "02", title: "Zgjidh Suren", desc: "Shfleto 114 suret e Kuranit Fisnik dhe zgjidh cilen deshiron te lexosh.", color: "text-blue-500" },
              { step: "03", title: "Fillo Leximin", desc: "Lexo ajetet ne arabisht me perkthim shqip. Shto shenime dhe ruaj progresin.", color: "text-amber-500" },
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
          <FlickeringGrid
            className="relative inset-0 z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#10B981"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>
        <FadeIn>
          <div className="relative">
            <h2 className="text-4xl font-bold">Fillo udhetimin tend</h2>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              Bashkohu me lexuesit e Kuranit ne shqip. Falas pergjithmone.
            </p>
            <Link href="/login" className="inline-block mt-8 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-lg transition shadow-lg shadow-emerald-500/20">
              Regjistrohu falas
            </Link>
            <p className="mt-3 text-[10px] text-gray-600">Nuk kerkohet karte krediti</p>
          </div>
        </FadeIn>
      </section>

      <LandingFooter />
    </div>
  );
}
