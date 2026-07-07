"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TAROT_FAN = [
  { src: "/tarot/00_the_fool.png",    rotate: -22, x: -80, z: 1 },
  { src: "/tarot/06_the_lovers.png",  rotate: -11, x: -40, z: 2 },
  { src: "/tarot/11_justice.png",     rotate: 0,   x: 0,   z: 3 },
  { src: "/tarot/17_the_star.png",    rotate: 11,  x: 40,  z: 2 },
  { src: "/tarot/21_the_world.png",   rotate: 22,  x: 80,  z: 1 },
];

/* ───── 月夜タロット放置ゲーム カードファン ───── */
const GAME_FAN = [
  { src: null,                         rotate: -28, x: -108, z: 1, w: 54,  h: 90  }, // 謎カード
  { src: "/tarot/17_the_star.png",     rotate: -14, x: -54,  z: 3, w: 65,  h: 108 }, // 星
  { src: "/tarot/00_the_fool.png",     rotate:   0, x:   0,  z: 5, w: 80,  h: 132, sr: true }, // 愚者 SR
  { src: "/tarot/21_the_world.png",    rotate:  14, x:  54,  z: 3, w: 65,  h: 108 }, // 世界
  { src: null,                         rotate:  28, x: 108,  z: 1, w: 54,  h: 90  }, // 謎カード
] as const;

function MysteryCardBack({ w, h }: { w: number; h: number }) {
  return (
    <div
      className="w-full h-full rounded-xl flex flex-col items-center justify-center gap-1"
      style={{
        background: "linear-gradient(165deg, #0c001f 0%, #05001a 60%, #0a0030 100%)",
        border: "1px solid rgba(165,243,252,0.25)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.85)",
      }}
    >
      <span style={{ fontSize: Math.round(h * 0.28), color: "rgba(165,243,252,0.22)", lineHeight: 1 }}>☽</span>
      <span
        style={{
          fontSize: Math.round(h * 0.18),
          color: "rgba(234,179,8,0.30)",
          fontFamily: "monospace",
          fontWeight: "bold",
          lineHeight: 1,
          textShadow: "0 0 6px rgba(234,179,8,0.2)",
        }}
      >
        ?
      </span>
    </div>
  );
}

function GameCardFan() {
  return (
    <div className="relative flex justify-center items-end pointer-events-none select-none" style={{ height: 172, marginBottom: 8 }}>
      {GAME_FAN.map((c, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{
            width: c.w,
            height: c.h,
            transform: `rotate(${c.rotate}deg) translateX(${c.x}px)`,
            zIndex: c.z,
            transformOrigin: "bottom center",
          }}
        >
          {c.src ? (
            <div className="relative w-full h-full">
              {/* Center card glow */}
              {"sr" in c && c.sr && (
                <div
                  className="absolute rounded-xl"
                  style={{
                    inset: "-10px",
                    background: "radial-gradient(ellipse 70% 70% at 50% 55%, rgba(124,58,237,0.6) 0%, rgba(59,130,246,0.35) 45%, transparent 75%)",
                    filter: "blur(14px)",
                    animation: "luna-glow-pulse 3.5s ease-in-out infinite",
                  }}
                />
              )}
              <div
                className="relative w-full h-full rounded-xl overflow-hidden"
                style={{
                  border: "sr" in c && c.sr
                    ? "1.5px solid rgba(234,179,8,0.95)"
                    : "1px solid rgba(234,179,8,0.6)",
                  boxShadow: "sr" in c && c.sr
                    ? "0 8px 32px rgba(0,0,0,0.9), 0 0 22px rgba(168,85,247,0.55), 0 0 44px rgba(234,179,8,0.25)"
                    : "0 5px 16px rgba(0,0,0,0.8), 0 0 10px rgba(168,85,247,0.2)",
                  animation: "sr" in c && c.sr ? "luna-float 6s ease-in-out infinite" : undefined,
                }}
              >
                <Image src={c.src} alt="" fill sizes={`${c.w}px`} style={{ objectFit: "cover" }} />
              </div>
              {/* SECRET RARE バッジ */}
              {"sr" in c && c.sr && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 font-mono font-bold whitespace-nowrap"
                  style={{
                    top: -14,
                    fontSize: 9,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #581c87, #1e3a8a)",
                    border: "1px solid rgba(234,179,8,0.85)",
                    color: "#FFD700",
                    letterSpacing: "0.1em",
                    boxShadow: "0 0 12px rgba(124,58,237,0.8), 0 0 24px rgba(234,179,8,0.35)",
                    animation: "luna-glow-pulse 2s ease-in-out infinite",
                  }}
                >
                  ✦ SECRET RARE
                </div>
              )}
            </div>
          ) : (
            <MysteryCardBack w={c.w} h={c.h} />
          )}
        </div>
      ))}
      {/* Sparkles around center */}
      <span className="absolute luna-sparkle-1" style={{ bottom: 140, left: "50%", marginLeft: -50, fontSize: 13, color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.9)" }}>✦</span>
      <span className="absolute luna-sparkle-3" style={{ bottom: 120, left: "50%", marginLeft: 40, fontSize: 10, color: "#a5f3fc", textShadow: "0 0 8px rgba(165,243,252,0.9)" }}>✧</span>
      <span className="absolute luna-sparkle-2" style={{ bottom: 130, left: "50%", marginLeft: -48, fontSize: 9, color: "#e879f9", textShadow: "0 0 8px rgba(232,121,249,0.9)" }}>⋆</span>
    </div>
  );
}

