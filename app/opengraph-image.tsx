import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "LUNA AI | あなたのビジネスをカタチにします。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const avatar = await readFile(
    join(process.cwd(), "public", "luna-avatar.png"),
  );
  const avatarBase64 = `data:image/png;base64,${avatar.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          background: "#0a0a12",
          color: "#7af8ff",
        }}
      >
        <img
          src={avatarBase64}
          alt=""
          width={320}
          height={320}
          style={{
            borderRadius: "50%",
            boxShadow: "0 0 40px 10px rgba(122,248,255,0.6)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textShadow: "0 0 30px rgba(122,248,255,0.8)",
          }}
        >
          <span style={{ fontSize: 56, fontWeight: 700 }}>LUNA AI</span>
          <span style={{ fontSize: 32, marginTop: 16, color: "#ff6bd6" }}>
            あなたのビジネスをカタチにします。
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
