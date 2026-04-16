import { notFound } from "next/navigation";
import { isValidLocale, LANGUAGES, SUPPORTED_LOCALES } from "@/lib/i18n/languages";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const language = LANGUAGES[lang];
  if (!language) return {};

  const dict = await getDictionary(lang);

  return {
    title: {
      default: `${dict["site.name"]} — ${dict["site.tagline"]}`,
      template: `%s | ${dict["site.name"]}`,
    },
    description: dict["site.description"],
    keywords: ["quran", "kuran", language.nameEn.toLowerCase(), language.name.toLowerCase(), "surah", "ayah"],
    alternates: {
      canonical: `https://kuran.studio/${lang}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((l) => [l, `https://kuran.studio/${l}`])
      ),
    },
    openGraph: {
      type: "website",
      locale: lang,
      alternateLocale: SUPPORTED_LOCALES.filter((l) => l !== lang),
      url: `https://kuran.studio/${lang}`,
      siteName: dict["site.name"],
      title: `${dict["site.name"]} — ${dict["site.tagline"]}`,
      description: dict["site.description.meta"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dict["site.name"]} — ${dict["site.tagline"]}`,
      description: dict["site.description.meta"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LangLayout({ children, params }: LayoutProps) {
  const { lang } = await params;

  if (!isValidLocale(lang)) {
    notFound();
  }

  return <>{children}</>;
}
