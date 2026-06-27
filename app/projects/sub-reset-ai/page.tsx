import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "カードの利用明細を貼るだけ",
    description:
      "カード会社のアプリ・サイトで見られる利用明細をコピーして貼るだけ。CSVファイルのアップロードにも対応しています。",
  },
  {
    title: "重複・休眠サブスクをAIが発見",
    description:
      "同種サービスの重複契約や、月額換算・年間換算の合計をAIが算出。解約候補を一覧で確認できます。",
  },
  {
    title: "送信前にマスキングを確認できる",
    description:
      "カード番号・電話番号・メールアドレスはブラウザ内で伏字化してから送信。送信内容を事前にプレビューできます。",
  },
];

const PLANS = [
  { name: "都度課金", price: "¥500", limit: "サブスク見直しレポートPDF 1回分" },
];

export default function SubResetAiPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>
        <h1 className="neon-text-pink text-4xl font-bold tracking-tight font-mono">
          サブスク見直しAI診断
        </h1>
        <p className="text-lg text-muted-foreground">
          カードの利用明細を貼るだけで、AIが契約中のサブスクと重複・休眠サブスクを見つけます
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          「気づかないうちに払い続けているサブスク」を可視化する軽量ツール。
          個人事業主の方は経費仕分けの参考にもご利用いただけます。登録不要、その場で¥500の都度課金です。
        </p>
        <Button
          size="lg"
          render={
            <a
              href="https://sub-reset-ai.vercel.app"
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
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
