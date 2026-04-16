"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  fetchRecitation,
  type Reciter,
  type RecitationAyah,
} from "@/lib/quran/recitations";
import {
  createRecitationStore,
  findActiveWord,
  type PlayerState,
  type RecitationStore,
} from "./recitation-store";

const LS_KEY = "kurani-reciter";
const LS_VOLUME = "kurani-volume";
const LS_REPEAT = "kurani-repeat";
const LS_SHUFFLE = "kurani-shuffle";

interface ContextValue {
  store: RecitationStore;
  reciters: Reciter[];
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const Ctx = createContext<ContextValue | null>(null);

export interface RecitationProviderProps {
  surah: number;
  reciters: Reciter[];
  initialReciter: Reciter;
  initialRecitation: RecitationAyah[];
  /** Disable global keyboard shortcuts + auto-scroll observer. Use on pages
   *  that embed the player outside the reader (e.g., landing). */
  disableGlobalShortcuts?: boolean;
  children: React.ReactNode;
}

export function RecitationProvider({
  surah,
  reciters,
  initialReciter,
  initialRecitation,
  disableGlobalShortcuts,
  children,
}: RecitationProviderProps) {
  const storeRef = useRef<RecitationStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createRecitationStore(initialReciter, surah, initialRecitation);
  }
  const store = storeRef.current;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (typeof window !== "undefined" && !audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
    const savedVol = localStorage.getItem(LS_VOLUME);
    if (savedVol !== null) {
      const v = Math.max(0, Math.min(1, parseFloat(savedVol)));
      if (!Number.isNaN(v)) {
        audioRef.current.volume = v;
        store.setVolume(v);
      }
    }
    if (localStorage.getItem(LS_REPEAT) === "1") store.setRepeat(true);
    if (localStorage.getItem(LS_SHUFFLE) === "1") store.setShuffle(true);
  }

