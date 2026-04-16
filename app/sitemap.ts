import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/lib/i18n/languages";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return entries;
}
