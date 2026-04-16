import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/lib/i18n/languages";
import { getAllBlogPostPaths } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://kuran.studio";
  const entries: MetadataRoute.Sitemap = [];

  // Landing pages per language
  for (const lang of SUPPORTED_LOCALES) {
    entries.push({
      url: `${baseUrl}/${lang}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    });
  }

  // Blog index per language
  for (const lang of SUPPORTED_LOCALES) {
    entries.push({
      url: `${baseUrl}/${lang}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Surah pages: all languages × 114 surahs
  for (const lang of SUPPORTED_LOCALES) {
    for (let i = 1; i <= 114; i++) {
      entries.push({
        url: `${baseUrl}/${lang}/${i}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  // Blog posts from Supabase
  const blogPaths = await getAllBlogPostPaths();
  for (const { lang, slug } of blogPaths) {
    entries.push({
      url: `${baseUrl}/${lang}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    });
  }

  return entries;
}
