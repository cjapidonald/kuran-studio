"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  usePlayerActions,
  usePlayerState,
  useReciterList,
  useTotalAyahs,
} from "./recitation-provider";

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ReciterPlayer() {
  const [expanded, setExpanded] = useState(false);
  const state = usePlayerState();
  const actions = usePlayerActions();
  const isPlaying = state.status === "playing";

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
          <ExpandedPanel state={state} actions={actions} onClose={() => setExpanded(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ExpandedPanel({
  state,
  actions,
  onClose,
}: {
  state: ReturnType<typeof usePlayerState>;
  actions: ReturnType<typeof usePlayerActions>;
  onClose: () => void;
}) {
  const reciters = useReciterList();
  const totalAyahs = useTotalAyahs();
  const isPlaying = state.status === "playing";
  const progress = state.durationMs > 0 ? state.currentMs / state.durationMs : 0;

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value) / 1000;
    actions.seek(pct * state.durationMs);
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
      className="w-[300px] p-3 rounded-2xl
                 bg-white/5 backdrop-blur-xl backdrop-saturate-150
                 border border-white/10 text-white/90
                 bg-[radial-gradient(circle_at_30%_0%,rgba(16,185,129,0.2),transparent_60%)]
                 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(0,0,0,0.5)]"
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
          value={Math.round(progress * 1000)}
          onChange={onScrub}
          aria-label="Seek within ayah"
          className="w-full accent-emerald-400"
        />
        <div className="flex justify-between text-[10px] text-white/60 font-mono mt-0.5">
          <span>{formatMs(state.currentMs)}</span>
          <span>{formatMs(state.durationMs)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous ayah"
            onClick={actions.prevAyah}
            className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zM9 12l11-7v14z" />
            </svg>
          </button>
          <button
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={() => (isPlaying ? actions.pause() : actions.play())}
            className="w-10 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5v14l12-7z" />
              </svg>
            )}
          </button>
          <button
            aria-label="Next ayah"
            onClick={actions.nextAyah}
            className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6h2v12h-2zM15 12L4 19V5z" />
            </svg>
          </button>
        </div>

        <button
          onClick={cycleRate}
          aria-label="Playback speed"
          className="text-xs font-mono text-white/70 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
        >
          {state.rate.toFixed(2)}×
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <select
          value={state.reciter.slug}
          onChange={onPickReciter}
          aria-label="Reciter"
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white/80 focus:outline-none focus:border-emerald-400"
        >
          {reciters.map((r) => (
            <option key={r.slug} value={r.slug} className="bg-gray-900">
              {r.display_name}
            </option>
          ))}
        </select>
        <span className="text-white/60 font-mono">
          Ayah {state.ayahIndex + 1}/{totalAyahs}
        </span>
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
