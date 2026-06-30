import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "文章を自動で会話に変換",
    description:
      "箇条書きや長文をAIが自然な会話形式に分解し、LINEのトーク画面風の吹き出しで1件ずつ再生します。",
  },
  {
    title: "キャラクター・背景を自由に編集",
    description:
      "登場人物の名前・アイコン、トーク画面の背景をあとから自由にカスタマイズできます。グループトークにも対応。",
  },
  {
    title: "AI音声つき動画保存",
    description:
      "2人の声を聞き分けながら再生できるだけでなく、AI音声(OpenAI)が読み上げる音声つき動画として保存できます(Chrome限定)。",
  },
];

const PLANS = [
  { name: "ライト", price: "¥500/月", limit: "トーク生成 月10回まで", voiceLimit: "音声つき保存: 追加パック購入時のみ" },
  { name: "スタンダード", price: "¥1,500/月", limit: "トーク生成 月50回まで", voiceLimit: "音声つき保存 月10回まで" },
  { name: "プロ", price: "¥3,000/月", limit: "トーク生成 無制限", voiceLimit: "音声つき保存 無制限" },
];

export default function LineStoryAiPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text underline">
            ← ホームに戻る
          </Link>
        </p>
        <h1 className="neon-text-pink text-4xl font-bold tracking-tight font-mono">
          LINEトーク風ストーリーAI
        </h1>
        <p className="text-lg text-muted-foreground">
          文章や箇条書きを入れるだけで、AIがLINEのトーク画面風アニメーションに変換します
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          ストーリーや小説の演出、SNS用ネタ作りに。会話の名前・アイコン・背景を自由に編集でき、
          完成したアニメーションはAI音声つき動画として保存できます。
        </p>
        <Button
          size="lg"
          render={
            <a
              href="https://line-story-ai.vercel.app"
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
          <Card key={feature.title} className="neon-border-pink bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base neon-text-pink font-mono">
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
        <div className="grid gap-4 max-w-xs mx-auto">
          {PLANS.map((plan) => (
            <Card key={plan.name} className="neon-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-base font-mono">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="neon-text text-xl font-bold font-mono">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.limit}</p>
                <p className="text-sm text-muted-foreground">{plan.voiceLimit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
