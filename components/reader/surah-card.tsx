"use client";

import Link from "next/link";
import type { SurahMeta } from "@/lib/quran/surahs";

export function SurahCard({ surah }: { surah: SurahMeta }) {
  return (
    <Link href={`/reader/${surah.number}`}>
      <div className="group bg-gray-900/50 dark:bg-white/3 border border-gray-800 dark:border-white/6 hover:border-emerald-500/40 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold font-mono">
            {surah.number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                {surah.transliteration}
              </h3>
              <span className="text-right text-base font-serif text-gray-400 shrink-0" dir="rtl">
                {surah.name}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{surah.translation}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-gray-600 font-mono">{surah.ayahCount} ajete</span>
              <span className="text-[10px] text-gray-700">&bull;</span>
              <span className="text-[10px] text-gray-600 font-mono">{surah.revelationType}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
