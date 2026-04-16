# Reciter Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 5 Arabic reciters with word-level Arabic karaoke, ayah-level translation highlight, and a Liquid-Glass compact player on the surah view.

**Architecture:** Supabase holds reciters + per-ayah audio URLs + per-word segments (seeded once from Quran.com API v4). Surah page server-fetches default reciter's recitation, wraps the reader in a React context that owns the only `<audio>` element + karaoke state, and renders three client components: ArabicBlock (word highlight), TranslationParagraph (ayah highlight), and ReciterPlayer (glass pill → expandable panel in the sticky nav).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase (@supabase/supabase-js), Motion (framer-motion), Tailwind v4, tsx for local scripts.

**Reference spec:** `docs/superpowers/specs/2026-04-16-reciter-feature-design.md`

---

## File Structure

**New files:**

| Path | Responsibility |
|---|---|
| `scripts/seed-reciters.ts` | One-shot idempotent seed: resolves Quran.com reciter IDs, fetches audio + segments per (reciter × surah), upserts into Supabase. |
| `lib/quran/recitations.ts` | Read helpers used by the surah page (server): `fetchReciters()`, `fetchRecitation(reciterSlug, surah)`. |
| `components/reader/recitation-store.ts` | Pure TypeScript store (createStore pattern) that holds playback state + binary-search helpers. No React. |
| `components/reader/recitation-provider.tsx` | React context + `<audio>` element + rAF timing loop + hooks (`useActiveAyah`, `useActiveWord`, `usePlayerState`, `usePlayerActions`). |
| `components/reader/arabic-block.tsx` | Continuous RTL paragraph; word spans; subscribes to active word/ayah. |
| `components/reader/translation-paragraph.tsx` | Prose paragraph with superscript ayah numbers; footnote disclosure. |
| `components/reader/reciter-player.tsx` | Liquid-Glass compact pill + expanded panel; sits in the sticky nav's right slot. |

**Modified files:**

| Path | Change |
|---|---|
| `app/[lang]/[surah]/page.tsx` | Fetch reciters + default recitation server-side; swap ayah-cards block for provider + new components. |

**Removed (if unreferenced):**

| Path | Why |
|---|---|
| `components/reader/ayah-display.tsx` | Replaced by arabic-block + translation-paragraph. Verified by grep before removal. |

**Database migrations:** applied via the Supabase MCP `apply_migration` tool (project already uses Supabase MCP, no local `supabase/migrations` folder).

---

### Task 1: Apply database migration

**Files:**
- No local file; applies a migration via Supabase MCP.

- [ ] **Step 1: Apply the `create_reciter_tables` migration**

Use the Supabase MCP tool `apply_migration` with name `create_reciter_tables` and this SQL:

```sql
create table if not exists reciters (
  slug           text primary key,
  display_name   text not null,
  style          text not null,
  quran_com_id   int  not null,
  sort_order     int  not null default 0,
  is_default     boolean not null default false
);

create table if not exists recitations (
  reciter_slug   text not null references reciters(slug) on delete cascade,
  surah          int  not null,
  ayah           int  not null,
  audio_url      text not null,
  duration_ms    int  not null,
  segments       jsonb not null,
  primary key (reciter_slug, surah, ayah)
);

create index if not exists recitations_surah_idx
  on recitations (reciter_slug, surah, ayah);

-- Public read (anon key can select both tables)
alter table reciters enable row level security;
alter table recitations enable row level security;

drop policy if exists "reciters read" on reciters;
create policy "reciters read"
  on reciters for select
  using (true);

drop policy if exists "recitations read" on recitations;
create policy "recitations read"
  on recitations for select
  using (true);
```

Expected: migration succeeds, two new tables visible in Supabase.

- [ ] **Step 2: Verify tables**

Use Supabase MCP `list_tables` (schema=public). Confirm `reciters` and `recitations` both exist and row counts are 0.

- [ ] **Step 3: Commit (no code change, just a marker via docs)**

No git commit yet — database change is out-of-tree. Move to Task 2.

---

### Task 2: Seed script scaffold (env + Supabase client)

**Files:**
- Create: `scripts/seed-reciters.ts`

- [ ] **Step 1: Write scaffolding**

Create `scripts/seed-reciters.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const QURAN_COM_API = "https://api.quran.com/api/v4";

interface ReciterSeed {
  slug: string;
  display_name: string;
  style: "murattal" | "mujawwad";
  match: { name_contains: string; style: "murattal" | "mujawwad" };
  sort_order: number;
  is_default: boolean;
}

const RECITERS: ReciterSeed[] = [
  { slug: "alafasy",              display_name: "Mishary Rashid Al-Afasy",  style: "murattal", match: { name_contains: "Afasy",   style: "murattal" }, sort_order: 10, is_default: true },
  { slug: "abdul_basit_mujawwad", display_name: "Abdul Basit Abd us-Samad", style: "mujawwad", match: { name_contains: "Basit",   style: "mujawwad" }, sort_order: 20, is_default: false },
  { slug: "maher_al_muaiqly",     display_name: "Maher Al-Muaiqly",         style: "murattal", match: { name_contains: "Muaiqly", style: "murattal" }, sort_order: 30, is_default: false },
  { slug: "sudais",               display_name: "Abdur-Rahman As-Sudais",   style: "murattal", match: { name_contains: "Sudais",  style: "murattal" }, sort_order: 40, is_default: false },
  { slug: "husary",               display_name: "Mahmoud Khalil Al-Husary", style: "murattal", match: { name_contains: "Husary",  style: "murattal" }, sort_order: 50, is_default: false },
];

async function main() {
  console.log("seed-reciters: start");
  // resolveReciterIds, seedReciters, seedRecitations — added in later tasks
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Smoke-run the scaffold**

Run:
```bash
set -a && source .env.local && set +a && npx tsx scripts/seed-reciters.ts
```

Expected output: `seed-reciters: start` and exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-reciters.ts
git commit -m "feat(reciters): scaffold seed-reciters script"
```

