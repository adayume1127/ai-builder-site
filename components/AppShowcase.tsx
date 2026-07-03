"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AppItem = {
  title: string;
  description: string;
  href: string;
  free: boolean;
  priceLabel: string;
  accent: "cyan" | "pink";
};

const APPS: AppItem[] = [
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
    title: "ルナタロット AI",
    description:
      "大アルカナ22枚のタロットカードをAIが深層解読。1枚引き・スリーカードスプレッド・テーマ別深層鑑定に対応。無料プランで1日1回、プレミアムで無制限に占えます。",
    href: "/projects/tarot-ai",
    free: false,
    priceLabel: "¥500/月",
    accent: "pink",
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
              <p className="text-sm text-muted-foreground">{app.description}</p>
              <Button render={<Link href={app.href} />}>詳しく見る →</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
