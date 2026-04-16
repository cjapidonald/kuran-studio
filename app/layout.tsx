import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kuran.studio — Read the Quran Online",
  description: "Read and study the Noble Quran online with translations in 80+ languages. Free, clean, and ad-free.",
  metadataBase: new URL("https://kuran.studio"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>{children}</body>
    </html>
  );
}
