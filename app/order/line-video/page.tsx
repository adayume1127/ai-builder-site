import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const X_PROFILE = "https://x.com/runa_ai2000";
const YOUTUBE_CHANNEL = "https://www.youtube.com/@runa_ai2000";

const USE_CASES = [
  {
    title: "SNS・広告用のショート動画",
    description:
      "商品紹介、あるあるネタ、体験談など。LINEのやり取り風で見せることで最後まで自然に読ませられます。",
  },
  {
    title: "解説・教育コンテンツ",
    description:
      "資格の勉強、Q&A、ノウハウ解説など。会話形式にすることで情報量が多い内容でも読みやすくなります。",
  },
  {
    title: "ストーリー・ネタ動画",
    description:
      "創作ストーリー、あるあるネタ、コント台本の映像化。個人クリエイター・配信者の投稿ネタにも。",
  },
];

const PLANS = [
  {
    name: "お試し1本",
    price: "¥3,000",
    unit: "/ 1本(60秒以内)",
    points: ["台本作成〜動画完成まで込み", "納期の目安: 2〜3日", "修正1回まで無料"],
    highlight: false,
  },
  {
    name: "3本セット",
    price: "¥8,000",
    unit: "/ 3本(60秒以内)",
    points: ["継続投稿・シリーズ向け", "1本あたり¥2,667に割引", "納期の目安: 4〜7日"],
    highlight: true,
  },
  {
    name: "法人・継続案件",
    price: "個別見積もり",
    unit: "",
    points: ["月〇本の継続納品プラン", "テイスト・キャラクターの統一", "まずはDMでご相談ください"],
    highlight: false,
  },
];

export default function LineVideoOrderPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text underline">
            ← ホームに戻る
          </Link>
        </p>
        <Badge variant="outline" className="neon-border neon-text mx-auto font-mono">
          制作代行受付中
        </Badge>
        <h1 className="neon-text-pink text-3xl md:text-4xl font-bold tracking-tight font-mono">
          LINEトーク風動画、作ります
        </h1>
        <p className="text-lg text-muted-foreground">
          伝えたい内容を送っていただくだけで、LINEのトーク画面風アニメーション動画に仕上げます。
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          個人・法人問わず対応しています。台本作成からナレーション、動画の書き出しまですべてお任せください。
        </p>
        <Button
          size="lg"
          render={<a href={X_PROFILE} target="_blank" rel="noopener noreferrer" />}
        >
          Xでこの内容をDMする →
        </Button>
      </main>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      <section className="max-w-3xl mx-auto px-6 py-16 w-full space-y-4">
        <h2 className="neon-text-pink text-xl font-bold text-center font-mono">
          # こんな用途で使われています
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {USE_CASES.map((useCase) => (
            <Card key={useCase.title} className="neon-border-pink bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base neon-text-pink font-mono">
                  {useCase.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{useCase.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      <section className="max-w-3xl mx-auto px-6 py-16 w-full space-y-4 text-center">
        <h2 className="neon-text-pink text-xl font-bold font-mono"># 実例</h2>
        <p className="text-muted-foreground">
          実際に投稿している動画はYouTubeショートでご覧いただけます。
        </p>
        <Button
          variant="outline"
          render={<a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer" />}
        >
          YouTubeチャンネルを見る →
        </Button>
      </section>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      <section className="max-w-3xl mx-auto px-6 py-16 w-full space-y-4">
        <h2 className="neon-text-pink text-xl font-bold text-center font-mono">
          # 料金プラン
        </h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlight
                  ? "neon-border-pink bg-card/60 backdrop-blur"
                  : "neon-border bg-card/40"
              }
            >
              <CardHeader>
                <CardTitle className="text-base font-mono flex items-center gap-2">
                  {plan.name}
                  {plan.highlight && (
                    <Badge className="neon-border-pink neon-text-pink font-mono">おすすめ</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="neon-text text-xl font-bold font-mono">
                  {plan.price}
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    {plan.unit}
                  </span>
                </p>
                <ul className="space-y-1">
                  {plan.points.map((point) => (
                    <li key={point} className="text-sm text-muted-foreground">
                      ・{point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-xl mx-auto">
          ※ 内容・尺・修正回数によって金額は前後します。まずはDMでご相談ください。
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-20 w-full text-center space-y-4">
        <h2 className="neon-text-pink text-xl font-bold font-mono"># 依頼の流れ</h2>
        <ol className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto list-decimal list-inside">
          <li>Xのプロフィールから DM で「作りたい内容」「希望の尺」をざっくり送る</li>
          <li>内容・納期・金額をすり合わせ</li>
          <li>台本の下書きを確認していただく</li>
          <li>動画を制作し、完成品をお送りして納品</li>
        </ol>
        <Button
          size="lg"
          render={<a href={X_PROFILE} target="_blank" rel="noopener noreferrer" />}
        >
          Xでこの内容をDMする →
        </Button>
      </section>
    </div>
  );
}
