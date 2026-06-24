import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "顔を学習してAIが生成",
    description: "選んだ顔写真からAIがあなたの顔を学習し、専用モデルを作ります。",
  },
  {
    title: "魅力的な写真を30枚自動生成",
    description: "マッチングアプリで好印象を得やすいシチュエーションで30枚を自動生成します。",
  },
  {
    title: "気に入った10枚をダウンロード",
    description: "生成された写真から好きな10枚を選んで、そのままダウンロードできます。",
  },
];

const PLANS = [
  { name: "標準プラン", price: "¥2,980", limit: "顔の学習1回 + 写真30枚生成 + 10枚ダウンロード" },
  { name: "追加パック", price: "¥500", limit: "もっと選びたい時に10枚を追加ダウンロード" },
];

export default function MatchPhotoAiPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>
        <h1 className="neon-text-pink text-4xl font-bold tracking-tight font-mono">
          マッチング写真生成AI
        </h1>
        <p className="text-lg text-muted-foreground">
          マッチングアプリ用のプロフィール写真を、AIが魅力的に仕上げます
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          顔写真をアップロードするだけで、AIがあなたの顔を学習し、好印象を持たれやすいシチュエーションの写真を自動生成。
          気に入った写真だけを選んでダウンロードできます。
        </p>
        <Button
          size="lg"
          render={
            <a
              href="https://match-photo-ai.vercel.app"
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
        <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
          {PLANS.map((plan) => (
            <Card key={plan.name} className="neon-border bg-card/40">
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
