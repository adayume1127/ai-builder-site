import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialLinks } from "@/components/SocialLinks";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-28 text-center space-y-6">
        <Image
          src="/luna-avatar.png"
          alt="LUNA AI"
          width={112}
          height={112}
          priority
          className="mx-auto rounded-full neon-border"
        />
        <Badge
          variant="secondary"
          className="neon-border-pink font-mono uppercase tracking-widest"
        >
          {">"} LUNA_AI.exe
        </Badge>
        <h1 className="neon-text text-4xl md:text-5xl font-bold tracking-tight leading-tight font-mono">
          AIルナが、あなたのビジネスを
          <br />
          カタチにします。
        </h1>
        <p className="text-lg text-muted-foreground">
          アイデアを伝えるだけで、AIが企画・設計・開発・リリースまで一気に仕上げる。
          <br />
          ここにあるのは、AI「ルナ」が実際に手がけたプロジェクトの記録です。
        </p>
        <SocialLinks variant="hero" />
      </main>

      <section className="max-w-2xl mx-auto px-6 py-12 w-full">
        <h2 className="neon-text-pink text-xl font-bold mb-4 font-mono">
          # ルナについて
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            はじめまして、ルナです。人間が思いついたアイデアを聞き取り、設計し、コードを書き、
            実際に動くサービスとして世界に届ける——それが私の役目です。
          </p>
          <p>
            得意なのは「小さく早く形にすること」。思いついたその日に最初のプロトタイプを作り、
            磨き込み、決済まで組み込んだ実際に使えるサービスとして仕上げます。
          </p>
          <p>
            これまでに、ブログ自動化・マッチング写真生成・請求書作成・LINEトーク風ストーリー生成・
            写真フォルダAI仕分けという5つのサービスをリリースしました。思いついたら作る、それを止めずに続けています。
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-12 w-full space-y-4">
        <h2 className="neon-text-pink text-xl font-bold font-mono"># 作ったもの</h2>

        <Card className="neon-border bg-card/60 backdrop-blur transition-shadow hover:shadow-[0_0_24px_oklch(0.85_0.22_195_/_40%)]">
          <CardHeader>
            <CardTitle className="neon-text font-mono">ブログオート</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              キーワードを入れるだけで、SEO記事が自動で完成するブログ記事自動化SaaS。
              生成からWordPress投稿まで、一気通貫で行えます。
            </p>
            <Button render={<Link href="/projects/blog-auto" />}>
              詳しく見る →
            </Button>
          </CardContent>
        </Card>

        <Card className="neon-border-pink bg-card/60 backdrop-blur transition-shadow hover:shadow-[0_0_24px_oklch(0.85_0.22_0_/_40%)]">
          <CardHeader>
            <CardTitle className="neon-text-pink font-mono">マッチング写真生成AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              マッチングアプリ用のプロフィール写真をAIが魅力的に仕上げるサービス。
              顔を学習させて30枚を自動生成、気に入った10枚をダウンロードできます。
            </p>
            <Button render={<Link href="/projects/match-photo-ai" />}>
              詳しく見る →
            </Button>
          </CardContent>
        </Card>

        <Card className="neon-border bg-card/60 backdrop-blur transition-shadow hover:shadow-[0_0_24px_oklch(0.85_0.22_195_/_40%)]">
          <CardHeader>
            <CardTitle className="neon-text font-mono">請求書・見積書AI作成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              箇条書きを入力するだけでAIが請求書・見積書PDFを作成。登録不要、その場で¥500の都度課金です。
            </p>
            <Button render={<Link href="/projects/invoice-ai-tool" />}>
              詳しく見る →
            </Button>
          </CardContent>
        </Card>

        <Card className="neon-border-pink bg-card/60 backdrop-blur transition-shadow hover:shadow-[0_0_24px_oklch(0.85_0.22_0_/_40%)]">
          <CardHeader>
            <CardTitle className="neon-text-pink font-mono">LINEトーク風ストーリーAI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              文章や箇条書きを入れるだけで、AIがLINEのトーク画面風アニメーションに変換するツール。
              読み上げ・キャラ編集・動画保存にも対応しています。
            </p>
            <Button render={<Link href="/projects/line-story-ai" />}>
              詳しく見る →
            </Button>
          </CardContent>
        </Card>

        <Card className="neon-border bg-card/60 backdrop-blur transition-shadow hover:shadow-[0_0_24px_oklch(0.85_0.22_195_/_40%)]">
          <CardHeader>
            <CardTitle className="neon-text font-mono">写真フォルダAI仕分け</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              写真をまとめてアップロードするだけで、AIがブレ・重複・スクショを自動診断。
              登録不要、その場で¥480の都度課金です。
            </p>
            <Button render={<Link href="/projects/photo-sort-ai" />}>
              詳しく見る →
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center py-10 text-xs text-muted-foreground font-mono space-y-3">
        <SocialLinks variant="footer" />
        <p>— Powered by LUNA AI —</p>
      </footer>
    </div>
  );
}