---

### Task 3: Seed script — resolve Quran.com reciter IDs

**Files:**
- Modify: `scripts/seed-reciters.ts`

- [ ] **Step 1: Add fetch helper + resolver**

Add above `async function main()`:

```ts
interface QuranComRecitation {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name?: { name: string; language_name: string };
}

async function fetchJson<T>(url: string, tries = 3): Promise<T> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()) as T;
    if (res.status === 429 || res.status >= 500) {
      const backoff = 500 * attempt;
      console.warn(`  ${res.status} on ${url} — retrying in ${backoff}ms (${attempt}/${tries})`);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }
    throw new Error(`HTTP ${res.status} on ${url}`);
  }
  throw new Error(`Exceeded ${tries} retries on ${url}`);
}

async function resolveReciterIds(): Promise<Map<string, number>> {
  const data = await fetchJson<{ recitations: QuranComRecitation[] }>(
    `${QURAN_COM_API}/recitations`,
  );
  const resolved = new Map<string, number>();
  for (const r of RECITERS) {
    const matches = data.recitations.filter((q) => {
      const nameMatch = q.reciter_name.toLowerCase().includes(r.match.name_contains.toLowerCase());
      const qStyle = (q.style || "").toLowerCase();
      // "murattal" is the default style; Quran.com often leaves it empty or says "Murattal"
      const styleMatch =
        r.match.style === "mujawwad"
          ? qStyle.includes("mujawwad")
          : !qStyle.includes("mujawwad");
      return nameMatch && styleMatch;
    });
    if (matches.length === 0) {
      throw new Error(`Reciter not found: ${r.slug} (looked for name containing "${r.match.name_contains}", style=${r.match.style})`);
    }
    if (matches.length > 1) {
      throw new Error(`Ambiguous reciter match for ${r.slug}: ${matches.map((m) => `${m.id}:${m.reciter_name}(${m.style})`).join(", ")}`);
    }
    resolved.set(r.slug, matches[0].id);
    console.log(`  resolved ${r.slug} → id ${matches[0].id} (${matches[0].reciter_name})`);
  }
  return resolved;
}
```

Replace the body of `main` with:
```ts
async function main() {
  console.log("seed-reciters: resolving Quran.com IDs");
  const ids = await resolveReciterIds();
  console.log("seed-reciters: resolved", ids);
}
```

- [ ] **Step 2: Run it**

```bash
set -a && source .env.local && set +a && npx tsx scripts/seed-reciters.ts
```

Expected: 5 `resolved ...` lines printed. If any reciter fails, adjust `match.name_contains` in `RECITERS` until all five resolve uniquely, then re-run.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-reciters.ts
git commit -m "feat(reciters): resolve Quran.com reciter IDs at seed time"
```

---

### Task 4: Seed script — upsert reciters table

**Files:**
- Modify: `scripts/seed-reciters.ts`

- [ ] **Step 1: Add seedReciters()**

Add below `resolveReciterIds`:

```ts
async function seedReciters(ids: Map<string, number>) {
  const rows = RECITERS.map((r) => ({
    slug: r.slug,
    display_name: r.display_name,
    style: r.style,
    quran_com_id: ids.get(r.slug)!,
    sort_order: r.sort_order,
    is_default: r.is_default,
  }));
  const { error } = await supabase.from("reciters").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`  upserted ${rows.length} reciters`);
}
```

Update `main`:
```ts
async function main() {
  console.log("seed-reciters: resolving Quran.com IDs");
  const ids = await resolveReciterIds();
  console.log("seed-reciters: seeding reciters table");
  await seedReciters(ids);
  console.log("seed-reciters: done (reciters only — recitations in next task)");
}
```

- [ ] **Step 2: Run it**

```bash
set -a && source .env.local && set +a && npx tsx scripts/seed-reciters.ts
```

Expected: `upserted 5 reciters`.

- [ ] **Step 3: Verify in Supabase**

Use Supabase MCP `execute_sql`:
```sql
select slug, display_name, style, quran_com_id, is_default from reciters order by sort_order;
```
Expected: 5 rows, `alafasy` is_default=true.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-reciters.ts
git commit -m "feat(reciters): seed 5 reciters into reciters table"
```

---

### Task 5: Seed script — fetch and upsert recitations per (reciter × surah)

**Files:**
- Modify: `scripts/seed-reciters.ts`

- [ ] **Step 1: Add recitation fetch + upsert**

Add below `seedReciters`:

```ts
interface QuranComAudioFile {
  verse_key: string;        // "2:43"
  url: string;              // may be relative (verses/...) or absolute
  segments: number[][];     // [[word_idx, start_ms, end_ms, ...], ...]
}

function absolutizeAudioUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Quran.com CDN prefix
  return `https://verses.quran.com/${url.replace(/^\/+/, "")}`;
}

