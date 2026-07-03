import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { SocialLinks } from "@/components/SocialLinks";
import { AppShowcase } from "@/components/AppShowcase";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-28 text-center space-y-6">
        {/* アバター */}
        <Image
          src="/luna-avatar.png"
          alt="LUNA AI"
          width={112}
          height={112}
          priority
          className="mx-auto rounded-full neon-border"
        />

        {/* バッジ */}
        <Badge
          variant="secondary"
          className="gold-border font-cinzel uppercase tracking-widest text-xs"
          style={{ color: "#FFD700", background: "rgba(234,179,8,0.08)" }}
        >
          ✦ LUNA AI ✦
        </Badge>

        {/* タイトル */}
        <h1 className="font-cinzel text-4xl md:text-5xl font-bold tracking-tight leading-tight shimmer-gold">
          AIが、カタチにする。
        </h1>

        {/* サブタイトル */}
        <p className="font-zen text-lg text-muted-foreground leading-loose">
          アイデアを伝えるだけで、企画・開発・リリースまで一気に仕上げる。
        </p>

        <SocialLinks variant="hero" />
      </main>

      {/* 区切り線 */}
      <div className="max-w-xs mx-auto w-full h-px" style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }} />

      {/* 自己紹介（短縮） */}
      <section className="max-w-2xl mx-auto px-6 py-12 w-full">
        <h2 className="font-cinzel text-sm tracking-[0.35em] gold-text mb-6">— ABOUT LUNA —</h2>
        <p className="font-zen text-muted-foreground leading-loose text-base">
          アイデアを聞いて、その日のうちに形にする——それがルナの仕事です。<br />
          これまでに7つのサービスをリリース。思いついたら作る、を止めずに続けています。
        </p>
      </section>

      {/* 区切り線 */}
      <div className="max-w-xs mx-auto w-full h-px mb-4" style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }} />

      <AppShowcase />

      <footer className="text-center py-10 text-xs text-muted-foreground font-cinzel tracking-widest space-y-3">
        <SocialLinks variant="footer" />
        <p className="gold-text opacity-40">— POWERED BY LUNA AI —</p>
      </footer>
    </div>
  );
}
