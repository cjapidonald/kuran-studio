import { ImageResponse } from "next/og";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LANGUAGES } from "@/lib/i18n/languages";

export const runtime = "edge";
export const alt = "Kuran.studio - Read the Quran Online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { lang: string };
}

export default async function Image({ params }: Props) {
  const { lang } = params;
  const dict = await getDictionary(lang);
  const language = LANGUAGES[lang];
  const tagline = dict["site.tagline"] || "Read the Quran Online";
  const description = dict["site.description"] || "The first digital platform to read the Noble Quran in 80+ languages.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #030712 0%, #064e3b 50%, #030712 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          fontFamily: "sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "#10b981",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#030712",
              fontSize: "32px",
              fontWeight: 900,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: "36px", fontWeight: 700, display: "flex" }}>
            Kuran<span style={{ color: "#34d399" }}>.studio</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              fontSize: "22px",
              color: "#34d399",
              fontWeight: 700,
              letterSpacing: "4px",
              display: "flex",
              marginBottom: "20px",
            }}
          >
            {language?.name.toUpperCase() || lang.toUpperCase()}
          </div>

          <div
            style={{
              fontSize: "86px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-2px",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              marginTop: "28px",
              fontSize: "28px",
              color: "#9ca3af",
              fontWeight: 400,
              display: "flex",
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: "20px",
            color: "#9ca3af",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "50%" }} />
            <div style={{ display: "flex" }}>114 Surahs</div>
          </div>
          <div style={{ color: "#4b5563" }}>•</div>
          <div style={{ display: "flex" }}>80+ Languages</div>
          <div style={{ color: "#4b5563" }}>•</div>
          <div style={{ display: "flex" }}>Free Forever</div>
        </div>
      </div>
    ),
    size
  );
}
