import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "ガチャでカードを収集",
    description:
      "大アルカナ22枚＋レアカードを放置しながら少しずつ集めていく。引くたびに違う絵柄が出るコレクション要素が止まらない。",
  },
  {
    title: "ルナが主役の世界観",
    description:
      "月夜の世界を旅するルナを見守りながら、星の力を貯めていく。独自のストーリーと世界観が楽しめる放置型ゲーム。",
  },
  {
    title: "登録不要・完全無料",
    description:
      "アカウント作成なしで今すぐ始められる。広告なし、課金なしで楽しめるので、気軽に試してみてください。",
  },
];

export default function TsukiyoTarotPage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 w-full">
        <p className="text-sm text-muted-foreground font-mono mb-8">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>

        {/* Hero */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Card visual */}
          <div className="relative flex-shrink-0" style={{ width: 160, height: 264 }}>
            <div
              className="absolute rounded-2xl"
              style={{
                inset: "-20px",
                background:
                  "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(124,58,237,0.5) 0%, rgba(59,130,246,0.3) 45%, transparent 75%)",
                filter: "blur(20px)",
              }}
            />
            <div
              className="relative w-full h-full rounded-xl overflow-hidden"
              style={{
                border: "1.5px solid rgba(234,179,8,0.85)",
                boxShadow:
                  "0 10px 40px rgba(0,0,0,0.85), 0 0 28px rgba(168,85,247,0.55), 0 0 56px rgba(234,179,8,0.18)",
                animation: "luna-float 6s ease-in-out infinite",
              }}
            >
              <Image
                src="/tarot/00_the_fool.png"
                alt="愚者"
                fill
                priority
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Text */}
          <div className="text-center md:text-left space-y-5">
            <h1 className="neon-text-pink text-3xl md:text-4xl font-bold tracking-tight font-mono">
              月夜タロット
              <br />
              放置ゲーム
            </h1>
            <p className="text-muted-foreground leading-loose">
              ルナが星の夜をさまよいながら、タロットカードを一枚一枚手に入れていく——
              <br className="hidden md:block" />
              放置しながら育てる、夜と月のゆるやかな冒険。
            </p>
            <Button
              size="lg"
              className="neon-border-pink"
              render={
                <a
                  href="https://www.tsukiyo-tarot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              ゲームを始める →
            </Button>
          </div>
        </div>
      </main>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-4 w-full">
        {FEATURES.map((f) => (
          <Card key={f.title} className="neon-border-pink bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base neon-text-pink font-mono">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4 w-full">
        <p className="text-muted-foreground font-zen text-lg">星の声に耳をすませて——</p>
        <Button
          size="lg"
          className="neon-border-pink"
          render={
            <a
              href="https://www.tsukiyo-tarot.com"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          今すぐ無料でプレイ →
        </Button>
      </section>
    </div>
  );
}
