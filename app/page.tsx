import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/languages";

function detectLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of preferred) {
    if (SUPPORTED_LOCALES.includes(lang)) return lang;
  }

  return DEFAULT_LOCALE;
}

export default async function RootPage() {
  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language");
  const locale = detectLocale(acceptLanguage);
  redirect(`/${locale}`);
}
