import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getSurahDescription(lang: string, surah: number): Promise<string | null> {
  try {
    const supabase = getSupabase();
    // Try the requested language first
    const { data } = await supabase
      .from("surah_descriptions")
      .select("description")
      .eq("lang", lang)
      .eq("surah", surah)
      .maybeSingle();

    if (data?.description) return data.description;

    // Fallback to English
    if (lang !== "en") {
      const { data: enData } = await supabase
        .from("surah_descriptions")
        .select("description")
        .eq("lang", "en")
        .eq("surah", surah)
        .maybeSingle();
      return enData?.description || null;
    }

    return null;
  } catch {
    return null;
  }
}

export interface RelatedSurah {
  surah: number;
  sharedThemes: number;
}

// Popular surahs for fallback when no theme matches
const POPULAR_SURAHS = [1, 36, 55, 67, 112, 113, 114, 2, 18, 97];

export async function getRelatedSurahs(surah: number, limit = 4): Promise<number[]> {
  try {
    const supabase = getSupabase();

    // Get current surah's themes
    const { data: current } = await supabase
      .from("surah_descriptions")
      .select("themes")
      .eq("lang", "en")
      .eq("surah", surah)
      .maybeSingle();

    const themes = (current?.themes as string[] | undefined) || [];

    if (themes.length === 0) {
      // Fallback: return popular surahs excluding current
      return POPULAR_SURAHS.filter((n) => n !== surah).slice(0, limit);
    }

    // Find other surahs sharing any of these themes
    const { data: related } = await supabase
      .from("surah_descriptions")
      .select("surah, themes")
      .eq("lang", "en")
      .neq("surah", surah)
      .overlaps("themes", themes);

    if (!related || related.length === 0) {
      return POPULAR_SURAHS.filter((n) => n !== surah).slice(0, limit);
    }

    // Score by number of shared themes
    const scored: RelatedSurah[] = related.map((r) => {
      const rThemes = (r.themes as string[] | undefined) || [];
      const shared = rThemes.filter((t) => themes.includes(t)).length;
      return { surah: r.surah, sharedThemes: shared };
    });

    scored.sort((a, b) => b.sharedThemes - a.sharedThemes || a.surah - b.surah);

    // Mix top matches with a couple of popular ones for variety
    const topMatches = scored.slice(0, Math.max(limit - 1, 1)).map((r) => r.surah);
    const fill = POPULAR_SURAHS.filter((n) => n !== surah && !topMatches.includes(n));
    const combined = [...topMatches, ...fill];
    return combined.slice(0, limit);
  } catch {
    return POPULAR_SURAHS.filter((n) => n !== surah).slice(0, limit);
  }
}
