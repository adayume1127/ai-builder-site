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
          background: "linear-gradient(135deg, #0f172a, #312e81)",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>AIが、あなたのビジネスを</span>
          <span>カタチにします。</span>
        </div>
        <div style={{ fontSize: 28, marginTop: 24, opacity: 0.8 }}>
          AI Builder Portfolio
        </div>
      </div>
    ),
    { ...size },
  );
}
