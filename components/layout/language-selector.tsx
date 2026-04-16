"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LANGUAGES, SUPPORTED_LOCALES } from "@/lib/i18n/languages";

interface Props {
  currentLang: string;
}

// Group languages by region for better UX
const REGIONS: { label: string; codes: string[] }[] = [
  { label: "Balkan", codes: ["sq", "bs", "hr", "sr", "mk", "bg", "ro", "el"] },
  { label: "Western European", codes: ["en", "fr", "de", "es", "pt", "it", "nl", "sv", "lt"] },
  { label: "Turkic", codes: ["tr", "az", "uz", "kk", "ky", "ug"] },
  { label: "Slavic", codes: ["ru", "uk", "be"] },
  { label: "Middle Eastern", codes: ["fa", "ur", "ps", "ku", "kmr", "he", "prs"] },
  { label: "South Asian", codes: ["hi", "bn", "ta", "te", "gu", "ml", "kn", "as", "pa", "si", "ne"] },
  { label: "East Asian", codes: ["zh", "ja", "ko"] },
  { label: "Southeast Asian", codes: ["id", "ms", "tl", "th", "vi", "km", "ceb", "mrw", "mdh"] },
  { label: "Central Asian & Caucasian", codes: ["tg", "ka", "kbd"] },
  { label: "African", codes: ["sw", "so", "am", "yo", "om", "mg", "ny", "mos", "ff", "ln", "ak", "rw", "rn", "dag", "aa"] },
];

export function LanguageSelector({ currentLang }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const current = LANGUAGES[currentLang];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLang(newLang: string) {
    if (newLang === currentLang) {
      setOpen(false);
      return;
    }
    // Replace the /[currentLang]/ segment with /[newLang]/
    const newPath = pathname.replace(new RegExp(`^/${currentLang}(/|$)`), `/${newLang}$1`);
    try {
      localStorage.setItem("kuran-locale", newLang);
    } catch {
      // ignore
    }
    setOpen(false);
    router.push(newPath);
  }

  const filteredRegions = search
    ? [{
        label: "Results",
        codes: SUPPORTED_LOCALES.filter((code) => {
          const lang = LANGUAGES[code];
          const q = search.toLowerCase();
          return (
            lang.name.toLowerCase().includes(q) ||
            lang.nameEn.toLowerCase().includes(q) ||
            code.toLowerCase().includes(q)
          );
        }),
      }]
    : REGIONS;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white rounded-md hover:bg-white/5 transition-colors"
        aria-label="Select language"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="font-medium">{current?.name || currentLang.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="fixed right-2 sm:absolute sm:right-0 top-12 w-[280px] max-h-[480px] rounded-lg border border-white/10 bg-gray-900 shadow-2xl overflow-hidden" style={{ zIndex: 9999 }}>
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-[400px]">
            {filteredRegions.map((region) => (
              <div key={region.label}>
                {!search && (
                  <p className="px-3 pt-3 pb-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                    {region.label}
                  </p>
                )}
                {region.codes.map((code) => {
                  const lang = LANGUAGES[code];
                  if (!lang) return null;
                  const isActive = code === currentLang;
                  return (
                    <button
                      key={code}
                      onClick={() => switchLang(code)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                      dir={lang.dir}
                    >
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-[10px] text-gray-500">{lang.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {filteredRegions[0]?.codes.length === 0 && (
              <p className="p-4 text-xs text-gray-500 text-center">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