  // Honor localStorage preference on mount (if different from server default).
  useEffect(() => {
    const savedSlug = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (!savedSlug || savedSlug === initialReciter.slug) return;
    const saved = reciters.find((r) => r.slug === savedSlug);
    if (!saved) return;
    fetchRecitation(saved.slug, surah).then((rec) => {
      if (rec.length > 0) store.setReciter(saved, rec);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist reciter choice whenever it changes.
  useEffect(() => {
    return store.subscribe(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY, store.getState().reciter.slug);
      }
    });
  }, [store]);

  // rAF tick while playing — drives activeWord + currentMs updates.
  // Degrades to ayah-level highlight (word=null) when the DOM word count doesn't
  // match the segment data — protects against Arabic-text tokenization drift.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const audio = audioRef.current;
      const s = store.getState();
      if (audio && s.status === "playing") {
        const rec = store.getRecitation();
        const ayah = rec[s.ayahIndex];
        if (ayah) {
          const ms = Math.floor(audio.currentTime * 1000);
          const domEl = document.querySelector<HTMLElement>(`[data-ayah="${s.ayahIndex}"]`);
          const wordCount = domEl ? domEl.querySelectorAll("[data-word]").length : 0;
          const maxWi = ayah.segments.reduce((m, seg) => Math.max(m, seg[0]), -1);
          const word =
            wordCount > 0 && maxWi < wordCount
              ? findActiveWord(ayah.segments, ms)
              : null;
          store.setActiveWord(word);
          store.setTime(ms, ayah.duration_ms);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [store]);

  // Audio event listeners — play/pause/ended/error wired to store status.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const s = store.getState();
      const rec = store.getRecitation();
      const next = s.ayahIndex + 1;
      if (next >= rec.length) {
        // End of surah — honor repeat / shuffle before going idle.
        if (s.repeat) {
          store.setAyahIndex(0);
          audio.src = rec[0].audio_url;
          audio.currentTime = 0;
          audio.play().catch(() => store.setStatus("error"));
          return;
        }
        if (s.shuffle) {
          let pick = s.surah;
          while (pick === s.surah) pick = Math.floor(Math.random() * 114) + 1;
          store.setStatus("loading");
          fetchRecitation(s.reciter.slug, pick).then((newRec) => {
            if (newRec.length === 0) {
              store.setStatus("idle");
              return;
            }
            store.setSurah(pick, newRec);
            audio.src = newRec[0].audio_url;
            audio.currentTime = 0;
            audio.play().catch(() => store.setStatus("error"));
          });
          return;
        }
        store.setStatus("idle");
        store.setActiveWord(null);
        return;
      }
      store.setAyahIndex(next);
      audio.src = rec[next].audio_url;
      audio.currentTime = 0;
      audio.play().catch(() => store.setStatus("error"));
    };
    const onPause = () => {
      if (store.getState().status === "playing") store.setStatus("paused");
    };
    const onPlay = () => store.setStatus("playing");
    const onError = () => store.setStatus("error");
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("error", onError);
    };
  }, [store]);

  // Preload next ayah on ayah change.
  useEffect(() => {
    return store.subscribe(() => {
      const s = store.getState();
      const rec = store.getRecitation();
      const next = rec[s.ayahIndex + 1];
      if (!next) return;
      const existing = document.querySelector(`link[data-preload-audio="${next.audio_url}"]`);
      if (existing) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "audio";
      link.href = next.audio_url;
      link.setAttribute("data-preload-audio", next.audio_url);
      document.head.appendChild(link);
    });
  }, [store]);

  // Cleanup on unmount — pause audio so navigation doesn't leave it playing.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  // Track programmatic scrolls so user scrolls can disable auto-scroll.
  const programmaticScrollUntilRef = useRef(0);

  // Auto-scroll active ayah into view on ayahIndex change.
  useEffect(() => {
    if (disableGlobalShortcuts) return;
    return store.subscribe(() => {
      const s = store.getState();
      if (!s.autoScroll) return;
      if (s.status !== "playing") return;
      const el = document.querySelector<HTMLElement>(`[data-ayah="${s.ayahIndex}"]`);
      if (!el) return;
      programmaticScrollUntilRef.current = Date.now() + 600;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  }, [store, disableGlobalShortcuts]);

  // If user scrolls during playback (outside a programmatic scroll window), pause auto-scroll.
  useEffect(() => {
    if (disableGlobalShortcuts) return;
    const onScroll = () => {
      if (Date.now() < programmaticScrollUntilRef.current) return;
      const s = store.getState();
      if (s.status === "playing" && s.autoScroll) {
        store.setAutoScroll(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [store, disableGlobalShortcuts]);

  // Re-arm auto-scroll when user explicitly presses play after a pause.
  useEffect(() => {
    return store.subscribe(() => {
      const s = store.getState();
      if (s.status === "playing" && !s.autoScroll && s.currentMs === 0) {
        store.setAutoScroll(true);
      }
    });
  }, [store]);

  // Spacebar toggles play/pause; ←/→ step ayahs. Ignored when focus is inside form controls.
  useEffect(() => {
    if (disableGlobalShortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      const s = store.getState();
      const audio = audioRef.current;
      if (!audio) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (s.status === "playing") audio.pause();
        else audio.play().catch(() => store.setStatus("error"));
      } else if (e.code === "ArrowRight") {
        const rec = store.getRecitation();
        const next = Math.min(rec.length - 1, s.ayahIndex + 1);
        store.setAyahIndex(next);
        audio.src = rec[next].audio_url;
        audio.currentTime = 0;
        if (s.status === "playing") audio.play().catch(() => store.setStatus("error"));
      } else if (e.code === "ArrowLeft") {
        const rec = store.getRecitation();
        const prev = Math.max(0, s.ayahIndex - 1);
        store.setAyahIndex(prev);
        audio.src = rec[prev].audio_url;
        audio.currentTime = 0;
        if (s.status === "playing") audio.play().catch(() => store.setStatus("error"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, disableGlobalShortcuts]);

  const value = useMemo<ContextValue>(
    () => ({ store, reciters, audioRef }),
    [store, reciters],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useCtx() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRecitation* hooks must be used inside <RecitationProvider>");
  return v;
}

function shallowEq(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}

// useSyncExternalStore requires a stable snapshot reference. Selectors returning
// fresh objects/arrays each call would cause infinite loops; cache by equality.
function useStoreSelector<T>(
  selector: (s: PlayerState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const { store } = useCtx();
  const lastRef = useRef<{ value: T; valid: boolean }>({ value: undefined as unknown as T, valid: false });
  const getSnapshot = () => {
    const next = selector(store.getState());
    if (lastRef.current.valid && isEqual(lastRef.current.value, next)) {
      return lastRef.current.value;
    }
    lastRef.current = { value: next, valid: true };
    return next;
  };
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function useActiveAyah(): number | null {
  return useStoreSelector((s) => {
    if (s.status === "idle") return null;
    return s.ayahIndex;
  });
}

export function useActiveWord(): { ayahIndex: number; word: number } | null {
  return useStoreSelector(
    (s) => {
      if (s.status !== "playing" || s.activeWord === null) return null;
      return { ayahIndex: s.ayahIndex, word: s.activeWord };
    },
    (a, b) =>
      (a === null && b === null) ||
      (a !== null && b !== null && a.ayahIndex === b.ayahIndex && a.word === b.word),
  );
}

export function usePlayerState() {
  return useStoreSelector(
    (s) => ({
      reciter: s.reciter,
      surah: s.surah,
      status: s.status,
      currentMs: s.currentMs,
      durationMs: s.durationMs,
      ayahIndex: s.ayahIndex,
      rate: s.rate,
      volume: s.volume,
      repeat: s.repeat,
      shuffle: s.shuffle,
      autoScroll: s.autoScroll,
    }),
    shallowEq,
  );
}

export function useReciterList(): Reciter[] {
  return useCtx().reciters;
}

export function useTotalAyahs(): number {
  const { store } = useCtx();
  return store.getRecitation().length;
}

export function usePlayerActions() {
  const { store, audioRef } = useCtx();

  const play = useCallback(() => {
    const audio = audioRef.current;
    const rec = store.getRecitation();
    if (!audio || rec.length === 0) return;
    const s = store.getState();
    if (!audio.src) {
      audio.src = rec[s.ayahIndex].audio_url;
      audio.playbackRate = s.rate;
    }
    store.setStatus("loading");
    audio.play().then(() => store.setStatus("playing")).catch(() => store.setStatus("error"));
  }, [store, audioRef]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, [audioRef]);

  const seek = useCallback(
    (ms: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, ms / 1000);
    },
    [audioRef],
  );

  const nextAyah = useCallback(() => {
    const rec = store.getRecitation();
    const s = store.getState();
    const next = Math.min(rec.length - 1, s.ayahIndex + 1);
    store.setAyahIndex(next);
    const audio = audioRef.current;
    if (audio) {
      audio.src = rec[next].audio_url;
      audio.currentTime = 0;
      if (s.status === "playing") audio.play().catch(() => store.setStatus("error"));
    }
  }, [store, audioRef]);

  const prevAyah = useCallback(() => {
    const rec = store.getRecitation();
    const s = store.getState();
    const prev = Math.max(0, s.ayahIndex - 1);
    store.setAyahIndex(prev);
    const audio = audioRef.current;
    if (audio) {
      audio.src = rec[prev].audio_url;
      audio.currentTime = 0;
      if (s.status === "playing") audio.play().catch(() => store.setStatus("error"));
    }
  }, [store, audioRef]);

  const setReciter = useCallback(
    async (reciter: Reciter) => {
      const currentSurah = store.getState().surah;
      const rec = await fetchRecitation(reciter.slug, currentSurah);
      if (rec.length === 0) return;
      const s = store.getState();
      const targetAyah = Math.min(s.ayahIndex, rec.length - 1);
      const ratio = s.durationMs > 0 ? s.currentMs / s.durationMs : 0;
      store.setReciter(reciter, rec);
      store.setAyahIndex(targetAyah);
      const audio = audioRef.current;
      if (audio) {
        audio.src = rec[targetAyah].audio_url;
        audio.currentTime = (rec[targetAyah].duration_ms * ratio) / 1000;
        if (s.status === "playing") audio.play().catch(() => store.setStatus("error"));
      }
    },
    [store, audioRef],
  );

  const setSurah = useCallback(
    async (n: number) => {
      const s = store.getState();
      const rec = await fetchRecitation(s.reciter.slug, n);
      if (rec.length === 0) return;
      store.setSurah(n, rec);
      const audio = audioRef.current;
      if (audio) {
        audio.src = rec[0].audio_url;
        audio.currentTime = 0;
        if (s.status === "playing") audio.play().catch(() => store.setStatus("error"));
      }
    },
    [store, audioRef],
  );

  const setRepeat = useCallback(
    (on: boolean) => {
      store.setRepeat(on);
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_REPEAT, on ? "1" : "0");
      }
    },
    [store],
  );

  const setShuffle = useCallback(
    (on: boolean) => {
      store.setShuffle(on);
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_SHUFFLE, on ? "1" : "0");
      }
    },
    [store],
  );

  const setRate = useCallback(
    (rate: number) => {
      store.setRate(rate);
      if (audioRef.current) audioRef.current.playbackRate = rate;
    },
    [store, audioRef],
  );

  const setVolume = useCallback(
    (v: number) => {
      store.setVolume(v);
      const clamped = Math.max(0, Math.min(1, v));
      if (audioRef.current) audioRef.current.volume = clamped;
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_VOLUME, String(clamped));
      }
    },
    [store, audioRef],
  );

  const recenter = useCallback(() => {
    store.setAutoScroll(true);
  }, [store]);

  return {
    play,
    pause,
    seek,
    nextAyah,
    prevAyah,
    setReciter,
    setSurah,
    setRate,
    setVolume,
    setRepeat,
    setShuffle,
    recenter,
  };
}