function TarotFan() {
  return (
    <div className="relative flex justify-center items-end h-28 mb-2 pointer-events-none select-none">
      {TAROT_FAN.map((c, i) => (
        <div
          key={i}
          className="absolute bottom-0"
          style={{
            width: 72,
            height: 118,
            transform: `rotate(${c.rotate}deg) translateX(${c.x}px)`,
            zIndex: c.z,
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="w-full h-full rounded-xl overflow-hidden"
            style={{
              border: "1px solid rgba(234,179,8,0.7)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.7), 0 0 12px rgba(168,85,247,0.3)",
            }}
          >
            <Image src={c.src} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

type AppItem = {
  title: string;
  description: string;
  href: string;
  free: boolean;
  priceLabel: string;
  accent: "cyan" | "pink";
  visual?: React.ReactNode;
};

const APPS: AppItem[] = [
  {
    title: "ルナタロット AI",
    description:
      "大アルカナ22枚のタロットカードをAIが深層解読。1枚引き・スリーカードスプレッド・テーマ別深層鑑定に対応。無料プランで1日1回、プレミアムで無制限に占えます。",
    href: "/projects/tarot-ai",
    free: false,
    priceLabel: "¥500/月",
    accent: "pink",
    visual: <TarotFan />,
  },
  {
    title: "ブログオート",
    description:
      "キーワードを入れるだけで、SEO記事が自動で完成するブログ記事自動化SaaS。生成からWordPress投稿まで、一気通貫で行えます。",
    href: "/projects/blog-auto",
    free: false,
    priceLabel: "サブスク",
    accent: "cyan",
  },
  {
    title: "マッチング写真生成AI",
    description:
      "マッチングアプリ用のプロフィール写真をAIが魅力的に仕上げるサービス。顔を学習させて30枚を自動生成、気に入った10枚をダウンロードできます。",
    href: "/projects/match-photo-ai",
    free: false,
    priceLabel: "都度課金",
    accent: "pink",
  },
  {
    title: "請求書・見積書AI作成",
    description: "箇条書きを入力するだけでAIが請求書・見積書PDFを作成。登録不要、その場で¥500の都度課金です。",
    href: "/projects/invoice-ai-tool",
    free: false,
    priceLabel: "¥500都度課金",
    accent: "cyan",
  },
  {
    title: "LINEトーク風ストーリーAI",
    description:
      "文章や箇条書きを入れるだけで、AIがLINEのトーク画面風アニメーションに変換するツール。読み上げ・キャラ編集・動画保存にも対応しています。",
    href: "/projects/line-story-ai",
    free: false,
    priceLabel: "サブスク",
    accent: "pink",
  },
  {
    title: "写真フォルダAI仕分け",
    description: "写真をまとめてアップロードするだけで、AIがブレ・重複・スクショを自動診断。登録不要、その場で¥480の都度課金です。",
    href: "/projects/photo-sort-ai",
    free: false,
    priceLabel: "¥480都度課金",
    accent: "cyan",
  },
  {
    title: "サブスク見直しAI診断",
    description: "カードの利用明細を貼るだけで、AIが契約中のサブスクと重複・休眠サブスクを発見。登録不要、その場で¥500の都度課金です。",
    href: "/projects/sub-reset-ai",
    free: false,
    priceLabel: "¥500都度課金",
    accent: "pink",
  },
  {
    title: "月夜タロット 放置ゲーム",
    description:
      "22枚のタロットカードを集めていく、ルナ主役のガチャ放置ゲーム。SECRET RAREカードはまだ誰も見ていないかもしれない——登録不要・完全無料。",
    href: "/projects/tsukiyo-tarot",
    free: true,
    priceLabel: "無料",
    accent: "pink",
    visual: <GameCardFan />,
  },
  {
    title: "積立シミュレーター",
    description:
      "目標額・積立額・コーストFIREなど、3つの方法で複利の積立計算ができるツール。会員登録不要、何度でも無料で使えます。",
    href: "/tools/investment-calculator",
    free: true,
    priceLabel: "無料",
    accent: "cyan",
  },
];

type Filter = "free" | "paid";

export function AppShowcase() {
  const [filter, setFilter] = useState<Filter>("free");
  const apps = APPS.filter((a) => (filter === "free" ? a.free : !a.free));

  return (
    <section className="max-w-2xl mx-auto px-6 py-12 w-full space-y-4">
      <h2 className="neon-text-pink text-xl font-bold font-mono"># 作ったもの</h2>

      <div className="flex gap-2 font-mono text-sm">
        <button
          type="button"
          onClick={() => setFilter("free")}
          className={`rounded-full px-4 py-2 ${
            filter === "free" ? "neon-border neon-text" : "border border-white/15 text-muted-foreground"
          }`}
        >
          無料アプリ
        </button>
        <button
          type="button"
          onClick={() => setFilter("paid")}
          className={`rounded-full px-4 py-2 ${
            filter === "paid"
              ? "neon-border-pink neon-text-pink"
              : "border border-white/15 text-muted-foreground"
          }`}
        >
          有料アプリ
        </button>
      </div>

      {filter === "free" && (
        <p className="text-sm text-muted-foreground">
          会員登録不要、何度使っても<span className="neon-text font-semibold">完全無料</span>のツールです。
        </p>
      )}

      <div className="space-y-4">
        {apps.map((app) => (
          <Card
            key={app.href}
            className={`backdrop-blur transition-shadow ${
              app.accent === "cyan"
                ? "neon-border bg-card/60 hover:shadow-[0_0_24px_oklch(0.85_0.22_195_/_40%)]"
                : "neon-border-pink bg-card/60 hover:shadow-[0_0_24px_oklch(0.85_0.22_0_/_40%)]"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className={app.accent === "cyan" ? "neon-text font-mono" : "neon-text-pink font-mono"}>
                  {app.title}
                </CardTitle>
                {app.free ? (
                  <Badge className="neon-border bg-transparent text-[oklch(0.85_0.22_195)] font-mono">
                    無料
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-mono text-muted-foreground">
                    {app.priceLabel}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {app.visual && (
                <div className="rounded-xl overflow-hidden py-4" style={{ background: "linear-gradient(160deg, #0a0018, #0d0025)" }}>
                  {app.visual}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{app.description}</p>
              <Button render={<Link href={app.href} />}>詳しく見る →</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
