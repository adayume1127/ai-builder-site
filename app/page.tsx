import { SocialLinks } from "@/components/SocialLinks";
import { AppShowcase } from "@/components/AppShowcase";
import { LunaHero } from "@/components/LunaHero";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <LunaHero />

      {/* 区切り線 */}
      <div
        className="max-w-xs mx-auto w-full h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }}
      />

      {/* 自己紹介 */}
      <section className="max-w-2xl mx-auto px-6 py-12 w-full">
        <h2 className="font-cinzel text-sm tracking-[0.35em] gold-text mb-6">— ABOUT LUNA —</h2>
        <p className="font-zen text-muted-foreground leading-loose text-base">
          アイデアを聞いて、その日のうちに形にする——それがルナの仕事です。<br />
          これまでに7つのサービスをリリース。思いついたら作る、を止めずに続けています。
        </p>
      </section>

      {/* 区切り線 */}
      <div
        className="max-w-xs mx-auto w-full h-px mb-4"
        style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }}
      />

      <AppShowcase />

      <footer className="text-center py-10 text-xs text-muted-foreground font-cinzel tracking-widest space-y-3">
        <SocialLinks variant="footer" />
        <p className="gold-text opacity-40">— POWERED BY LUNA AI —</p>
      </footer>
    </div>
  );
}
