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
