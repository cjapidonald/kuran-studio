import type { RecitationAyah, Reciter } from "@/lib/quran/recitations";

export interface PlayerState {
  reciter: Reciter;
  surah: number;              // 1-based surah number
  ayahIndex: number;          // 0-based index into the recitation array (NOT ayah number)
  activeWord: number | null;  // word index in current ayah, null if idle
  status: "idle" | "loading" | "playing" | "paused" | "error";
  currentMs: number;          // playback position within current ayah
  durationMs: number;         // duration of current ayah
  rate: number;               // 0.75 | 1.0 | 1.25 | 1.5
  volume: number;             // 0.0 – 1.0
  repeat: boolean;            // on end of surah, restart from ayah 0
  shuffle: boolean;           // on end of surah, jump to a random other surah
  autoScroll: boolean;
}

export interface RecitationStore {
  getState: () => PlayerState;
  subscribe: (fn: () => void) => () => void;
  setReciter: (reciter: Reciter, recitation: RecitationAyah[]) => void;
  setSurah: (surah: number, recitation: RecitationAyah[]) => void;
  setAyahIndex: (idx: number) => void;
  setActiveWord: (word: number | null) => void;
  setStatus: (s: PlayerState["status"]) => void;
  setTime: (currentMs: number, durationMs: number) => void;
  setRate: (rate: number) => void;
  setVolume: (v: number) => void;
  setRepeat: (on: boolean) => void;
  setShuffle: (on: boolean) => void;
  setAutoScroll: (on: boolean) => void;
  getRecitation: () => RecitationAyah[];
}

export function createRecitationStore(
  initialReciter: Reciter,
  initialSurah: number,
  initialRecitation: RecitationAyah[],
): RecitationStore {
  let state: PlayerState = {
    reciter: initialReciter,
    surah: initialSurah,
    ayahIndex: 0,
    activeWord: null,
    status: "idle",
    currentMs: 0,
    durationMs: initialRecitation[0]?.duration_ms ?? 0,
    rate: 1.0,
    volume: 1.0,
    repeat: false,
    shuffle: false,
    autoScroll: true,
  };
  let recitation: RecitationAyah[] = initialRecitation;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((fn) => fn());

  return {
    getState: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    getRecitation: () => recitation,
    setReciter: (reciter, newRecitation) => {
      recitation = newRecitation;
      state = { ...state, reciter };
      notify();
    },
    setSurah: (surah, newRecitation) => {
      recitation = newRecitation;
      state = {
        ...state,
        surah,
        ayahIndex: 0,
        activeWord: null,
        currentMs: 0,
        durationMs: newRecitation[0]?.duration_ms ?? 0,
      };
      notify();
    },
    setAyahIndex: (idx) => {
      if (idx === state.ayahIndex) return;
      state = { ...state, ayahIndex: idx, activeWord: null, currentMs: 0, durationMs: recitation[idx]?.duration_ms ?? 0 };
      notify();
    },
    setActiveWord: (word) => {
      if (word === state.activeWord) return;
      state = { ...state, activeWord: word };
      notify();
    },
    setStatus: (s) => {
      if (s === state.status) return;
      state = { ...state, status: s };
      notify();
    },
    setTime: (currentMs, durationMs) => {
      state = { ...state, currentMs, durationMs };
      notify();
    },
    setRate: (rate) => {
      if (rate === state.rate) return;
      state = { ...state, rate };
      notify();
    },
    setVolume: (v) => {
      const clamped = Math.max(0, Math.min(1, v));
      if (clamped === state.volume) return;
      state = { ...state, volume: clamped };
      notify();
    },
    setRepeat: (on) => {
      if (on === state.repeat) return;
      state = { ...state, repeat: on };
      notify();
    },
    setShuffle: (on) => {
      if (on === state.shuffle) return;
      state = { ...state, shuffle: on };
      notify();
    },
    setAutoScroll: (on) => {
      if (on === state.autoScroll) return;
      state = { ...state, autoScroll: on };
      notify();
    },
  };
}

// Binary-search the active word given ms into the ayah.
export function findActiveWord(segments: [number, number, number][], ms: number): number | null {
  if (segments.length === 0) return null;
  let lo = 0, hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [wi, start, end] = segments[mid];
    if (ms < start) hi = mid - 1;
    else if (ms >= end) lo = mid + 1;
    else return wi;
  }
  // Between segments (gap) — snap to previous word if within 200ms of its end.
  if (hi >= 0) {
    const [wi, , end] = segments[hi];
    if (ms - end < 200) return wi;
  }
  return null;
}