function normalizeSegments(raw: number[][]): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const s of raw) {
    if (!Array.isArray(s) || s.length < 3) continue;
    const wi = Math.max(0, Math.floor(s[0]));
    const start = Math.max(0, Math.floor(s[1]));
    const end = Math.max(start, Math.floor(s[2]));
    out.push([wi, start, end]);
  }
  return out;
}

async function seedOneSurah(slug: string, quranComId: number, surah: number) {
  const url = `${QURAN_COM_API}/recitations/${quranComId}/by_chapter/${surah}`;
  const data = await fetchJson<{ audio_files: QuranComAudioFile[] }>(url);
  if (!data.audio_files || data.audio_files.length === 0) {
    throw new Error(`No audio_files for ${slug} surah ${surah}`);
  }
  const rows = data.audio_files.map((af) => {
    const [sStr, aStr] = af.verse_key.split(":");
    const ayah = parseInt(aStr, 10);
    const segments = normalizeSegments(af.segments || []);
    const duration_ms = segments.length > 0 ? segments[segments.length - 1][2] : 0;
    if (duration_ms === 0) {
      console.warn(`    zero duration for ${slug} ${af.verse_key} (no segments?)`);
    }
    return {
      reciter_slug: slug,
      surah: parseInt(sStr, 10),
      ayah,
      audio_url: absolutizeAudioUrl(af.url),
      duration_ms,
      segments,
    };
  });
  // Upsert in one call per surah (longest surah = 286 rows, well under Supabase batch limits)
  const { error } = await supabase
    .from("recitations")
    .upsert(rows, { onConflict: "reciter_slug,surah,ayah" });
  if (error) throw error;
  return rows.length;
}

async function seedRecitations(ids: Map<string, number>, onlySlug?: string) {
  const slugs = onlySlug ? [onlySlug] : RECITERS.map((r) => r.slug);
  for (const slug of slugs) {
    const quranComId = ids.get(slug);
    if (!quranComId) throw new Error(`No resolved Quran.com id for ${slug}`);
    for (let surah = 1; surah <= 114; surah++) {
      const n = await seedOneSurah(slug, quranComId, surah);
      console.log(`[${slug}] ${surah}/114 (${n} ayahs)`);
      await new Promise((r) => setTimeout(r, 150)); // rate limit
    }
  }
}
```

Replace `main`:
```ts
async function main() {
  const onlySlug = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  console.log("seed-reciters: resolving Quran.com IDs");
  const ids = await resolveReciterIds();
  console.log("seed-reciters: upserting reciters");
  await seedReciters(ids);
  console.log(`seed-reciters: seeding recitations${onlySlug ? ` (only ${onlySlug})` : ""}`);
  await seedRecitations(ids, onlySlug);
  console.log("seed-reciters: done");
}
```

- [ ] **Step 2: Dry-run with a single reciter first**

```bash
set -a && source .env.local && set +a && npx tsx scripts/seed-reciters.ts --only=alafasy
```

Expected runtime: ~3 minutes. Expected: lines like `[alafasy] 1/114 (7 ayahs)` through 114. No errors.

- [ ] **Step 3: Verify row counts**

Use Supabase MCP `execute_sql`:
```sql
select reciter_slug, count(*) from recitations group by reciter_slug;
```
Expected: `alafasy` → 6236 rows.

- [ ] **Step 4: Run full seed for all 5 reciters**

```bash
set -a && source .env.local && set +a && npx tsx scripts/seed-reciters.ts
```

Expected runtime: ~7 minutes. Expected total rows after: 31,180.

- [ ] **Step 5: Verify totals**

```sql
select reciter_slug, count(*) from recitations group by reciter_slug order by reciter_slug;
select count(*) from recitations;
```
Expected: 5 × 6236 = 31,180.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-reciters.ts
git commit -m "feat(reciters): seed per-ayah audio + word segments for 5 reciters"
```

---

### Task 6: Read helpers in `lib/quran/recitations.ts`

**Files:**
- Create: `lib/quran/recitations.ts`

- [ ] **Step 1: Write the helpers**

```ts
import { createClient } from "@supabase/supabase-js";

export interface Reciter {
  slug: string;
  display_name: string;
  style: "murattal" | "mujawwad";
  sort_order: number;
  is_default: boolean;
}

export type WordSegment = [word_index: number, start_ms: number, end_ms: number];

export interface RecitationAyah {
  ayah: number;
  audio_url: string;
  duration_ms: number;
  segments: WordSegment[];
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function fetchReciters(): Promise<Reciter[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reciters")
    .select("slug, display_name, style, sort_order, is_default")
    .order("sort_order");
  if (error || !data) return [];
  return data as Reciter[];
}

export async function fetchRecitation(
  reciterSlug: string,
  surah: number,
): Promise<RecitationAyah[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recitations")
    .select("ayah, audio_url, duration_ms, segments")
    .eq("reciter_slug", reciterSlug)
    .eq("surah", surah)
    .order("ayah");
  if (error || !data) return [];
  return data.map((row) => ({
    ayah: row.ayah as number,
    audio_url: row.audio_url as string,
    duration_ms: row.duration_ms as number,
    segments: (row.segments as WordSegment[]) || [],
  }));
}

export function pickDefaultReciter(reciters: Reciter[]): Reciter | null {
  if (reciters.length === 0) return null;
  return reciters.find((r) => r.is_default) || reciters[0];
}
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: no errors in the new file.

- [ ] **Step 3: Smoke-test the helpers**

Create `scripts/_smoke-recitations.ts` (temporary, deleted in Step 5):

```ts
import { fetchReciters, fetchRecitation, pickDefaultReciter } from "../lib/quran/recitations";

