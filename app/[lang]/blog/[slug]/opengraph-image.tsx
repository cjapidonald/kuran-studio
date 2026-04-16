import { ImageResponse } from "next/og";
import { getBlogPost } from "@/lib/blog";
import { LANGUAGES } from "@/lib/i18n/languages";

export const runtime = "nodejs"; // Supabase client not edge-compatible here
export const alt = "Kuran.studio blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { lang: string; slug: string };
}

export default async function Image({ params }: Props) {
  const { lang, slug } = params;
  const post = await getBlogPost(lang, slug);
  const language = LANGUAGES[lang];

  const title = post?.title || "Kuran.studio Blog";
  const description = post?.description || "Insights on the Quran, reading, and Islamic knowledge.";
  const date = post?.date ? new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

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
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#10b981",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#030712",
              fontSize: "28px",
              fontWeight: 900,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: "30px", fontWeight: 700, display: "flex" }}>
            Kuran<span style={{ color: "#34d399" }}>.studio</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: "16px", color: "#6b7280", display: "flex", letterSpacing: "4px" }}>
            BLOG · {language?.name.toUpperCase() || lang.toUpperCase()}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {date && (
            <div style={{ fontSize: "18px", color: "#6b7280", fontFamily: "monospace", display: "flex", marginBottom: "16px" }}>
              {date}
            </div>
          )}

          <div
            style={{
              fontSize: "64px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-1px",
              display: "flex",
              flexWrap: "wrap",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: "24px",
              fontSize: "24px",
              color: "#9ca3af",
              fontWeight: 400,
              display: "flex",
              maxWidth: "1000px",
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            fontSize: "16px",
            color: "#6b7280",
            fontFamily: "monospace",
            display: "flex",
          }}
        >
          kuran.studio/{lang}/blog/{slug}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: "6px",
            background: "#10b981",
          }}
        />
      </div>
    ),
    size
  );
}
