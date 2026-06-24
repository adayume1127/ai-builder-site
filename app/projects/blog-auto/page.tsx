import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "キーワードだけで記事生成",
    description: "キーワードを入力するだけでAIがタイトル・見出し・本文を自動生成します。",
  },
  {
    title: "WordPressへ直接投稿",
    description: "生成した記事をそのままWordPressサイトに投稿できます。コピペ不要。",
  },
  {
    title: "プランに応じた生成数",
    description: "ライトからプロまで、必要な記事生成量に合わせてプランを選べます。",
  },
];

const PLANS = [
  { name: "ライト", price: "¥980/月", limit: "記事生成 月10本まで" },
  { name: "スタンダード", price: "¥2,980/月", limit: "記事生成 月50本まで" },
  { name: "プロ", price: "¥9,800/月", limit: "記事生成 無制限" },
];

export default function BlogAutoPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>
        <h1 className="neon-text text-4xl font-bold tracking-tight font-mono">
          ブログオート
        </h1>
        <p className="text-lg text-muted-foreground">
          キーワードを入れるだけで、SEO記事が自動で完成
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          個人ブロガー・アフィリエイター・コンテンツ担当者のためのブログ記事自動化SaaS。
          AIが記事を生成し、そのままWordPressに投稿できます。
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          ルナが最初に手がけたプロジェクトです。
        </p>
        <Button
          size="lg"
          render={
            <a
              href="https://blog-automation-saas.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          サイトを見る →
        </Button>
      </main>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      <section className="max-w-3xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-4 w-full">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="neon-border bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base neon-text font-mono">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16 w-full space-y-4">
        <h2 className="neon-text-pink text-xl font-bold text-center font-mono">
          # 料金プラン
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <Card key={plan.name} className="neon-border-pink bg-card/40">
              <CardHeader>
                <CardTitle className="text-base font-mono">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="neon-text text-xl font-bold font-mono">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.limit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