async function main() {
  const reciters = await fetchReciters();
  console.log("reciters:", reciters.map((r) => r.slug).join(", "));
  const def = pickDefaultReciter(reciters);
  if (!def) throw new Error("no default");
  console.log("default:", def.slug);
  const ayahs = await fetchRecitation(def.slug, 1);
  console.log("surah 1 ayahs:", ayahs.length, "first url:", ayahs[0]?.audio_url, "segments:", ayahs[0]?.segments.length);
}
main();
```

Run:
```bash
set -a && source .env.local && set +a && npx tsx scripts/_smoke-recitations.ts
```

Expected: 5 reciters listed, default `alafasy`, surah 1 has 7 ayahs, audio URL starts with `https://`, segments count > 0.

- [ ] **Step 4: Delete smoke script**

```bash
rm scripts/_smoke-recitations.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/quran/recitations.ts
git commit -m "feat(reciters): add Supabase read helpers for reciters + recitations"
```

---

### Task 7: Recitation store (pure TS, no React)

**Files:**
- Create: `components/reader/recitation-store.ts`

- [ ] **Step 1: Write the store**

```ts
import type { RecitationAyah, Reciter } from "@/lib/quran/recitations";

export interface PlayerState {
  reciter: Reciter;
  ayahIndex: number;          // 0-based index into the recitation array (NOT ayah number)
  activeWord: number | null;  // word index in current ayah, null if idle
  status: "idle" | "loading" | "playing" | "paused" | "error";
  currentMs: number;          // playback position within current ayah
  durationMs: number;         // duration of current ayah
  rate: number;               // 0.75 | 1.0 | 1.25 | 1.5
  autoScroll: boolean;
}

export interface RecitationStore {
  getState: () => PlayerState;
  subscribe: (fn: () => void) => () => void;
  setReciter: (reciter: Reciter, recitation: RecitationAyah[]) => void;
  setAyahIndex: (idx: number) => void;
  setActiveWord: (word: number | null) => void;
  setStatus: (s: PlayerState["status"]) => void;
  setTime: (currentMs: number, durationMs: number) => void;
  setRate: (rate: number) => void;
  setAutoScroll: (on: boolean) => void;
  getRecitation: () => RecitationAyah[];
}

export function createRecitationStore(
  initialReciter: Reciter,
  initialRecitation: RecitationAyah[],
): RecitationStore {
  let state: PlayerState = {
    reciter: initialReciter,
    ayahIndex: 0,
    activeWord: null,
    status: "idle",
    currentMs: 0,
    durationMs: initialRecitation[0]?.duration_ms ?? 0,
    rate: 1.0,
    autoScroll: true,
  };
  let recitation: RecitationAyah[] = initialRecitation;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((fn) => fn());

  return {
    getState: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    getRecitation: () => recitation,
    setReciter: (reciter, newRecitation) => {
      recitation = newRecitation;
      state = { ...state, reciter };
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
```

- [ ] **Step 2: Smoke-test `findActiveWord`**

Create `scripts/_smoke-store.ts`:
```ts
import { findActiveWord } from "../components/reader/recitation-store";

const segs: [number, number, number][] = [
  [0, 0, 500],
  [1, 500, 1000],
  [2, 1100, 1800],
];
const cases: [number, number | null][] = [
  [-10, null],
  [0, 0],
  [250, 0],
  [499, 0],
  [500, 1],
  [1050, 1],   // gap <200ms after seg 1 → snap to 1
  [1300, 2],
  [1799, 2],
  [2050, null], // 250ms past last end → null
];
let fail = 0;
for (const [ms, want] of cases) {
  const got = findActiveWord(segs, ms);
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? "ok" : "FAIL"}  ms=${ms}  got=${got}  want=${want}`);
}
process.exit(fail === 0 ? 0 : 1);
```

Run:
```bash
npx tsx scripts/_smoke-store.ts
```

Expected: all `ok` lines, exit 0.

- [ ] **Step 3: Delete smoke script**

```bash
rm scripts/_smoke-store.ts
```

- [ ] **Step 4: Lint**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add components/reader/recitation-store.ts
git commit -m "feat(reciters): pure-TS playback store + binary word lookup"
```

---

### Task 8: RecitationProvider React context + audio engine

**Files:**
- Create: `components/reader/recitation-provider.tsx`

- [ ] **Step 1: Write the provider**

