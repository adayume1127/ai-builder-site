import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "写真をまとめてアップロードするだけ",
    description:
      "スマホやPCに溜まった写真をまとめてアップロードするだけで、AIがブレ・重複・スクショ・書類を自動分類します。",
  },
  {
    title: "削除候補を一覧で提案",
    description:
      "ブレた写真や重複写真、スクリーンショットだけを削除候補としてピックアップ。人物写真は誤って削除候補に入らない安全設計です。",
  },
  {
    title: "登録不要、その場で診断",
    description: "会員登録やログインは不要。その場で¥480の都度課金で、最大500枚まで診断できます。",
  },
];

const PLANS = [
  { name: "都度課金", price: "¥480", limit: "写真500枚まで診断" },
];

export default function PhotoSortAiPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>
        <h1 className="neon-text text-4xl font-bold tracking-tight font-mono">
          写真フォルダAI仕分け
        </h1>
        <p className="text-lg text-muted-foreground">
          写真をまとめてアップロードするだけで、AIがブレ・重複・スクショを自動診断します
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          「写真は撮るけど整理しない」を解決する軽量ツール。サーバーに写真を保存しない設計で、
          診断結果から削除候補だけを確認できます。
        </p>
        <Button
          size="lg"
          render={
            <a
              href="https://photo-sort-ai-mocha.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          サービスを見る →
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
        <h2 className="neon-text text-xl font-bold text-center font-mono">
          # 料金プラン
        </h2>
        <div className="grid gap-4 max-w-xs mx-auto">
          {PLANS.map((plan) => (
            <Card key={plan.name} className="neon-border-pink bg-card/40">
              <CardHeader>
                <CardTitle className="text-base font-mono">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="neon-text-pink text-xl font-bold font-mono">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.limit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
