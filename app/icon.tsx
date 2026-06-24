import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a12",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#7af8ff",
            boxShadow: "0 0 18px 4px rgba(122,248,255,0.9)",
            position: "relative",
            display: "flex",
          }}
        >
          <div
            style={{
              width: 26,
              height: 34,
              borderRadius: "50%",
              background: "#0a0a12",
              position: "absolute",
              left: 12,
              top: 0,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