```tsx
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

  // Persist reciter choice.
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

  // Audio event listeners.
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

  // Cleanup on unmount — pause audio.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const value = useMemo<ContextValue>(() => ({ store, surah, reciters }), [store, surah, reciters]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* The single <audio> element is owned here but not rendered — Audio() constructor in ref */}
    </Ctx.Provider>
  );
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

// useSyncExternalStore requires a stable snapshot reference. Selectors that return
// fresh objects/arrays each call would trigger infinite loops; cache by equality.
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
    (a, b) => (a === null && b === null) || (a !== null && b !== null && a.ayahIndex === b.ayahIndex && a.word === b.word),
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
  const { store, surah } = useCtx();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Grab the audio element by reading from the same singleton pattern — access via provider ref is not exposed,
  // so we re-instantiate a reference to the module-scoped singleton via the store's attached audio.
  // Simpler: expose a small setter on ctx. We'll use a window-scoped ref keyed by surah to keep this file self-contained:
  const globalKey = `__kurani_audio_${surah}`;
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w[globalKey]) {
      // Use existing audio from provider — discover it via the only <audio> tag the provider holds.
      // Since the provider creates it via `new Audio()` (not in DOM), we share via window.
      // The provider should have set this. To keep this robust, set it if missing.
    }
    audioRef.current = w[globalKey] || audioRef.current;
  }
  // NOTE: this window-keyed bridge is replaced with a proper context field in Task 9 wiring.

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
  }, [store]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((ms: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, ms / 1000);
  }, []);

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
  }, [store]);

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
  }, [store]);

  const setReciter = useCallback(async (reciter: Reciter) => {
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
  }, [store, surah]);

  const setRate = useCallback((rate: number) => {
    store.setRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [store]);

  const recenter = useCallback(() => {
    store.setAutoScroll(true);
  }, [store]);

  return { play, pause, seek, nextAyah, prevAyah, setReciter, setRate, recenter };
}
```

**Note on the audio bridge:** this task includes a temporary `window[globalKey]` bridge so `usePlayerActions` can reach the audio element. Task 9 cleans this up by moving the audio element into the context value itself — but this task ships a working provider first.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/reader/recitation-provider.tsx
git commit -m "feat(reciters): RecitationProvider + playback hooks (audio bridge stub)"
```

---

### Task 9: Clean up audio bridge — expose audio element via context

**Files:**
- Modify: `components/reader/recitation-provider.tsx`

- [ ] **Step 1: Move the audio element into context**

Change the `ContextValue` interface and provider to pass the audio ref:

Replace:
```ts
interface ContextValue {
  store: RecitationStore;
  surah: number;
  reciters: Reciter[];
}
```

With:
```ts
interface ContextValue {
  store: RecitationStore;
  surah: number;
  reciters: Reciter[];
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}
```

Update the `value = useMemo(...)` line to include `audioRef`:
```ts
const value = useMemo<ContextValue>(
  () => ({ store, surah, reciters, audioRef }),
  [store, surah, reciters],
);
```

- [ ] **Step 2: Rewrite `usePlayerActions` to read audio from context**

Replace the entire `usePlayerActions` function with:

```ts
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

  const seek = useCallback((ms: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, ms / 1000);
  }, [audioRef]);

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

  const setReciter = useCallback(async (reciter: Reciter) => {
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
  }, [store, surah, audioRef]);

  const setRate = useCallback((rate: number) => {
    store.setRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [store, audioRef]);

  const recenter = useCallback(() => {
    store.setAutoScroll(true);
  }, [store]);

  return { play, pause, seek, nextAyah, prevAyah, setReciter, setRate, recenter };
}
```

- [ ] **Step 3: Delete the window-bridge leftover code**

Inside the provider component, delete the now-unused `const globalKey = ...` and window assignment code from `usePlayerActions` (the above rewrite already drops it). No remaining `window[globalKey]` reference should exist.

- [ ] **Step 4: Lint**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add components/reader/recitation-provider.tsx
git commit -m "refactor(reciters): route audio element through context instead of window"
```

---

### Task 10: ArabicBlock component

**Files:**
- Create: `components/reader/arabic-block.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useMemo } from "react";
import type { Ayah } from "@/lib/quran/api";
import { useActiveAyah, useActiveWord } from "./recitation-provider";

interface ArabicBlockProps {
  ayahs: Ayah[];
}

// Pre-split words per ayah at mount. Strip the standalone ayah-number glyph if it appears in the text.
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
  const activeAyah = useActiveAyah();         // ayahIndex in recitation (0-based)
  const activeWord = useActiveWord();         // { ayahIndex, word }

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
                activeWord && activeWord.ayahIndex === ayahIdx && activeWord.word === wi;
              const isPlayed =
                isActiveAyah &&
                activeWord &&
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
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/reader/arabic-block.tsx
git commit -m "feat(reciters): ArabicBlock continuous RTL paragraph with word-level karaoke"
```

---

### Task 11: TranslationParagraph component

**Files:**
- Create: `components/reader/translation-paragraph.tsx`

- [ ] **Step 1: Write the component**

```tsx
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
            {showFootnotes ? `— ${footnotesLabel} (${ayahsWithFootnotes.length})` : `+ ${footnotesLabel} (${ayahsWithFootnotes.length})`}
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
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/reader/translation-paragraph.tsx
git commit -m "feat(reciters): TranslationParagraph with ayah-level highlight + footnote disclosure"
```

---

### Task 12: ReciterPlayer — compact pill (resting state)

**Files:**
- Create: `components/reader/reciter-player.tsx`

- [ ] **Step 1: Write the pill-only version**

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  usePlayerActions,
  usePlayerState,
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
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
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
  // Filled in Task 13.
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
        <button aria-label="Close" onClick={onClose} className="text-white/60 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div className="mt-2 text-xs text-white/60">
        {formatMs(state.currentMs)} / {formatMs(state.durationMs)}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/reader/reciter-player.tsx
