import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#030712",
          fontSize: 120,
          fontWeight: 900,
          fontFamily: "sans-serif",
        }}
      >
        Q
      </div>
    ),
    size
  );
}
