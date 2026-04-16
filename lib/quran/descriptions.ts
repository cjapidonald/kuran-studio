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
