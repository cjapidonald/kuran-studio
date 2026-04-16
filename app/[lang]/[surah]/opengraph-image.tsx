import { ImageResponse } from "next/og";
import { SURAHS } from "@/lib/quran/surahs";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LANGUAGES } from "@/lib/i18n/languages";

export const runtime = "edge";
export const alt = "Kuran.studio - Read the Quran";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { lang: string; surah: string };
}

export default async function Image({ params }: Props) {
  const { lang, surah } = params;
  const surahNum = parseInt(surah, 10);
  const meta = SURAHS.find((s) => s.number === surahNum);

  if (!meta) {
    return new ImageResponse(<div>Not found</div>, size);
  }

  const dict = await getDictionary(lang);
  const language = LANGUAGES[lang];
  const localName = dict[`surah.${meta.number}`] || meta.transliteration;
  const revelationLabel =
    meta.revelationType === "meccan" ? dict["reader.meccan"] || "Meccan" : dict["reader.medinan"] || "Medinan";
  const ayahsLabel = dict["reader.ayahs"] || "ayahs";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #030712 0%, #064e3b 50%, #030712 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        {/* Logo/brand top */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              background: "#10b981",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#030712",
              fontSize: "26px",
              fontWeight: 900,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, display: "flex" }}>
            Kuran<span style={{ color: "#34d399" }}>.studio</span>
          </div>
        </div>

        {/* Surah number */}
        <div
          style={{
            marginTop: "60px",
            fontSize: "22px",
            color: "#34d399",
            fontWeight: 700,
            letterSpacing: "6px",
            display: "flex",
          }}
        >
          SURAH {String(meta.number).padStart(3, "0")}
        </div>

        {/* Main title: transliteration */}
        <div
          style={{
            marginTop: "16px",
            fontSize: "96px",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            display: "flex",
          }}
        >
          {meta.transliteration}
        </div>

        {/* Translated name */}
        <div
          style={{
            marginTop: "8px",
            fontSize: "44px",
            color: "#9ca3af",
            fontWeight: 400,
            display: "flex",
          }}
        >
          {localName}
        </div>

        {/* Divider */}
        <div
          style={{
            marginTop: "40px",
            width: "120px",
            height: "4px",
            background: "#10b981",
            borderRadius: "2px",
          }}
        />

        {/* Meta: ayah count, revelation */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "26px",
            color: "#d1d5db",
            display: "flex",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex" }}>{meta.ayahCount} {ayahsLabel}</div>
          <div style={{ color: "#4b5563" }}>•</div>
          <div style={{ display: "flex" }}>{revelationLabel}</div>
          <div style={{ color: "#4b5563" }}>•</div>
          <div style={{ display: "flex" }}>{language?.name || lang.toUpperCase()}</div>
        </div>

        {/* Bottom ribbon */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            fontSize: "18px",
            color: "#6b7280",
            fontFamily: "monospace",
            display: "flex",
          }}
        >
          kuran.studio/{lang}/{meta.number}
        </div>
      </div>
    ),
    size
  );
}
