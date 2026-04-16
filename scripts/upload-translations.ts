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

async function uploadLanguage(lang: string, dict: Record<string, string>) {
  const rows = Object.entries(dict).map(([key, value]) => ({ lang, key, value }));
  console.log(`${lang}: uploading ${rows.length} strings...`);

  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("ui_translations")
      .upsert(batch, { onConflict: "lang,key" });
    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
      return false;
    }
  }
  console.log(`  ✓ ${lang} complete`);
  return true;
}

async function main() {
  const stagingDir = path.join(process.cwd(), "lib/i18n/translations-staging");
  if (!fs.existsSync(stagingDir)) {
    console.error(`Staging dir not found: ${stagingDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(stagingDir).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} language files\n`);

  for (const file of files) {
    const lang = file.replace(".json", "");
    const content = JSON.parse(fs.readFileSync(path.join(stagingDir, file), "utf-8")) as Record<string, string>;
    await uploadLanguage(lang, content);
  }

  // Verify
  const { count } = await supabase
    .from("ui_translations")
    .select("*", { count: "exact", head: true });
  console.log(`\nTotal rows in ui_translations: ${count}`);
}

main().catch(console.error);
