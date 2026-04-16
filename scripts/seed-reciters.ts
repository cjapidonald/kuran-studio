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
  { slug: "alafasy",              display_name: "Mishary Rashid Al-Afasy",        style: "murattal", match: { name_contains: "Mishari",  style: "murattal" }, sort_order: 10, is_default: true },
  { slug: "abdul_basit_mujawwad", display_name: "Abdul Basit Abd us-Samad",       style: "mujawwad", match: { name_contains: "AbdulBaset", style: "mujawwad" }, sort_order: 20, is_default: false },
  { slug: "minshawi_murattal",    display_name: "Mohamed Siddiq al-Minshawi",    style: "murattal", match: { name_contains: "Minshawi", style: "murattal" }, sort_order: 30, is_default: false },
  { slug: "sudais",               display_name: "Abdur-Rahman As-Sudais",         style: "murattal", match: { name_contains: "Sudais",  style: "murattal" }, sort_order: 40, is_default: false },
  { slug: "husary",               display_name: "Mahmoud Khalil Al-Husary",       style: "murattal", match: { name_contains: "Al-Husary",  style: "murattal" }, sort_order: 50, is_default: false },
];

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
    `${QURAN_COM_API}/resources/recitations`,
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
          : qStyle === "" || qStyle === "murattal";
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

interface QuranComAudioFile {
  verse_key: string;        // e.g. "2:43"
  url: string;              // relative, e.g. "Alafasy/mp3/002043.mp3"
  segments: number[][];     // each element: [segment_idx, word_number_1based, start_ms, end_ms]
}

function absolutizeAudioUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://verses.quran.com/${url.replace(/^\/+/, "")}`;
}

// Quran.com segments are 4-tuples: [segment_index, word_number_1based, start_ms, end_ms].
// Normalize to [word_index_0based, start_ms, end_ms].
function normalizeSegments(raw: number[][]): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const s of raw) {
    if (!Array.isArray(s) || s.length < 4) continue;
    const word0 = Math.max(0, Math.floor(s[1] - 1));
    const start = Math.max(0, Math.floor(s[2]));
    const end = Math.max(start, Math.floor(s[3]));
    out.push([word0, start, end]);
  }
  return out;
}

async function seedOneSurah(slug: string, quranComId: number, surah: number): Promise<number> {
  // `fields=segments` is required — without it, Quran.com omits segment arrays.
  // `per_page=300` covers even Al-Baqarah (286 ayahs) in a single page.
  const url = `${QURAN_COM_API}/recitations/${quranComId}/by_chapter/${surah}?fields=segments&per_page=300`;
  const data = await fetchJson<{ audio_files: QuranComAudioFile[] }>(url);
  if (!data.audio_files || data.audio_files.length === 0) {
    throw new Error(`No audio_files for ${slug} surah ${surah}`);
  }
  const rows = data.audio_files.map((af) => {
    const [sStr, aStr] = af.verse_key.split(":");
    const segments = normalizeSegments(af.segments || []);
    const duration_ms = segments.length > 0 ? segments[segments.length - 1][2] : 0;
    if (duration_ms === 0) {
      console.warn(`    zero duration for ${slug} ${af.verse_key} (no segments?)`);
    }
    return {
      reciter_slug: slug,
      surah: parseInt(sStr, 10),
      ayah: parseInt(aStr, 10),
      audio_url: absolutizeAudioUrl(af.url),
      duration_ms,
      segments,
    };
  });
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
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
