import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const stagingDir = path.join(process.cwd(), "lib/quran/descriptions-staging");
  if (!fs.existsSync(stagingDir)) {
    console.error(`Staging dir not found: ${stagingDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(stagingDir).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} language files\n`);

  for (const file of files) {
    const lang = file.replace(".json", "");
    const content = JSON.parse(fs.readFileSync(path.join(stagingDir, file), "utf-8")) as Record<string, string>;

    const rows = Object.entries(content).map(([surah, description]) => ({
      lang,
      surah: parseInt(surah, 10),
      description,
    }));

    console.log(`${lang}: uploading ${rows.length} descriptions...`);

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase
        .from("surah_descriptions")
        .upsert(batch, { onConflict: "lang,surah" });
      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        break;
      }
    }
    console.log(`  ✓ ${lang} complete`);
  }

  const { data: counts } = await supabase
    .from("surah_descriptions")
    .select("lang", { count: "exact" });

  const byLang: Record<string, number> = {};
  (counts || []).forEach((r: { lang: string }) => {
    byLang[r.lang] = (byLang[r.lang] || 0) + 1;
  });

  console.log("\n=== Summary ===");
  Object.entries(byLang)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([lang, count]) => console.log(`  ${lang}: ${count} descriptions`));
}

main().catch(console.error);
