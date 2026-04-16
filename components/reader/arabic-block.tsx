"use client";

import { useMemo } from "react";
import type { Ayah } from "@/lib/quran/api";
import { useActiveAyah, useActiveWord } from "./recitation-provider";

interface ArabicBlockProps {
  ayahs: Ayah[];
}

function splitWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function toArabicDigits(n: number): string {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

export function ArabicBlock({ ayahs }: ArabicBlockProps) {
  const ayahWords = useMemo(
    () => ayahs.map((a) => splitWords(a.arabic_text)),
    [ayahs],
  );
  const activeAyah = useActiveAyah();
  const activeWord = useActiveWord();

  return (
    <div
      dir="rtl"
      className="text-right font-serif text-white/90 leading-[2.4] text-[1.7rem] selection:bg-emerald-500/30"
    >
      {ayahs.map((ayah, ayahIdx) => {
        const words = ayahWords[ayahIdx];
        const isActiveAyah = activeAyah === ayahIdx;
        return (
          <span
            key={ayah.id}
            data-ayah={ayahIdx}
            className={
              "inline transition-colors rounded-sm px-0.5 " +
              (isActiveAyah ? "bg-emerald-500/5" : "")
            }
          >
            {words.map((w, wi) => {
              const isActiveWord =
                !!activeWord && activeWord.ayahIndex === ayahIdx && activeWord.word === wi;
              const isPlayed =
                isActiveAyah &&
                !!activeWord &&
                activeWord.ayahIndex === ayahIdx &&
                wi < activeWord.word;
              return (
                <span
                  key={wi}
                  data-word={wi}
                  aria-current={isActiveWord ? "true" : undefined}
                  className={
                    "transition-colors duration-150 " +
                    (isActiveWord
                      ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : isPlayed
                      ? "text-white/85"
                      : isActiveAyah
                      ? "text-white/90"
                      : "text-gray-500")
                  }
                >
                  {w}
                  {wi < words.length - 1 ? " " : ""}
                </span>
              );
            })}
            <span className="inline-block text-emerald-400/80 text-base mx-1 align-middle select-none">
              ﴿{toArabicDigits(parseInt(ayah.aya, 10))}﴾
            </span>
            {" "}
          </span>
        );
      })}
    </div>
  );
}
