"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Ayah } from "@/lib/quran/api";
import { useActiveAyah, useActiveWord } from "./recitation-provider";
import { AyahAiChat } from "./ayah-ai-chat";
import { AyahReflectButton } from "./ayah-reflect-button";

interface AyahByAyahBlockProps {
  ayahs: Ayah[];
  footnotesLabel: string;
  surah: number;
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

export function AyahByAyahBlock({ ayahs, footnotesLabel, surah }: AyahByAyahBlockProps) {
  const ayahWords = useMemo(
    () => ayahs.map((a) => splitWords(a.arabic_text)),
    [ayahs],
  );
  const activeAyah = useActiveAyah();
  const activeWord = useActiveWord();
  const [showFootnotes, setShowFootnotes] = useState(false);
  const [openAiChat, setOpenAiChat] = useState<number | null>(null);
  const ayahsWithFootnotes = ayahs.filter((a) => a.footnotes && a.footnotes.trim().length > 0);

  return (
    <div className="space-y-8">
      {ayahs.map((ayah, ayahIdx) => {
        const words = ayahWords[ayahIdx];
        const isActiveAyah = activeAyah === ayahIdx;

        return (
          <div
            key={ayah.id}
            data-ayah={ayahIdx}
            className={
              "rounded-xl px-4 py-4 transition-colors border " +
              (isActiveAyah
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "border-transparent")
            }
          >
            {/* Arabic text */}
            <div
              dir="rtl"
              className="text-right font-serif leading-[2.4] text-[1.7rem] selection:bg-emerald-500/30"
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
                        : "text-white/90")
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
            </div>

            {/* Translation */}
            <p
              dir="auto"
              className={
                "mt-3 text-base leading-relaxed transition-colors " +
                (isActiveAyah ? "text-emerald-300" : "text-gray-400")
              }
            >
              <sup className="text-[10px] text-emerald-500 font-mono mr-0.5">{ayah.aya}</sup>
              {ayah.translation}
            </p>

            {/* Action buttons */}
            <div className="mt-2 flex items-center gap-1">
              <button
                onClick={() => setOpenAiChat(openAiChat === ayahIdx ? null : ayahIdx)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  openAiChat === ayahIdx
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10"
                }`}
                aria-label="Ask AI about this ayah"
              >
                <Sparkles size={14} />
              </button>
              <AyahReflectButton surah={surah} ayah={parseInt(ayah.aya, 10)} />
            </div>

            {/* AI Chat panel */}
            {openAiChat === ayahIdx && (
              <AyahAiChat
                surah={surah}
                ayah={parseInt(ayah.aya, 10)}
                arabicText={ayah.arabic_text}
                translation={ayah.translation}
                onClose={() => setOpenAiChat(null)}
              />
            )}
          </div>
        );
      })}

      {/* Footnotes */}
      {ayahsWithFootnotes.length > 0 && (
        <div className="mt-6 border-t border-gray-800/40 pt-4">
          <button
            onClick={() => setShowFootnotes((v) => !v)}
            className="text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors font-mono"
          >
            {showFootnotes
              ? `— ${footnotesLabel} (${ayahsWithFootnotes.length})`
              : `+ ${footnotesLabel} (${ayahsWithFootnotes.length})`}
          </button>
          {showFootnotes && (
            <ul className="mt-3 space-y-2 text-xs text-gray-500 leading-relaxed">
              {ayahsWithFootnotes.map((a) => (
                <li key={a.id}>
                  <span className="text-emerald-400 font-mono mr-2">({a.aya})</span>
                  {a.footnotes}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
