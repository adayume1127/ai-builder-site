import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEATURES = [
  {
    title: "アイソメトリックRPG",
    description:
      "2.5D視点のタイルマップでルナを操作。広大なフィールドを冒険しながら多彩なモンスターと戦う本格アクション。",
    icon: "⚔️",
  },
  {
    title: "14種のパッシブスキル",
    description:
      "Lv50ごとに解放される固有パッシブ。生命吸収・覇気・獄炎から、最高峰の「神域覚醒（Lv600）」まで、育てるほど強くなる。",
    icon: "✦",
  },
  {
    title: "20ステージ＋EX",
    description:
      "通常ステージを突破すると解放されるボスラッシュ。強敵が連続で押し寄せる極限モードに挑め。",
    icon: "🗺",
  },
  {
    title: "4キャラクター",
    description:
      "戦士・魔法使い・帝王・暗殺者——プレイスタイルに合わせて選べる個性豊かなキャラクター。",
    icon: "🌙",
  },
  {
    title: "多彩なスキル",
    description:
      "炎の矢・連鎖斬り・全体攻撃・ヒール・魔法陣など、キャラごとに異なるアクティブスキルを駆使して戦え。",
    icon: "💫",
  },
  {
    title: "登録不要・完全無料",
    description:
      "インストール不要、アカウント作成なし。ブラウザを開けば今すぐ始められる。",
    icon: "🎮",
  },
];

const PASSIVES = [
  { lv: 50,  name: "生命吸収",   desc: "与ダメ5%をHP回復" },
  { lv: 100, name: "攻勢/堅牢強化", desc: "ATK/MATKまたはDEF +25%" },
  { lv: 150, name: "連撃",       desc: "通常攻撃20%で2連ヒット" },
  { lv: 200, name: "闘志",       desc: "スキルCD・攻撃CD -25%" },
  { lv: 300, name: "覇気",       desc: "周囲オーラでDEF低下" },
  { lv: 400, name: "獄炎",       desc: "攻撃15%でバーン付与" },
  { lv: 500, name: "絶対覇王",   desc: "与ダメ×1.5 / 受ダメ×0.7" },
  { lv: 600, name: "神域覚醒",   desc: "全ステ×1.5 永続" },
];

export default function LunaQuestOnlinePage() {
  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto px-6 py-16 w-full">
        <p className="text-sm text-muted-foreground font-mono mb-8">
          <Link href="/" className="neon-text underline">
            ← ホームに戻る
          </Link>
        </p>

        {/* Hero */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* チビルナビジュアル */}
          <div className="relative flex-shrink-0" style={{ width: 200, height: 210 }}>
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 180,
                height: 100,
                background:
                  "radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.45) 0%, rgba(14,165,233,0.25) 50%, transparent 75%)",
                filter: "blur(20px)",
              }}
            />
            <Image
              src="/luna-quest-chibi.png"
              alt="ルナ（勇者）"
              width={200}
              height={200}
              priority
              style={{
                position: "relative",
                zIndex: 1,
                objectFit: "contain",
                animation: "luna-float 6s ease-in-out infinite",
              }}
            />
          </div>

          {/* テキスト */}
          <div className="text-center md:text-left space-y-5">
            <div>
              <p
                className="font-mono text-xs mb-2"
                style={{ color: "rgba(165,243,252,0.6)", letterSpacing: "0.2em" }}
              >
                ◆ BROWSER RPG ◆
              </p>
              <h1 className="neon-text text-3xl md:text-4xl font-bold tracking-tight font-mono">
                ルナクエスト
                <br />
                オンライン
              </h1>
            </div>
            <p className="text-muted-foreground leading-loose">
              ルナが剣と魔法で異世界を駆け抜ける、ブラウザで遊べる本格アイソメトリックRPG。
              <br className="hidden md:block" />
              Lv600「神域覚醒」を目指して、最強の冒険者へ——
            </p>
            <Button
              size="lg"
              className="neon-border"
              render={
                <a
                  href="https://luna-quest-online.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              今すぐ無料でプレイ →
            </Button>
          </div>
        </div>
      </main>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 py-16 w-full">
        <h2 className="neon-text font-mono text-lg font-bold mb-8">// ゲームの特徴</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="neon-border bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base neon-text font-mono flex items-center gap-2">
                  <span>{f.icon}</span>
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      {/* Passive skills showcase */}
      <section className="max-w-3xl mx-auto px-6 py-16 w-full">
        <h2 className="neon-text font-mono text-lg font-bold mb-2">// パッシブスキル一覧</h2>
        <p className="text-sm text-muted-foreground mb-8">レベルアップするごとに自動で解放される固有パッシブ。Lv600まで育て上げよ。</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PASSIVES.map((p) => (
            <div
              key={p.lv}
              className="rounded-xl p-3 text-center"
              style={{
                background: "rgba(10,0,30,0.8)",
                border: "1px solid rgba(165,243,252,0.2)",
              }}
            >
              <p
                className="font-mono text-xs mb-1"
                style={{ color: "rgba(234,179,8,0.8)" }}
              >
                Lv.{p.lv}
              </p>
              <p className="font-mono text-sm font-bold neon-text">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="max-w-2xl mx-auto bg-primary/30" />

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6 w-full">
        <p className="text-muted-foreground font-zen text-lg">剣を手に取り、神域を目指せ——</p>
        <div
          className="inline-block px-6 py-2 rounded-full font-mono text-xs"
          style={{
            background: "rgba(14,165,233,0.08)",
            border: "1px solid rgba(165,243,252,0.25)",
            color: "rgba(165,243,252,0.7)",
            letterSpacing: "0.15em",
          }}
        >
          ブラウザ対応 · 登録不要 · 完全無料
        </div>
        <div>
          <Button
            size="lg"
            className="neon-border"
            render={
              <a
                href="https://luna-quest-online.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            ゲームをプレイする →
          </Button>
        </div>
      </section>
    </div>
  );
}
