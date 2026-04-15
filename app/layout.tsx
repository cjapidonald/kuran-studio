import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Kurani.studio — Lexo Kuranin ne Shqip",
    template: "%s | Kurani.studio",
  },
  description: "Platforma e pare dixhitale per te lexuar dhe studiuar Kuranin Fisnik ne gjuhen shqipe. Perkthimi shqip nga Hasan Efendi Nahi.",
  keywords: [
    "kuran", "quran", "kurani", "shqip", "albanian", "lexo kuranin",
    "kurani ne shqip", "perkthim kurani", "hasan nahi", "quran albanian",
    "sure", "ajet", "ayah", "surah",
  ],
  authors: [{ name: "Donald Cjapi" }],
  creator: "Donald Cjapi",
  metadataBase: new URL("https://kurani.studio"),
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: "https://kurani.studio",
    siteName: "Kurani.studio",
    title: "Kurani.studio — Lexo Kuranin ne Shqip",
    description: "Lexo dhe studio Kuranin Fisnik ne gjuhen shqipe. Perkthimi nga Hasan Efendi Nahi.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sq" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>{children}</body>
    </html>
  );
}
