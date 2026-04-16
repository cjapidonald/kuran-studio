import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedUiTranslations() {
  console.log("=== Seeding UI translations ===");
  const dictDir = path.join(process.cwd(), "lib/i18n/dictionaries");

  for (const lang of ["en", "sq"]) {
    const filePath = path.join(dictDir, `${lang}.json`);
    const dict = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, string>;

    const rows = Object.entries(dict).map(([key, value]) => ({
      lang,
      key,
      value,
    }));

    console.log(`Seeding ${rows.length} strings for ${lang}...`);

    // Batch upsert in chunks of 500
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase
        .from("ui_translations")
        .upsert(batch, { onConflict: "lang,key" });
      if (error) {
        console.error(`Error upserting ${lang}: ${error.message}`);
        break;
      }
    }
  }
}

async function seedBlogPosts() {
  console.log("\n=== Seeding blog posts ===");
  const contentDir = path.join(process.cwd(), "content/blog");

  for (const lang of ["en", "sq"]) {
    const dir = path.join(contentDir, lang);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      const slug = file.replace(".mdx", "");

      const post = {
        slug,
        lang,
        source_slug: slug, // English is the source
        title: data.title,
        description: data.description,
        content,
        date: data.date,
        author: data.author || "Donald Cjapi",
        tags: data.tags || [],
        published: true,
      };

      const { error } = await supabase.from("blog_posts").upsert(post, {
        onConflict: "slug,lang",
      });

      if (error) {
        console.error(`Error upserting ${lang}/${slug}: ${error.message}`);
      } else {
        console.log(`  ✓ ${lang}/${slug}`);
      }
    }
  }
}

async function verify() {
  console.log("\n=== Verification ===");
  const { count: uiCount } = await supabase
    .from("ui_translations")
    .select("*", { count: "exact", head: true });
  const { count: blogCount } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true });

  console.log(`UI translations total rows: ${uiCount}`);
  console.log(`Blog posts total rows: ${blogCount}`);
}

async function main() {
  await seedUiTranslations();
  await seedBlogPosts();
  await verify();
}

main().catch(console.error);
