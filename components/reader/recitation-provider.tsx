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

interface ContextValue {
  store: RecitationStore;
  surah: number;
  reciters: Reciter[];
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const Ctx = createContext<ContextValue | null>(null);

export interface RecitationProviderProps {
  surah: number;
  reciters: Reciter[];
  initialReciter: Reciter;
  initialRecitation: RecitationAyah[];
  children: React.ReactNode;
}

export function RecitationProvider({
  surah,
  reciters,
  initialReciter,
  initialRecitation,
  children,
}: RecitationProviderProps) {
  const storeRef = useRef<RecitationStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createRecitationStore(initialReciter, initialRecitation);
  }
  const store = storeRef.current;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (typeof window !== "undefined" && !audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
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
          const word = findActiveWord(ayah.segments, ms);
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

  const value = useMemo<ContextValue>(
    () => ({ store, surah, reciters, audioRef }),
    [store, surah, reciters],
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
      status: s.status,
      currentMs: s.currentMs,
      durationMs: s.durationMs,
      ayahIndex: s.ayahIndex,
      rate: s.rate,
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
  const { store, surah, audioRef } = useCtx();

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
      const rec = await fetchRecitation(reciter.slug, surah);
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
    [store, surah, audioRef],
  );

  const setRate = useCallback(
    (rate: number) => {
      store.setRate(rate);
      if (audioRef.current) audioRef.current.playbackRate = rate;
    },
    [store, audioRef],
  );

  const recenter = useCallback(() => {
    store.setAutoScroll(true);
  }, [store]);

  return { play, pause, seek, nextAyah, prevAyah, setReciter, setRate, recenter };
}
