import { ImageResponse } from "next/og";

export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0D1117",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#F59E0B",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          ✓
        </div>
      </div>
    ),
    { ...size },
  );
}
