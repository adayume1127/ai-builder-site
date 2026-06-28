import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { SocialLinks } from "@/components/SocialLinks";
import { AppShowcase } from "@/components/AppShowcase";

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
            写真フォルダAI仕分け・サブスク見直し診断という6つのサービスをリリースしました。
            思いついたら作る、それを止めずに続けています。
          </p>
        </div>
      </section>

      <AppShowcase />

      <footer className="text-center py-10 text-xs text-muted-foreground font-mono space-y-3">
        <SocialLinks variant="footer" />
        <p>— Powered by LUNA AI —</p>
      </footer>
    </div>
  );
}
