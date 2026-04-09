import { ImageResponse } from "next/og";

export const size        = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0D1117",
          borderRadius: 38,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {/* Yellow checkmark */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: "#F59E0B",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          ✓
        </div>
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 18,
            fontWeight: 700,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          WebsiteFix
        </div>
      </div>
    ),
    { ...size },
  );
}
