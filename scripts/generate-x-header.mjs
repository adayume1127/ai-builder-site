// X(Twitter)ヘッダー画像(1500x500)をローカルで生成するワンオフスクリプト
import { ImageResponse } from "@vercel/og";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const avatar = await readFile(
  join(process.cwd(), "public", "luna-avatar.png"),
);
const avatarBase64 = `data:image/png;base64,${avatar.toString("base64")}`;

const image = new ImageResponse(
  {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 64,
        background: "#0a0a12",
        color: "#7af8ff",
      },
      children: [
        {
          type: "img",
          props: {
            src: avatarBase64,
            width: 320,
            height: 320,
            style: {
              borderRadius: "50%",
              boxShadow: "0 0 40px 10px rgba(122,248,255,0.6)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              textShadow: "0 0 30px rgba(122,248,255,0.8)",
            },
            children: [
              {
                type: "span",
                props: { style: { fontSize: 64, fontWeight: 700 }, children: "LUNA AI" },
              },
              {
                type: "span",
                props: {
                  style: { fontSize: 30, marginTop: 16, color: "#ff6bd6" },
                  children: "あなたのビジネスをカタチにします。",
                },
              },
            ],
          },
        },
      ],
    },
  },
  { width: 1500, height: 500 },
);

const buffer = Buffer.from(await image.arrayBuffer());
await writeFile(join(process.cwd(), "public", "x-header.png"), buffer);
console.log("Wrote public/x-header.png");