git commit -m "feat(reciters): Liquid-Glass player — compact pill state"
```

---

### Task 13: ReciterPlayer — expanded panel (progress, transport, reciter picker)

**Files:**
- Modify: `components/reader/reciter-player.tsx`

- [ ] **Step 1: Add reciter picker + total ayahs hook imports**

At the top of `reciter-player.tsx`, extend imports:

```tsx
import {
  usePlayerActions,
  usePlayerState,
  useReciterList,
  useTotalAyahs,
} from "./recitation-provider";
```

- [ ] **Step 2: Replace `ExpandedPanel` with the full version**

```tsx
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
        <button aria-label="Close" onClick={onClose} className="text-white/60 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

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
          <button aria-label="Previous ayah" onClick={actions.prevAyah} className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9 12l11-7v14z"/></svg>
          </button>
          <button
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={() => (isPlaying ? actions.pause() : actions.play())}
            className="w-10 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
            )}
          </button>
          <button aria-label="Next ayah" onClick={actions.nextAyah} className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM15 12L4 19V5z"/></svg>
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
```

- [ ] **Step 3: Lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add components/reader/reciter-player.tsx
git commit -m "feat(reciters): Liquid-Glass player — expanded panel with transport, scrub, picker"
```

---

### Task 14: Wire everything into the surah page

**Files:**
- Modify: `app/[lang]/[surah]/page.tsx`

- [ ] **Step 1: Add imports and fetch reciter data on the server**

At the top of `app/[lang]/[surah]/page.tsx`, add:

```tsx
import { fetchReciters, fetchRecitation, pickDefaultReciter } from "@/lib/quran/recitations";
import { RecitationProvider } from "@/components/reader/recitation-provider";
import { ArabicBlock } from "@/components/reader/arabic-block";
import { TranslationParagraph } from "@/components/reader/translation-paragraph";
import { ReciterPlayer } from "@/components/reader/reciter-player";
```

Remove the now-unused `AyahDisplay` import.

- [ ] **Step 2: Fetch reciter data inside `SurahPage`**

Inside `SurahPage`, after the `const ayahs = await fetchSurah(...)` line add:

```tsx
const reciters = await fetchReciters();
const defaultReciter = pickDefaultReciter(reciters);
const initialRecitation = defaultReciter
  ? await fetchRecitation(defaultReciter.slug, surahNum)
  : [];
```

- [ ] **Step 3: Replace ayahs loop with provider + new components**

Find the block:

```tsx
{/* Ayahs */}
<div className="space-y-3">
  {ayahs.map((ayah) => (
    <AyahDisplay key={ayah.id} ayah={ayah} footnotesLabel={dict["reader.footnotes"]} />
  ))}
</div>
```

Replace with:

```tsx
{/* Ayahs + translation paragraph */}
{defaultReciter && initialRecitation.length > 0 ? (
  <RecitationProvider
    surah={surahNum}
    reciters={reciters}
    initialReciter={defaultReciter}
    initialRecitation={initialRecitation}
  >
    <ArabicBlock ayahs={ayahs} />
    <TranslationParagraph ayahs={ayahs} footnotesLabel={dict["reader.footnotes"]} />
  </RecitationProvider>
) : (
  <>
    <ArabicBlockFallback ayahs={ayahs} />
    <TranslationParagraphFallback ayahs={ayahs} footnotesLabel={dict["reader.footnotes"]} />
  </>
)}
```

- [ ] **Step 4: Add the fallback components (no provider = no player)**

Append to `app/[lang]/[surah]/page.tsx` (below `SurahPage`):

