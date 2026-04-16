import Link from "next/link";

interface FooterProps {
  lang?: string;
  dict?: Record<string, string>;
}

export function LandingFooter({ lang = "en", dict }: FooterProps) {
  const t = (key: string, fallback: string) => dict?.[key] || fallback;

  return (
    <footer className="border-t border-gray-800/50 py-10 px-6 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <p className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-xs text-gray-950 font-black">Q</span>
              Kuran<span className="text-emerald-400">.</span>
            </p>
            <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
              {t("site.description", "Read and study the Noble Quran online with translations in 80+ languages.")}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("footer.platform", "Platform")}</p>
            <div className="space-y-2">
              <Link href={`/${lang}#features`} className="block text-sm text-gray-500 hover:text-white transition">{t("nav.features", "Features")}</Link>
              <Link href={`/${lang}#about`} className="block text-sm text-gray-500 hover:text-white transition">{t("nav.about", "About")}</Link>
              <Link href={`/${lang}/login`} className="block text-sm text-gray-500 hover:text-white transition">{t("nav.login", "Sign In")}</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("footer.legal", "Legal")}</p>
            <div className="space-y-2">
              <span className="block text-sm text-gray-500">{t("footer.privacy", "Privacy Policy")}</span>
              <span className="block text-sm text-gray-500">{t("footer.terms", "Terms of Service")}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>{t("footer.created", "Created by")} <span className="text-gray-400">Donald Cjapi</span></p>
          <p>&copy; 2026 Kuran.studio. {t("footer.rights", "All rights reserved.")}</p>
          <p className="font-mono">kuran.studio</p>
        </div>
      </div>
    </footer>
  );
}
