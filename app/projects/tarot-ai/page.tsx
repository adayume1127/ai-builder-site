import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "大アルカナ22枚・AI深層解読",
    description:
      "古来より伝わる22枚のタロットカードをAIが解読。質問やテーマを入れると、あなた専用のパーソナルな鑑定文を生成します。",
  },
  {
    title: "3つの鑑定モード",
    description:
      "1枚引きのシンプルな占い、過去・現在・未来を読むスリーカードスプレッド、仕事・恋愛・お金など5テーマの深層鑑定に対応しています。",
  },
  {
    title: "鑑定履歴の保存・閲覧",
    description:
      "プレミアムプランでは過去の鑑定をすべて保存・閲覧できます。カードの組み合わせや日時を振り返りながら、自分の流れを読むことができます。",
  },
];

const PLANS = [
  { name: "Free", price: "¥0", limit: "1日1回・1枚引きのみ" },
  { name: "Premium", price: "¥500/月", limit: "無制限・全モード・履歴保存" },
];

export default function TarotAiPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>
        <h1 className="neon-text-pink text-4xl font-bold tracking-tight font-mono">
          ルナタロット AI
        </h1>
        <p className="text-lg text-muted-foreground">
          星が語る、あなたの真実——大アルカナ22枚のタロットをAIが深層解読
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          質問を入れるだけで、Claude AIがカードとあなたの状況を組み合わせてパーソナルな鑑定を生成。
          無料プランで1日1回、プレミアムプランで無制限に占えます。
        </p>
        <Button
          size="lg"
          render={
            <a
              href="https://tarot-ai-lilac-tau.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          占ってみる →
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
        <div className="grid gap-4 max-w-sm mx-auto md:grid-cols-2">
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
