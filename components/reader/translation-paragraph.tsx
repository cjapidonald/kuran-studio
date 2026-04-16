"use client";

import { useState } from "react";
import type { Ayah } from "@/lib/quran/api";
import { useActiveAyah } from "./recitation-provider";

interface TranslationParagraphProps {
  ayahs: Ayah[];
  footnotesLabel: string;
}

export function TranslationParagraph({ ayahs, footnotesLabel }: TranslationParagraphProps) {
  const activeAyah = useActiveAyah();
  const [showFootnotes, setShowFootnotes] = useState(false);
  const ayahsWithFootnotes = ayahs.filter((a) => a.footnotes && a.footnotes.trim().length > 0);

  return (
    <div className="mt-10">
      <p className="text-base text-gray-300 leading-relaxed">
        {ayahs.map((ayah, ayahIdx) => {
          const isActive = activeAyah === ayahIdx;
          return (
            <span
              key={ayah.id}
              data-ayah={ayahIdx}
              dir="auto"
              className={
                "transition-colors rounded-sm px-0.5 " +
                (isActive ? "bg-emerald-500/10 text-emerald-300" : "")
              }
            >
              <sup className="text-[10px] text-emerald-500 font-mono mx-0.5">{ayah.aya}</sup>
              {ayah.translation}
              {" "}
            </span>
          );
        })}
      </p>

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
