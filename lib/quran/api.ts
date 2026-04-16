import { createClient } from "@supabase/supabase-js";

const QURANENC_URL = "https://quranenc.com/api/v1/translation";

export interface Ayah {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes: string;
}

interface SupabaseAyah {
  surah: number;
  ayah: number;
  arabic_text: string;
  translation_text: string;
  footnotes: string | null;
}

// Simple anonymous client for read-only public data
// (not using the cookie-based client because this is called during build/ISR)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

async function fetchFromSupabase(translationKey: string, surahNumber: number): Promise<Ayah[] | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ayahs")
      .select("surah, ayah, arabic_text, translation_text, footnotes")
      .eq("translation_key", translationKey)
      .eq("surah", surahNumber)
      .order("ayah");

    if (error || !data || data.length === 0) return null;

    return (data as SupabaseAyah[]).map((row) => ({
      id: `${translationKey}:${row.surah}:${row.ayah}`,
      sura: String(row.surah),
      aya: String(row.ayah),
      arabic_text: row.arabic_text,
      translation: row.translation_text,
      footnotes: row.footnotes || "",
    }));
  } catch {
    return null;
  }
}

async function fetchFromQuranEnc(translationKey: string, surahNumber: number): Promise<Ayah[]> {
  const res = await fetch(
    `${QURANENC_URL}/sura/${translationKey}/${surahNumber}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber} for ${translationKey}`);
  const data = await res.json();
  return data.result;
}

export async function fetchSurah(translationKey: string, surahNumber: number): Promise<Ayah[]> {
  // Try Supabase first (our own database)
  const fromDb = await fetchFromSupabase(translationKey, surahNumber);
  if (fromDb && fromDb.length > 0) {
    return fromDb;
  }

  // Fallback to QuranEnc API if not in DB yet
  return fetchFromQuranEnc(translationKey, surahNumber);
}

export async function listTranslations(languageCode: string): Promise<{ key: string; translator: string; is_primary: boolean }[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("translations")
      .select("key, translator, is_primary")
      .eq("language_code", languageCode)
      .order("is_primary", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}
