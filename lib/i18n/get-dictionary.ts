import { createClient } from "@supabase/supabase-js";

export interface Dictionary {
  [key: string]: string;
}

const cache = new Map<string, Dictionary>();

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

async function fetchFromSupabase(lang: string): Promise<Dictionary | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ui_translations")
      .select("key, value")
      .eq("lang", lang)
      .limit(1000);

    if (error || !data || data.length === 0) return null;
    return Object.fromEntries(data.map((r) => [r.key, r.value]));
  } catch {
    return null;
  }
}

export async function getDictionary(lang: string): Promise<Dictionary> {
  if (cache.has(lang)) return cache.get(lang)!;

  const dict = await fetchFromSupabase(lang);
  if (dict) {
    cache.set(lang, dict);
    return dict;
  }

  // Fallback to English if language not found
  if (lang !== "en") {
    return getDictionary("en");
  }

  // Last resort: empty dictionary (keys will render as keys)
  return {};
}
