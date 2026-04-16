# Reciter Feature — Design Spec

**Date:** 2026-04-16
**Scope:** Add Arabic audio recitation with word-level karaoke to the surah reading view, backed by a local seed script that populates Supabase from Quran.com API v4.

## 1. Goal

Let readers listen to the Quran in Arabic while the active word is highlighted inside a continuous Arabic paragraph, with a corresponding translation paragraph below that highlights the active ayah. Five classic reciters ship initially; the schema supports unlimited reciters. A compact Liquid-Glass player sits at the top-right of the surah view.

## 2. Non-goals (YAGNI)

- Offline download / service-worker audio caching
- Bookmarking last-listened ayah across sessions
- Background playback / Media Session API metadata
- Page-level repeat, A-B loop, repeat-ayah-N-times
- Tajweed colour highlighting
- Cross-surah playlists
- Per-user reciter preference synced to DB (localStorage is enough)
- Word-level karaoke on translated text (timing data doesn't exist)
- Supporting reciters outside the initial 5

## 3. Architecture overview

- **Data layer:** Quran.com API v4 is the one-time source. A local Node script pulls audio URLs + word-segment timings for 5 reciters × 114 surahs × all ayahs and upserts into Supabase. After seeding, the reader has no runtime dependency on Quran.com.
- **Server:** `app/[lang]/[surah]/page.tsx` stays server-rendered. New server helpers `fetchReciters()` and `fetchRecitation(reciterSlug, surah)` query Supabase and pass results to client components as props.
- **Client engine:** A single `<RecitationProvider>` context wraps the surah body. It owns the only `<audio>` element, the active-ayah/active-word state, and auto-scroll behaviour. Subscribers: the player pill, the Arabic block, the translation paragraph.
- **UI components:**
  - `ArabicBlock` — continuous RTL paragraph, word-level karaoke spans
  - `TranslationParagraph` — prose with superscript ayah numbers, ayah-level highlight
  - `ReciterPlayer` — compact Liquid-Glass pill in the sticky nav, expands on tap

## 4. Data source

**API:** Quran.com API v4, no key required.

- `GET https://api.quran.com/api/v4/recitations` — list all reciters; used at seed time to map slugs to numeric IDs.
- `GET https://api.quran.com/api/v4/recitations/{recitation_id}/by_chapter/{chapter_number}` — returns `audio_files[]`, each `{ verse_key, url, segments }`. `segments` is an array whose first three elements per entry are `[word_index, start_ms, end_ms]`. Any trailing elements (some reciters emit extra audio-seek markers) are ignored; the seed script stores only the `[word_index, start_ms, end_ms]` triple per word.

**Initial reciters (resolved to IDs at seed time; hard-coded IDs are approximate, verified against the live `/recitations` response):**

| slug | display name | style | approx recitation_id |
|---|---|---|---|
| `alafasy` | Mishary Rashid Al-Afasy | murattal | 7 |
| `abdul_basit_mujawwad` | Abdul Basit Abd us-Samad | mujawwad | 2 |
| `maher_al_muaiqly` | Maher Al-Muaiqly | murattal | 12 |
| `sudais` | Abdur-Rahman As-Sudais | murattal | 3 |
| `husary` | Mahmoud Khalil Al-Husary | murattal | 6 |

Default on first load: `alafasy` (`is_default = true`).

## 5. Database schema

Two new Supabase tables.

```sql
-- One row per reciter (5 rows at launch, can grow).
create table reciters (
  slug           text primary key,
  display_name   text not null,
  style          text not null,                  -- 'murattal' | 'mujawwad'
  quran_com_id   int  not null,
  sort_order     int  not null default 0,
  is_default     boolean not null default false
);

-- One row per (reciter, surah, ayah). 5 x 6,236 = ~31,180 rows at launch.
create table recitations (
  reciter_slug   text not null references reciters(slug) on delete cascade,
  surah          int  not null,                  -- 1..114
  ayah           int  not null,                  -- 1..N
  audio_url      text not null,                  -- full https URL (Quran.com CDN)
  duration_ms    int  not null,                  -- derived from last segment end
  segments       jsonb not null,                 -- [[word_idx, start_ms, end_ms], ...]
  primary key (reciter_slug, surah, ayah)
);

create index recitations_surah_idx on recitations (reciter_slug, surah, ayah);
```

**Why `jsonb` for segments:** segments are dense, read as a block, never mutated. A normalized child table would mean tens of thousands of tiny rows per surah with zero upside.

**Read path:** server page issues one query per surah:
`select ayah, audio_url, duration_ms, segments from recitations where reciter_slug = $1 and surah = $2 order by ayah` — returns ≤286 rows for the longest surah.

## 6. Seed script

**Location:** `scripts/seed-reciters.ts`, run with `npx tsx scripts/seed-reciters.ts` (matches existing `seed-descriptions.ts` / `import-quran.ts` pattern).

**Flow:**

1. Load `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. Abort if missing.
2. `GET /api/v4/recitations`. For each of the 5 hard-coded slugs, match on `reciter_name` + `style` to resolve the current numeric ID. Fail loudly if any reciter is missing or matches ambiguously.
3. Upsert the 5 rows into `reciters` (idempotent on `slug`).
4. For each reciter × each surah (5 × 114 = 570 requests):
   - `GET /api/v4/recitations/{id}/by_chapter/{n}` → `audio_files[]`
   - Derive `surah`, `ayah` from `verse_key` (`"2:43"` → `2, 43`).
   - Derive `duration_ms` from the max `end_ms` across segments (fallback: 0 with a logged warning).
   - Upsert into `recitations` in batches of 500 via a single `upsert(..., { onConflict: "reciter_slug,surah,ayah" })`.
5. **Rate limit:** 150 ms between requests (~85 s per reciter, ~7 min total run).
6. **Retries:** exponential backoff on 429/5xx, max 3 tries per request. Non-recoverable errors abort the whole run with a clear message including the failing `(reciter, surah)`.
7. **Resumability:** fully idempotent — re-running picks up where it left off because upserts are no-ops for unchanged rows. A `--only=<slug>` CLI flag re-seeds one reciter.
8. **Progress:** logs `[alafasy] 42/114 Al-Baqarah (286 ayahs)` per surah.

**Out of script scope:** no audio download/transcoding/mirroring. Audio URLs point at Quran.com's CDN directly — free, fast, CORS-enabled. Mirroring would add cost and complexity with no user-visible benefit.

## 7. Reader UI changes

### 7.1 Surah page (`app/[lang]/[surah]/page.tsx`)

- Stop mapping ayahs through `<AyahDisplay>`.
- On the server, call `fetchReciters()` and `fetchRecitation(defaultSlug, surahNum)`, pass results to a new client-side `<RecitationProvider>`.
- Inside the provider, render two new client components instead of the ayah-cards:
  1. `<ArabicBlock ayahs={ayahs} />`
  2. `<TranslationParagraph ayahs={ayahs} />`
- Bismillah, header, prev/next, related surahs, JSON-LD, and metadata logic are unchanged.

### 7.2 `<ArabicBlock>`

- One continuous RTL paragraph. For each ayah, render `<span data-ayah={n}>` containing:
  - Word spans `<span data-word={i}>` for each whitespace-split word in `arabic_text`
  - A small emerald ayah-number glyph `﴿٢﴾` after the last word
- Word states:
  - `idle` — gray-500
  - `active` — emerald-400 + subtle glow
  - `played` — white/85
- Active ayah gets a faint emerald-500/5 background wash across the whole span.
- Word splitting runs once at mount (`arabic_text.split(/\s+/)`). Segment `word_index` values map directly to the DOM word index — no re-tokenizing.
- Typography: existing `font-serif`, line-height bumped to `2.4` for RTL comfort.

### 7.3 `<TranslationParagraph>`

- One `<p>` per surah. Each ayah is a `<span data-ayah={n}>` containing `<sup>n</sup>` + translation text + trailing space.
- Active ayah: emerald-500/10 background, rounded-sm padding, emerald-300 text.
- No word-level highlight, no per-ayah footnote buttons.
- Footnotes for all ayahs consolidated into one disclosure at the end of the translation (click to expand list of `(ayah #)  footnote text`). Simpler than per-ayah buttons and survives the paragraph layout.
- Inherits `dir="auto"` from the ayah span so RTL translation languages (ar, fa, ur) render correctly without special cases.

### 7.4 Non-recitation mode

When nothing is playing, both blocks render in resting state. The view is fully readable without pressing play — karaoke is additive.

### 7.5 `components/reader/ayah-display.tsx`

No longer used by the surah page. Will be removed if nothing else references it (checked during implementation).

## 8. Liquid Glass player

**File:** `components/reader/reciter-player.tsx` (client).

**Placement:** rendered inside the existing sticky `<nav>` on the surah page, right-aligned, replacing the hidden `meta.transliteration` slot on wider screens. `LanguageSelector` stays to its right.

**Two visual states, transitioned with Motion (spring, 220 ms):**

### 8.1 Resting pill (~40 px × ~150 px)

```
╭────────────────────╮
│  ▶︎  Alafasy   ⋯  │
╰────────────────────╯
```

- `bg-white/5 backdrop-blur-xl backdrop-saturate-150`
- `border border-white/10`, inner highlight via `box-shadow: inset 0 1px 0 rgba(255,255,255,0.08)`
- Subtle emerald radial overlay: `bg-[radial-gradient(circle_at_30%_0%,rgba(16,185,129,0.18),transparent_60%)]`
- Faint moving highlight on hover (Motion gradient shift)
- `▶︎` button (emerald-400 on hover) left; truncated reciter name center; `⋯` expand right

### 8.2 Expanded panel (~300 × 170 px, anchored top-right)

```
╭────────────────────────────╮
│  Mishary Alafasy        ╳  │
│  ▓▓▓▓▓▓▓▓▓░░░░  1:14/3:22  │
│  ⏮   ▶︎   ⏭      1.0×      │
│  Reciter ▾      Ayah 5/7   │
╰────────────────────────────╯
```

- Header: reciter display name + close (`╳`) returns to pill
- Progress bar: full current-ayah duration, draggable to scrub; label `mm:ss / mm:ss`
- Transport: `⏮` prev ayah, `▶︎/⏸` toggle, `⏭` next ayah, speed button cycles `0.75× → 1.0× → 1.25× → 1.5×`
- Footer: reciter picker (dropdown of all DB rows sorted by `sort_order`), ayah counter `ayah / total`
- `Re-center` link appears on the right when auto-scroll is paused

### 8.3 Behaviours

- Pill still displays when audio isn't playing. Expanded panel shows `0:00 / —:—` until first play resolves duration.
- Reciter switch mid-playback: remember `(ayah, segments[activeWord].start_ms_ratio)`; on new reciter, jump to same ayah, seek to `duration × ratio`, snap to the nearest segment start.
- Speed change: sets `audio.playbackRate`. Segment lookup reads `audio.currentTime`, which already accounts for rate — no math changes.
- Spacebar toggles play/pause when the player isn't blurred inside a form control.
- Mobile (<640 px): expanded panel goes full-width, anchored under the nav. Same component, Tailwind responsive classes.
- Always-dark glass styling — no light-mode variant.

## 9. Playback engine

**File:** `components/reader/recitation-provider.tsx` (client, React context).

### 9.1 State owned by the provider

- Current reciter slug (default: `reciters.is_default`; overridden by `localStorage['kurani-reciter']` if present; player persists last choice there).
- Per-ayah recitation map: `Map<ayah, { audio_url, segments, duration_ms }>`.
- Playback state: `idle | loading | playing | paused`.
- Active ayah number + active word index (`null` when idle).
- Auto-scroll enabled flag.
- Single `<audio>` element reference.

### 9.2 Playback loop

1. Playback is scoped to **one ayah at a time** — each ayah is its own MP3 on Quran.com's CDN.
2. User hits play (or auto-advance): set `audio.src = map[ayah].audio_url`, call `audio.play()`.
3. On `timeupdate` (fires ~4×/s) + a `requestAnimationFrame` loop during playback, binary-search `segments` to find the active word (`start_ms ≤ currentTime*1000 < end_ms`). Update context state only when `activeWord` changes — avoids rerender storms.
4. On `ended`: advance `ayah + 1`. If past surah end, stop and reset to `idle`.
5. Preload: at ayah N start, inject `<link rel="preload" as="audio" href={ayah N+1 url}>` to avoid audible gap between ayahs.

### 9.3 Rationale for per-ayah audio

Quran.com provides per-ayah MP3s with per-ayah segments (word indices reset each ayah). Concatenating would mean recomputing cumulative offsets; per-ayah matches the source data and ayah gaps are ≪100 ms thanks to preloading.

### 9.4 Subscription shape

Components consume narrow slices (each hook uses `useSyncExternalStore` so unrelated state changes don't rerender the whole surah):

- `useActiveAyah()` → `number | null`
- `useActiveWord()` → `{ ayah, wordIndex } | null`
- `usePlayerState()` → `{ reciter, isPlaying, progress, duration, ayahIndex, totalAyahs, rate, autoScroll }`
- `usePlayerActions()` → `{ play, pause, seek, nextAyah, prevAyah, setReciter, setRate, recenter }`

### 9.5 Auto-scroll

- On active-ayah change, call `document.querySelector('[data-ayah="${n}"]').scrollIntoView({ behavior: 'smooth', block: 'center' })` — only on the Arabic block element (the primary karaoke target).
- A `scroll` listener on `window` flips `autoScroll = false` if a scroll event fires that wasn't caused by our own `scrollIntoView` (tracked via a short flag window after each programmatic call). Re-centered on `Re-center` or cleared at the start of the next ayah after the user presses play again.
- Respects `prefers-reduced-motion` — when set, scroll uses `behavior: 'auto'` (instant jump) instead of smooth.

### 9.6 Accessibility

- Player is keyboard-operable (space/arrow keys).
- `<audio>` carries `aria-label="Quran recitation"`.
- Active word span has `aria-current="true"`.

## 10. Error handling

### 10.1 Runtime

- **Audio file 404 / network fail** → player shows inline `⚠ Couldn't load audio · Retry`; karaoke state resets to idle; page stays readable.
- **Missing `segments`** for an ayah → audio still plays, karaoke degrades to ayah-level highlight only. Logged once to console in dev.
- **No `recitations` row for the chosen reciter/surah** → player renders `disabled` with tooltip `"Not available for this reciter"`. Other reciters still work.
- **Autoplay blocked** → initial tap-to-play is always required. We never autoplay.
- **Navigation away mid-recitation** → provider cleanup calls `audio.pause()`. No background playback.

### 10.2 Seed script

- Per-request: exponential backoff on 429/5xx, max 3 tries.
- Bad JSON / 4xx other than 429 → abort whole run with `(reciter, surah)` context. No partial corruption: each surah is its own upsert transaction.
- Reciter-slug lookup mismatch on the `/recitations` pre-flight → abort with clear message, no silent substitution.

### 10.3 Edge cases

- **Bismillah:** unchanged — rendered as its own element above the Arabic block (as today, except for surah 1 and 9). Quran.com's `1:1` is the bismillah; we store/play it as ayah 1 of surah 1.
- **Word-split drift:** word-splitting uses `/\s+/` on NFC-normalized `arabic_text`. If at mount `word_count !== max(segment.word_index) + 1` for an ayah, log once and degrade that specific ayah to ayah-level highlight.
- **Long surahs (Al-Baqarah, 286 ayahs):** page prop payload ~200 KB jsonb — acceptable. If it ever becomes a concern, fetch recitation on play instead of on page load. Not doing it now.
- **Reciter switch while paused:** just swaps `src` and segment map; stays paused.
- **Scrub past end / before start:** clamped to `[0, duration]`, active word re-derived.
- **RTL translation languages:** `dir="auto"` on ayah spans handles it; no special case.

## 11. localStorage keys

- `kurani-reciter` — slug of last-used reciter (persists across surah navigations).

## 12. File summary

**New:**

- `scripts/seed-reciters.ts`
- `components/reader/recitation-provider.tsx`
- `components/reader/arabic-block.tsx`
- `components/reader/translation-paragraph.tsx`
- `components/reader/reciter-player.tsx`
- `lib/quran/recitations.ts` (Supabase read helpers: `fetchReciters`, `fetchRecitation`)

**Changed:**

- `app/[lang]/[surah]/page.tsx` — swap ayah-cards block for provider + new components
- `lib/quran/api.ts` — optional: export a shared Supabase client helper if the new read module wants it

**Migrations:**

- New SQL migration file creating `reciters` and `recitations` tables + index + 5 default reciter rows inserted by the seed script

**Removed (if unreferenced):**

- `components/reader/ayah-display.tsx`
