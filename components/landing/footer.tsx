import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-800/50 py-10 px-6 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <p className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-xs text-gray-950 font-black">Q</span>
              Kurani<span className="text-emerald-400">.</span>
            </p>
            <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
              Platforma e pare dixhitale per te lexuar dhe studiuar Kuranin Fisnik ne gjuhen shqipe.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Platforma</p>
            <div className="space-y-2">
              <Link href="/#features" className="block text-sm text-gray-500 hover:text-white transition">Vecori</Link>
              <Link href="/#about" className="block text-sm text-gray-500 hover:text-white transition">Rreth Nesh</Link>
              <Link href="/login" className="block text-sm text-gray-500 hover:text-white transition">Hyr</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ligjore</p>
            <div className="space-y-2">
              <span className="block text-sm text-gray-500">Politika e Privatesise</span>
              <span className="block text-sm text-gray-500">Kushtet e Perdorimit</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>Krijuar nga <span className="text-gray-400">Donald Cjapi</span></p>
          <p>&copy; 2026 Kurani.studio. Te gjitha te drejtat te rezervuara.</p>
          <p className="font-mono">kurani.studio</p>
        </div>
      </div>
    </footer>
  );
}
