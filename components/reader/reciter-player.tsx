"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  usePlayerActions,
  usePlayerState,
  useReciterList,
  useRecitationArray,
  useTotalAyahs,
} from "./recitation-provider";
import { SURAHS } from "@/lib/quran/surahs";
import { fetchSurah, type Ayah, type TranslationOption } from "@/lib/quran/api";

const ARABIC_KEY = "arabic_source";

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ReciterPlayer({
  defaultExpanded = false,
  showSurahControls = false,
  translations,
  initialAyahs,
  initialTranslationKey = ARABIC_KEY,
}: {
  defaultExpanded?: boolean;
  showSurahControls?: boolean;
  translations?: TranslationOption[];
  initialAyahs?: Ayah[];
  initialTranslationKey?: string;
} = {}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [fullscreen, setFullscreen] = useState(false);
  const state = usePlayerState();
  const actions = usePlayerActions();
  const isPlaying = state.status === "playing";

  // Ayah text (Arabic or a chosen translation). Keeps itself in sync with
  // the current surah + translation key.
  const [translationKey, setTranslationKey] = useState<string>(initialTranslationKey);
  const [ayahs, setAyahs] = useState<Ayah[]>(initialAyahs ?? []);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    if (!showSurahControls) return;
    let cancelled = false;
    setTextLoading(true);
    fetchSurah(translationKey, state.surah)
      .then((data) => {
        if (!cancelled) setAyahs(data);
      })
      .catch(() => {
        if (!cancelled) setAyahs([]);
      })
      .finally(() => {
        if (!cancelled) setTextLoading(false);
      });
    return () => { cancelled = true; };
  }, [translationKey, state.surah, showSurahControls]);

  const displayMode: "arabic" | "translation" = translationKey === ARABIC_KEY ? "arabic" : "translation";
  const currentAyah = ayahs[state.ayahIndex];
  const displayText = currentAyah
    ? displayMode === "arabic"
      ? currentAyah.arabic_text
      : currentAyah.translation
    : "";

  return (
    <div className="relative">
      <AnimatePresence initial={false} mode="wait">
        {!expanded ? (
          <motion.div
            key="pill"
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full
                       bg-white/5 backdrop-blur-xl backdrop-saturate-150
                       border border-white/10 text-white/90
                       bg-[radial-gradient(circle_at_30%_0%,rgba(16,185,129,0.18),transparent_60%)]
                       shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <button
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => (isPlaying ? actions.pause() : actions.play())}
              className="w-7 h-7 rounded-full flex items-center justify-center
                         text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              {state.status === "error" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                  <path d="M12 2L2 22h20L12 2zm0 6v6m0 3v.5" />
                </svg>
              ) : isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 5v14l12-7z" />
                </svg>
              )}
            </button>
            <span className="text-xs font-mono tracking-wide truncate max-w-[8rem]">
              {state.reciter.display_name.split(" ").slice(-2).join(" ")}
            </span>
            <button
              aria-label="Expand player"
              onClick={() => setExpanded(true)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </motion.div>
        ) : (
          <ExpandedPanel
            state={state}
            actions={actions}
            onClose={() => setExpanded(false)}
            showSurahControls={showSurahControls}
            translations={translations}
            translationKey={translationKey}
            onTranslationChange={setTranslationKey}
            displayText={displayText}
            displayMode={displayMode}
            textLoading={textLoading}
            onFullscreen={() => setFullscreen(true)}
          />
        )}
      </AnimatePresence>
      {fullscreen && showSurahControls && (
        <FullscreenPanel
          state={state}
          actions={actions}
          translations={translations}
          translationKey={translationKey}
          onTranslationChange={setTranslationKey}
          displayText={displayText}
          displayMode={displayMode}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}

function ExpandedPanel({
  state,
  actions,
  onClose,
  showSurahControls,
  translations,
  translationKey,
  onTranslationChange,
  displayText,
  displayMode,
  textLoading,
  onFullscreen,
}: {
  state: ReturnType<typeof usePlayerState>;
  actions: ReturnType<typeof usePlayerActions>;
  onClose: () => void;
  showSurahControls: boolean;
  translations?: TranslationOption[];
  translationKey: string;
  onTranslationChange: (key: string) => void;
  displayText: string;
  displayMode: "arabic" | "translation";
  textLoading: boolean;
  onFullscreen: () => void;
}) {
  const reciters = useReciterList();
  const recitation = useRecitationArray();
  const totalAyahs = useTotalAyahs();
  const isPlaying = state.status === "playing";

  // Surah-level timeline: treat the whole surah as one continuous audio track.
  const cumDurations = (() => {
    const out: number[] = [0];
    let acc = 0;
    for (const a of recitation) {
      acc += a.duration_ms;
      out.push(acc);
    }
    return out;
  })();
  const surahTotalMs = cumDurations[recitation.length] || 0;
  const surahCurrentMs = (cumDurations[state.ayahIndex] || 0) + state.currentMs;
  const surahProgress = surahTotalMs > 0 ? surahCurrentMs / surahTotalMs : 0;

  const onPickSurah = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = Number(e.target.value);
    if (!Number.isNaN(n) && n >= 1 && n <= 114) actions.setSurah(n);
  };

  const onScrubSurah = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (surahTotalMs === 0) return;
    const pct = Number(e.target.value) / 1000;
    actions.seekInSurah(pct * surahTotalMs);
  };

  const prevSurah = () => {
    if (state.surah > 1) actions.setSurah(state.surah - 1);
  };
  const nextSurah = () => {
    if (state.surah < 114) actions.setSurah(state.surah + 1);
  };

  const cycleRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.75];
    const i = rates.indexOf(state.rate);
    actions.setRate(rates[(i + 1) % rates.length] ?? 1.0);
  };

  const onPickReciter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const r = reciters.find((x) => x.slug === e.target.value);
    if (r) actions.setReciter(r);
  };

  return (
    <motion.div
      key="expanded"
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className={`${showSurahControls ? "w-full max-w-[640px]" : "w-[300px]"} p-4 rounded-2xl
                 bg-white/5 backdrop-blur-xl backdrop-saturate-150
                 border border-white/10 text-white/90
                 bg-[radial-gradient(circle_at_30%_0%,rgba(16,185,129,0.2),transparent_60%)]
                 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(0,0,0,0.5)]`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold truncate">{state.reciter.display_name}</span>
        <button
          aria-label="Close"
          onClick={onClose}
          className="text-white/60 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {state.status === "error" && (
        <div className="mt-2 text-[11px] text-red-400 flex items-center justify-between">
          <span>⚠ Couldn&apos;t load audio</span>
          <button
            onClick={() => actions.play()}
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(surahProgress * 1000)}
          onChange={onScrubSurah}
          aria-label="Seek within surah"
          className="w-full accent-emerald-400"
        />
        <div className="flex justify-between text-[10px] text-white/60 font-mono mt-0.5">
          <span>{formatMs(surahCurrentMs)}</span>
          <span>{formatMs(surahTotalMs)}</span>
        </div>
      </div>

      {showSurahControls && (
        <div className="mt-3 px-3 py-4 rounded-xl bg-black/30 border border-white/5 min-h-[88px] flex items-center justify-center">
          {textLoading && !displayText ? (
            <span className="text-[11px] text-white/40 font-mono">Loading…</span>
          ) : displayMode === "arabic" ? (
            <p dir="rtl" className="text-right font-serif text-white/95 leading-[2] text-[1.5rem]">
              {displayText || "—"}
            </p>
          ) : (
            <p dir="auto" className="text-left text-white/90 leading-relaxed text-sm">
              {displayText || "—"}
            </p>
          )}
        </div>
      )}

      {/* Transport — centered: shuffle · prev · play · next · repeat */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {showSurahControls && (
          <button
            aria-label="Shuffle surahs"
            aria-pressed={state.shuffle}
            onClick={() => actions.setShuffle(!state.shuffle)}
            className={`w-9 h-9 rounded-full transition-colors flex items-center justify-center ${
              state.shuffle
                ? "text-emerald-400 bg-emerald-500/15"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>
        )}
        <button
          aria-label={showSurahControls ? "Previous surah" : "Previous ayah"}
          onClick={showSurahControls ? prevSurah : actions.prevAyah}
          disabled={showSurahControls && state.surah <= 1}
          className="w-9 h-9 rounded-full hover:bg-white/10 disabled:opacity-40 transition-colors flex items-center justify-center"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zM9 12l11-7v14z" />
          </svg>
        </button>
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={() => (isPlaying ? actions.pause() : actions.play())}
          className="w-12 h-12 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 5v14l12-7z" />
            </svg>
          )}
        </button>
        <button
          aria-label={showSurahControls ? "Next surah" : "Next ayah"}
          onClick={showSurahControls ? nextSurah : actions.nextAyah}
          disabled={showSurahControls && state.surah >= 114}
          className="w-9 h-9 rounded-full hover:bg-white/10 disabled:opacity-40 transition-colors flex items-center justify-center"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6h2v12h-2zM15 12L4 19V5z" />
          </svg>
        </button>
        {showSurahControls && (
          <button
            aria-label="Repeat surah"
            aria-pressed={state.repeat}
            onClick={() => actions.setRepeat(!state.repeat)}
            className={`w-9 h-9 rounded-full transition-colors flex items-center justify-center ${
              state.repeat
                ? "text-emerald-400 bg-emerald-500/15"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>
        )}
      </div>

      {/* Thin trailing row: speed · fullscreen · re-center */}
      <div className="mt-2 flex items-center justify-end gap-1">
        <button
          onClick={cycleRate}
          aria-label="Playback speed"
          className="text-xs font-mono text-white/70 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
        >
          {state.rate.toFixed(2)}×
        </button>
        {showSurahControls && (
          <button
            onClick={onFullscreen}
            aria-label="Fullscreen"
            className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          aria-label={state.volume === 0 ? "Unmute" : "Mute"}
          onClick={() => actions.setVolume(state.volume === 0 ? 1 : 0)}
          className="w-10 h-10 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
        >
          {state.volume === 0 ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.59 3L14 9.41 15.41 8 18 10.59 20.59 8 22 9.41 19.41 12 22 14.59 20.59 16 18 13.41 15.41 16 14 14.59 16.59 12z" />
            </svg>
          ) : state.volume < 0.5 ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm12 .17v5.66c1.18-.77 2-2.08 2-3.83s-.82-3.06-2-3.83z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(state.volume * 100)}
          onChange={(e) => actions.setVolume(Number(e.target.value) / 100)}
          aria-label="Volume"
          className="flex-1 accent-emerald-400"
        />
        <span className="text-[10px] text-white/50 font-mono w-7 text-right">
          {Math.round(state.volume * 100)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <select
          value={state.reciter.slug}
          onChange={onPickReciter}
          aria-label="Reciter"
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white/80 focus:outline-none focus:border-emerald-400"
        >
          {reciters.map((r) => (
            <option key={r.slug} value={r.slug} className="bg-gray-900">
              {r.display_name}
            </option>
          ))}
        </select>
        {showSurahControls && (
          <select
            value={state.surah}
            onChange={onPickSurah}
            aria-label="Surah"
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white/80 focus:outline-none focus:border-emerald-400"
          >
            {SURAHS.map((s) => (
              <option key={s.number} value={s.number} className="bg-gray-900">
                {s.number}. {s.transliteration}
              </option>
            ))}
          </select>
        )}
        {showSurahControls && (
          <select
            value={translationKey}
            onChange={(e) => onTranslationChange(e.target.value)}
            aria-label="Translation"
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white/80 focus:outline-none focus:border-emerald-400"
          >
            <option value={ARABIC_KEY} className="bg-gray-900">Arabic (original)</option>
            {(translations ?? []).map((t) => (
              <option key={t.key} value={t.key} className="bg-gray-900">
                {t.language_name} &middot; {t.translator}
              </option>
            ))}
          </select>
        )}
        {!showSurahControls && (
          <span className="text-white/60 font-mono shrink-0">
            Ayah {state.ayahIndex + 1}/{totalAyahs}
          </span>
        )}
      </div>

      {!state.autoScroll && (
        <div className="mt-2 text-right">
          <button
            onClick={actions.recenter}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono"
          >
            Re-center
          </button>
        </div>
      )}
    </motion.div>
  );
}

function FullscreenPanel({
  state,
  actions,
  translations,
  translationKey,
  onTranslationChange,
  displayText,
  displayMode,
  onClose,
}: {
  state: ReturnType<typeof usePlayerState>;
  actions: ReturnType<typeof usePlayerActions>;
  translations?: TranslationOption[];
  translationKey: string;
  onTranslationChange: (key: string) => void;
  displayText: string;
  displayMode: "arabic" | "translation";
  onClose: () => void;
}) {
  const recitation = useRecitationArray();
  const totalAyahs = useTotalAyahs();
  const isPlaying = state.status === "playing";
  const surahMeta = SURAHS.find((s) => s.number === state.surah);
  const rootRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const didEnterFs = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Surah-level timeline, same as ExpandedPanel.
  const cumDurations = (() => {
    const out: number[] = [0];
    let acc = 0;
    for (const a of recitation) {
      acc += a.duration_ms;
      out.push(acc);
    }
    return out;
  })();
  const surahTotalMs = cumDurations[recitation.length] || 0;
  const surahCurrentMs = (cumDurations[state.ayahIndex] || 0) + state.currentMs;
  const surahProgress = surahTotalMs > 0 ? surahCurrentMs / surahTotalMs : 0;

  const prevSurah = () => {
    if (state.surah > 1) actions.setSurah(state.surah - 1);
  };
  const nextSurah = () => {
    if (state.surah < 114) actions.setSurah(state.surah + 1);
  };

  // Request real device fullscreen when the panel mounts; close the panel
  // only if the user *leaves* native fullscreen (ESC / F11 / OS gesture).
  // If the browser refuses to enter fullscreen (no user gesture), we stay
  // in CSS-only fullscreen and don't auto-close.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    type FsElement = HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    type FsDocument = Document & {
      webkitFullscreenElement?: Element | null;
      msFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    };
    const fsEl = el as FsElement;
    const fsDoc = document as FsDocument;

    const request =
      fsEl.requestFullscreen?.bind(fsEl) ||
      fsEl.webkitRequestFullscreen?.bind(fsEl) ||
      fsEl.msRequestFullscreen?.bind(fsEl);
    const exit =
      fsDoc.exitFullscreen?.bind(fsDoc) ||
      fsDoc.webkitExitFullscreen?.bind(fsDoc) ||
      fsDoc.msExitFullscreen?.bind(fsDoc);

    void Promise.resolve(request?.())
      .then(() => { didEnterFs.current = true; })
      .catch(() => {
        // Browser refused — stay in CSS-only fullscreen.
      });

    const onFsChange = () => {
      if (!didEnterFs.current) return; // never entered native fs, ignore
      const active =
        document.fullscreenElement ??
        fsDoc.webkitFullscreenElement ??
        fsDoc.msFullscreenElement ??
        null;
      if (!active) onCloseRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      const active =
        document.fullscreenElement ??
        fsDoc.webkitFullscreenElement ??
        fsDoc.msFullscreenElement ??
        null;
      if (active) {
        void Promise.resolve(exit?.()).catch(() => {});
      }
    };
  }, []);

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-gray-950/95 backdrop-blur-xl flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
          <div>
            <p className="text-sm font-semibold text-white">
              {surahMeta ? `${surahMeta.number}. ${surahMeta.transliteration}` : `Surah ${state.surah}`}
            </p>
            <p className="text-[11px] text-white/50 font-mono">
              {state.reciter.display_name} &middot; {formatMs(surahCurrentMs)} / {formatMs(surahTotalMs)} &middot; {totalAyahs} ayahs
            </p>
          </div>
        </div>
        <button
          aria-label="Close fullscreen"
          onClick={onClose}
          className="w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Split body: text 55% on the left, player 45% on the right */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* Text column */}
        <div className="basis-[55%] shrink-0 grow-0 min-w-0 flex items-center justify-center px-8 py-6 overflow-auto">
          <div className="w-full text-center">
            {displayMode === "arabic" ? (
              <p
                dir="rtl"
                className="font-serif text-white leading-[2] text-[2.5rem] md:text-[3.5rem] break-words"
              >
                {displayText || "—"}
              </p>
            ) : (
              <p
                dir="auto"
                className="text-white/95 leading-relaxed text-xl md:text-2xl break-words"
              >
                {displayText || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Player column */}
        <div className="basis-[45%] shrink-0 grow-0 min-w-0 border-l border-white/5 flex flex-col justify-center px-6 py-5 space-y-3 overflow-auto">
          <div>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(surahProgress * 1000)}
              onChange={(e) => {
                if (surahTotalMs === 0) return;
                const pct = Number(e.target.value) / 1000;
                actions.seekInSurah(pct * surahTotalMs);
              }}
              aria-label="Seek within surah"
              className="w-full accent-emerald-400"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              aria-label="Shuffle"
              aria-pressed={state.shuffle}
              onClick={() => actions.setShuffle(!state.shuffle)}
              className={`w-10 h-10 rounded-full transition flex items-center justify-center ${
                state.shuffle ? "text-emerald-400 bg-emerald-500/15" : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
            </button>
            <button
              aria-label="Previous surah"
              onClick={prevSurah}
              disabled={state.surah <= 1}
              className="w-11 h-11 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40 flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zM9 12l11-7v14z" />
              </svg>
            </button>
            <button
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => (isPlaying ? actions.pause() : actions.play())}
              className="w-14 h-14 rounded-full bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 flex items-center justify-center"
            >
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 5v14l12-7z" />
                </svg>
              )}
            </button>
            <button
              aria-label="Next surah"
              onClick={nextSurah}
              disabled={state.surah >= 114}
              className="w-11 h-11 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40 flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6h2v12h-2zM15 12L4 19V5z" />
              </svg>
            </button>
            <button
              aria-label="Repeat surah"
              aria-pressed={state.repeat}
              onClick={() => actions.setRepeat(!state.repeat)}
              className={`w-10 h-10 rounded-full transition flex items-center justify-center ${
                state.repeat ? "text-emerald-400 bg-emerald-500/15" : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={translationKey}
              onChange={(e) => onTranslationChange(e.target.value)}
              aria-label="Translation"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-white/80 focus:outline-none focus:border-emerald-400"
            >
              <option value={ARABIC_KEY} className="bg-gray-900">Arabic (original)</option>
              {(translations ?? []).map((t) => (
                <option key={t.key} value={t.key} className="bg-gray-900">
                  {t.language_name} &middot; {t.translator}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
