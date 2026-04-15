"use client";

import { useState } from "react";
import type { Ayah } from "@/lib/quran/api";

export function AyahDisplay({ ayah }: { ayah: Ayah }) {
  const [showFootnotes, setShowFootnotes] = useState(false);
  const hasFootnotes = ayah.footnotes && ayah.footnotes.trim().length > 0;

  return (
    <div className="bg-gray-900/30 dark:bg-white/2 border border-gray-800/50 dark:border-white/5 rounded-xl p-4 transition-colors hover:border-emerald-500/20">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 text-xs flex items-center justify-center font-mono font-bold">
          {ayah.aya}
        </span>
        <div className="flex-1 space-y-3">
          <p className="text-right text-xl leading-[2.2] text-white font-serif" dir="rtl">
            {ayah.arabic_text}
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            {ayah.translation}
          </p>
          {hasFootnotes && (
            <>
              <button
                onClick={() => setShowFootnotes(!showFootnotes)}
                className="text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors font-mono"
              >
                {showFootnotes ? "Fshih shenimet" : "Shiko shenimet"}
              </button>
              {showFootnotes && (
                <div className="text-xs text-gray-500 leading-relaxed bg-gray-800/30 rounded-lg p-3 border border-gray-800/50">
                  {ayah.footnotes}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
