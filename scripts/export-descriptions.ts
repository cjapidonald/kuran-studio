import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const outDir = path.join(process.cwd(), "lib/quran/descriptions-translated");
  fs.mkdirSync(outDir, { recursive: true });

  // Get all unique languages by paginating
  const allLangs = new Set<string>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from("surah_descriptions")
      .select("lang")
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    data.forEach((r: { lang: string }) => allLangs.add(r.lang));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  const langs = Array.from(allLangs).sort();
  console.log(`Exporting ${langs.length} languages: ${langs.join(", ")}`);

  for (const lang of langs) {
    const { data } = await supabase
      .from("surah_descriptions")
      .select("surah, description")
      .eq("lang", lang)
      .order("surah");

    if (!data) continue;

    const dict: Record<string, string> = {};
    data.forEach((r: { surah: number; description: string }) => {
      dict[String(r.surah)] = r.description;
    });

    fs.writeFileSync(
      path.join(outDir, `${lang}.json`),
      JSON.stringify(dict, null, 2) + "\n"
    );
    console.log(`  ✓ ${lang}.json (${Object.keys(dict).length} entries)`);
  }
}

main().catch(console.error);
