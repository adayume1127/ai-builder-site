import { ImageResponse } from "next/og";

export const alt = "AIが、あなたのビジネスをカタチにします。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a12",
          color: "#7af8ff",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            textShadow: "0 0 30px rgba(122,248,255,0.8)",
          }}
        >
          <span>AIが、あなたのビジネスを</span>
          <span>カタチにします。</span>
        </div>
        <div style={{ fontSize: 28, marginTop: 24, color: "#ff6bd6" }}>
          AI Builder Portfolio
        </div>
      </div>
    ),
    { ...size },
  );
}