```tsx
import type { Ayah as AyahType } from "@/lib/quran/api";

function toArabicDigits(n: number) {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).split("").map((c) => map[Number(c)] ?? c).join("");
}

function ArabicBlockFallback({ ayahs }: { ayahs: AyahType[] }) {
  return (
    <div dir="rtl" className="text-right font-serif text-white/90 leading-[2.4] text-[1.7rem]">
      {ayahs.map((a) => (
        <span key={a.id} className="inline">
          {a.arabic_text}
          <span className="inline-block text-emerald-400/80 text-base mx-1 align-middle">
            ﴿{toArabicDigits(parseInt(a.aya, 10))}﴾
          </span>{" "}
        </span>
      ))}
    </div>
  );
}

function TranslationParagraphFallback({ ayahs, footnotesLabel }: { ayahs: AyahType[]; footnotesLabel: string }) {
  const withFn = ayahs.filter((a) => a.footnotes?.trim());
  return (
    <div className="mt-10">
      <p className="text-base text-gray-300 leading-relaxed">
        {ayahs.map((a) => (
          <span key={a.id} dir="auto">
            <sup className="text-[10px] text-emerald-500 font-mono mx-0.5">{a.aya}</sup>
            {a.translation}{" "}
          </span>
        ))}
      </p>
      {withFn.length > 0 && (
        <details className="mt-6 border-t border-gray-800/40 pt-4 text-xs text-gray-500">
          <summary className="text-[11px] text-emerald-500 font-mono cursor-pointer">
            {footnotesLabel} ({withFn.length})
          </summary>
          <ul className="mt-3 space-y-2 leading-relaxed">
            {withFn.map((a) => (
              <li key={a.id}><span className="text-emerald-400 font-mono mr-2">({a.aya})</span>{a.footnotes}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Rebuild the return statement with provider wrapping nav + body**

The player must be inside the `RecitationProvider` context, and the player lives in the nav, so the provider must wrap the whole page (not just the surah body). Replace the `return (…)` block at the bottom of `SurahPage` with:

```tsx
const body = (
  <div className="min-h-screen bg-gray-950 text-gray-200">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd) }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
    {/* Header bar */}
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
        <Link href={`/${lang}`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono tracking-widest transition-colors shrink-0">
          &larr; {dict["reader.back"]}
        </Link>
        <div className="flex items-center gap-2">
          {defaultReciter && initialRecitation.length > 0 ? (
            <ReciterPlayer />
          ) : (
            <span className="text-xs text-gray-500 font-mono hidden sm:inline">{meta.transliteration}</span>
          )}
          <LanguageSelector currentLang={lang} />
        </div>
      </div>
    </nav>

    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Surah header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{meta.transliteration}</h1>
        <p className="text-xl font-serif text-gray-400 mt-1" dir="rtl">{meta.name}</p>
        <p className="text-sm text-gray-500 mt-2">
          {surahName} &bull; {meta.ayahCount} {dict["reader.ayahs"]} &bull; {revelationLabel}
        </p>
      </div>

      {/* Bismillah */}
      {surahNum !== 9 && surahNum !== 1 && (
        <div className="text-center mb-6 py-4">
          <p className="text-lg font-serif text-emerald-400" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        </div>
      )}

      {/* Ayahs + translation paragraph */}
      {defaultReciter && initialRecitation.length > 0 ? (
        <>
          <ArabicBlock ayahs={ayahs} />
          <TranslationParagraph ayahs={ayahs} footnotesLabel={dict["reader.footnotes"]} />
        </>
      ) : (
        <>
          <ArabicBlockFallback ayahs={ayahs} />
          <TranslationParagraphFallback ayahs={ayahs} footnotesLabel={dict["reader.footnotes"]} />
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-800/50">
        {prev ? (
          <Link href={`/${lang}/${prev.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            &larr; {prev.transliteration}
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/${lang}/${next.number}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            {next.transliteration} &rarr;
          </Link>
        ) : <div />}
      </div>

      {/* Related Surahs (unchanged — keep existing block here) */}
      {/* Browse all link (unchanged — keep existing block here) */}
    </div>
  </div>
);

return defaultReciter && initialRecitation.length > 0 ? (
  <RecitationProvider
    surah={surahNum}
    reciters={reciters}
    initialReciter={defaultReciter}
    initialRecitation={initialRecitation}
  >
    {body}
  </RecitationProvider>
) : (
  body
);
```

Keep the existing "Related Surahs" and "Browse all surahs" blocks where the comments indicate — copy them verbatim from the current file; they don't change.

Delete the Step 3 in-body replacement (the "Ayahs + translation paragraph" block is already in the correct place in this `body` rewrite).

- [ ] **Step 6: Build & smoke-test**

```bash
npm run build
```
Expected: build succeeds with no type errors.

Then run dev:
```bash
npm run dev
```
Open `http://localhost:3000/en/1`. Verify:
- Arabic paragraph renders as one continuous RTL block with ayah glyphs ﴿١﴾﴿٢﴾… interleaved
- Translation paragraph below shows superscript ayah numbers inline
- Glass pill appears top-right in the nav
- Clicking ▶︎ starts audio, active word highlights emerald, active ayah gets faint bg
- Clicking ⋯ expands the panel; selecting a different reciter switches audio
- Scrub bar + prev/next + speed all work

- [ ] **Step 7: Commit**

```bash
git add app/\[lang\]/\[surah\]/page.tsx
git commit -m "feat(reciters): wire player + karaoke components into surah page"
```

---

### Task 15: Auto-scroll behavior

**Files:**
- Modify: `components/reader/recitation-provider.tsx`

- [ ] **Step 1: Add scroll effect inside the provider**

Inside the `RecitationProvider` function body, after the preload effect, add:

```tsx
// Track programmatic scrolls so user scrolls can disable auto-scroll.
const programmaticScrollUntilRef = useRef(0);

// Auto-scroll active ayah into view on ayahIndex change.
useEffect(() => {
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
}, [store]);

// If user scrolls during playback (outside a programmatic scroll window), pause auto-scroll.
useEffect(() => {
  const onScroll = () => {
    if (Date.now() < programmaticScrollUntilRef.current) return;
    if (store.getState().status === "playing" && store.getState().autoScroll) {
      store.setAutoScroll(false);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, [store]);

// Re-arm auto-scroll whenever the user explicitly presses play after a pause.
useEffect(() => {
  return store.subscribe(() => {
    const s = store.getState();
    if (s.status === "playing" && !s.autoScroll && s.currentMs === 0) {
      store.setAutoScroll(true);
    }
  });
}, [store]);
```

Also hoist `useRef` import at the top — already present from Task 8.

- [ ] **Step 2: Smoke-test manually**

```bash
npm run dev
```
Open `/en/2` (Al-Baqarah, long surah). Press play. Verify:
- As each ayah starts, its Arabic span scrolls smoothly to the center
- Manually scrolling disables auto-scroll (next ayah does NOT pull view)
- Opening expanded player shows "Re-center" link; clicking it re-enables auto-scroll

- [ ] **Step 3: Commit**

```bash
git add components/reader/recitation-provider.tsx
git commit -m "feat(reciters): smooth auto-scroll to active ayah with user-pause"
```

---

### Task 16: Keyboard shortcuts (spacebar + arrows)

**Files:**
- Modify: `components/reader/recitation-provider.tsx`

- [ ] **Step 1: Add keyboard handler**

Inside the `RecitationProvider` function body (after the scroll effects), add:

```tsx
// Spacebar toggles play/pause; ←/→ step ayahs. Ignored when focus is inside form controls.
useEffect(() => {
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
}, [store]);
```

- [ ] **Step 2: Smoke-test**

Reload `/en/1`. Press Space → play/pause toggles. Press Right/Left → ayah advances/retreats.

- [ ] **Step 3: Commit**

```bash
git add components/reader/recitation-provider.tsx
git commit -m "feat(reciters): keyboard shortcuts for play/pause + ayah step"
```

---

### Task 17: Error UI in the player

**Files:**
- Modify: `components/reader/reciter-player.tsx`

- [ ] **Step 1: Show error banner when `status === "error"`**

In `ExpandedPanel`, immediately after the `<div ... justify-between>` header block, insert:

```tsx
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
```

In the compact pill, change the play button icon to show a warning triangle when `state.status === "error"`:

Replace the play-button SVG block with:

```tsx
{state.status === "error" ? (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-red-400"><path d="M12 2L2 22h20L12 2zm0 6v6m0 3v.5"/></svg>
) : isPlaying ? (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
) : (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
)}
```

- [ ] **Step 2: Lint + build**

```bash
npm run lint && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add components/reader/reciter-player.tsx
git commit -m "feat(reciters): error state + retry in player"
```

---

### Task 18: Word-count drift safety net

**Files:**
- Modify: `components/reader/recitation-provider.tsx`

- [ ] **Step 1: Degrade to ayah-level highlight when word count mismatches**

Inside the rAF tick effect, replace the `findActiveWord(ayah.segments, ms)` call with:

```ts
// If the segment's highest word_index exceeds the number of words we rendered in the DOM,
// we can't trust per-word mapping — fall through with activeWord=null (ayah-level highlight only).
const domEl = document.querySelector<HTMLElement>(`[data-ayah="${s.ayahIndex}"]`);
const wordCount = domEl ? domEl.querySelectorAll("[data-word]").length : 0;
const maxWi = ayah.segments.reduce((m, seg) => Math.max(m, seg[0]), -1);
const word =
  wordCount > 0 && maxWi < wordCount
    ? findActiveWord(ayah.segments, ms)
    : null;
```

This silently degrades per-ayah to ayah-level highlight when the split count doesn't match, without breaking playback.

- [ ] **Step 2: Build + smoke test**

```bash
npm run build && npm run dev
```
Open `/en/1`, confirm karaoke still highlights per word (the healthy path).

- [ ] **Step 3: Commit**

```bash
git add components/reader/recitation-provider.tsx
git commit -m "feat(reciters): safe degrade to ayah-level highlight on word-count drift"
```

---

### Task 19: Cleanup — remove unused `ayah-display.tsx`

**Files:**
- Remove: `components/reader/ayah-display.tsx` (conditional)

- [ ] **Step 1: Confirm it's unused**

Use the Grep tool (not shell `grep`):
- pattern: `AyahDisplay|ayah-display`
- output_mode: `files_with_matches`

Expected: zero matches (the Task 14 edits dropped the import). If any match appears outside `components/reader/ayah-display.tsx` itself, **do not delete** — that consumer needs to be rewritten first.

- [ ] **Step 2: Delete the file if unused**

```bash
rm components/reader/ayah-display.tsx
```

- [ ] **Step 3: Build to confirm nothing broke**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A components/reader/ayah-display.tsx
git commit -m "chore(reader): remove legacy AyahDisplay (replaced by ArabicBlock + TranslationParagraph)"
```

---

### Task 20: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Production build + lint clean**

```bash
npm run build && npm run lint
```
Expected: both succeed with zero errors.

- [ ] **Step 2: Manual QA on `/en/1`, `/en/2`, `/en/18`, `/sq/1`, `/ar/1`**

For each URL:
- Landing surah page renders (no hydration warnings in devtools console)
- Player pill visible top-right of nav
- Play starts audio within ~1s; first-word highlight fires
- Active ayah gets emerald background wash in both Arabic block and translation paragraph
- Translation paragraph reads as prose with superscript ayah numbers
- On `/en/2` specifically: auto-scroll tracks across multiple ayahs, pauses when user scrolls, re-centers on button
- Switch reciter mid-playback — audio resumes at matching position in new reciter
- Change speed to 1.5× — highlighting stays in sync
- Close tab → no background audio keeps playing

- [ ] **Step 3: Final commit (if any fixup needed)**

If QA revealed small fixes, commit them; otherwise proceed.

- [ ] **Step 4: Done**

Feature complete. Merge strategy left to the user.

---

## Spec Coverage Checklist

- ✅ §3 Architecture — Tasks 6, 8, 10, 11, 12, 13, 14
- ✅ §4 Data source — Tasks 1, 3, 5
- ✅ §5 DB schema — Task 1
- ✅ §6 Seed script — Tasks 2, 3, 4, 5
- ✅ §7.1 Surah page — Task 14
- ✅ §7.2 ArabicBlock — Task 10
- ✅ §7.3 TranslationParagraph — Task 11
- ✅ §7.4 Non-recitation mode — Task 14 (fallback components)
- ✅ §7.5 Remove ayah-display — Task 19
- ✅ §8 Liquid Glass player — Tasks 12, 13
- ✅ §9 Playback engine — Tasks 7, 8, 9, 15, 16
- ✅ §10 Error handling — Tasks 5 (seed retries), 17 (runtime UI), 18 (segment mismatch)
- ✅ §11 localStorage key `kurani-reciter` — Task 8 (inside provider mount + subscribe)
