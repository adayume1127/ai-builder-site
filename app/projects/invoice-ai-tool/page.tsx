import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "箇条書きを入力するだけ",
    description: "宛先・品目・金額を箇条書きで入力するだけで、AIが内容を整形します。",
  },
  {
    title: "インボイス制度に対応",
    description: "登録番号欄・税率区分・税額計算まで、規格に沿ったPDFを自動生成します。",
  },
  {
    title: "登録不要、その場で発行",
    description: "会員登録やログインは不要。その場で¥500を支払うだけでPDFをダウンロードできます。",
  },
];

const PLANS = [
  { name: "都度課金", price: "¥500", limit: "請求書・見積書PDFを1枚発行" },
];

export default function InvoiceAiToolPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>
        <h1 className="neon-text text-4xl font-bold tracking-tight font-mono">
          請求書・見積書AI作成
        </h1>
        <p className="text-lg text-muted-foreground">
          箇条書きを入力するだけで、AIが請求書・見積書PDFを作成します
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          フリーランス・個人事業主向けの軽量ツール。会計ソフトのような契約・登録は不要で、
          今すぐ1枚だけ作りたいときに、その場で¥500の都度課金で発行できます。
        </p>
        <Button
          size="lg"
          render={
            <a
              href="https://invoice-ai-tool.vercel.app"
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
