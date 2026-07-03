"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { SocialLinks } from "@/components/SocialLinks";
import { useEffect, useState } from "react";

const STAR_COUNT = 28;

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
};

export function LunaHero() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.8 + 0.8,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2.5,
        color: Math.random() > 0.6 ? "#a5f3fc" : "#e2e8f0",
      }))
    );
  }, []);

  return (
    <main className="flex-1 max-w-5xl mx-auto px-6 py-14 md:py-20 w-full">
      <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-8">

        {/* ===== Left: Text ===== */}
        <div className="flex-1 text-center md:text-left space-y-7">
          <Badge
            variant="secondary"
            className="gold-border font-cinzel uppercase tracking-widest text-xs"
            style={{ color: "#FFD700", background: "rgba(234,179,8,0.08)" }}
          >
            ✦ LUNA AI ✦
          </Badge>

          <h1 className="font-cinzel text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight shimmer-gold">
            AIが、<br />カタチにする。
          </h1>

          <p className="font-zen text-base md:text-lg text-muted-foreground leading-loose max-w-sm mx-auto md:mx-0">
            アイデアを伝えるだけで、<br className="hidden md:block" />
            企画・開発・リリースまで一気に仕上げる。
          </p>

          <SocialLinks variant="hero" />
        </div>

        {/* ===== Right: Luna character ===== */}
        <div className="relative flex-shrink-0" style={{ width: 300, height: 520 }}>

          {/* Purple / blue glow aura */}
          <div
            className="absolute luna-glow-pulse pointer-events-none"
            style={{
              inset: "-36px",
              background:
                "radial-gradient(ellipse 68% 72% at 50% 58%, rgba(124,58,237,0.5) 0%, rgba(59,130,246,0.28) 44%, transparent 76%)",
              filter: "blur(28px)",
            }}
          />

          {/* Pink accent glow top-right */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-16px",
              background:
                "radial-gradient(ellipse 48% 38% at 65% 18%, rgba(232,121,249,0.22) 0%, transparent 72%)",
              filter: "blur(18px)",
            }}
          />

          {/* Twinkling star particles */}
          <div className="absolute pointer-events-none" style={{ inset: "-20px" }}>
            {stars.map((s) => (
              <div
                key={s.id}
                className="absolute rounded-full"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: s.size,
                  height: s.size,
                  background: s.color,
                  boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
                  animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Character image with edge mask + float animation */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl luna-float"
            style={{
              maskImage:
                "radial-gradient(ellipse 86% 90% at 50% 42%, black 52%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 86% 90% at 50% 42%, black 52%, transparent 100%)",
            }}
          >
            <Image
              src="/luna-character.png"
              alt="ルナ"
              fill
              priority
              style={{ objectFit: "cover", objectPosition: "18% top" }}
            />
            {/* Bottom gradient fade into page background */}
            <div
              className="absolute bottom-0 left-0 right-0 h-52 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, oklch(0.12 0.02 280) 0%, oklch(0.12 0.02 280 / 55%) 40%, transparent 100%)",
              }}
            />
          </div>

          {/* Decorative sparkle symbols */}
          <span className="absolute select-none pointer-events-none luna-sparkle-1"
            style={{ top: -12, right: 16, fontSize: 22, color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.95), 0 0 28px rgba(255,215,0,0.5)" }}>
            ✦
          </span>
          <span className="absolute select-none pointer-events-none luna-sparkle-2"
            style={{ top: "24%", right: -24, fontSize: 17, color: "#a5f3fc", textShadow: "0 0 10px rgba(165,243,252,0.95), 0 0 24px rgba(165,243,252,0.5)" }}>
            ✧
          </span>
          <span className="absolute select-none pointer-events-none luna-sparkle-3"
            style={{ top: -20, left: "36%", fontSize: 14, color: "#e879f9", textShadow: "0 0 10px rgba(232,121,249,0.95), 0 0 22px rgba(232,121,249,0.5)" }}>
            ⋆
          </span>
          <span className="absolute select-none pointer-events-none luna-sparkle-2"
            style={{ bottom: 72, left: -22, fontSize: 19, color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.95), 0 0 26px rgba(255,215,0,0.5)" }}>
            ✦
          </span>
          <span className="absolute select-none pointer-events-none luna-sparkle-1"
            style={{ top: "55%", right: -18, fontSize: 12, color: "#e879f9", textShadow: "0 0 8px rgba(232,121,249,0.95), 0 0 18px rgba(232,121,249,0.5)" }}>
            ✦
          </span>
        </div>
      </div>
    </main>
  );
}
