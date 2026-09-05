import type { Metadata } from "next";
import Link from "next/link";
import { KAKEI_QUEST_DAYS } from "@/lib/kakeiQuestDays";

const OPENCHAT_URL =
  "https://line.me/ti/g2/9qTQwB1X9phfFgv84RdcvRO_HnffYdHuSHEnsg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default";

export const metadata: Metadata = {
  title: "30日家計改善クエスト",
  description:
    "お金の不安を、30日で少しずつ整理する。YouTube「ずんだもんとめたんの資産形成日記」発、1日1つの小さなミッション企画です。",
};

export default function ThirtyDaysPage() {
  return (
    <div className="flex flex-col flex-1">
      {/* ファーストビュー */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-10 w-full text-center">
        <p className="text-xs tracking-[0.3em] text-muted-foreground mb-3">
          ずんだもんとめたんの資産形成日記
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold neon-text mb-4">
          30日家計改善クエスト
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          お金の不安を、30日で少しずつ整理する。
          <br />
          1日1つ、小さなことから一緒にやってみませんか?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tools/investment-tracker"
            className="rounded-full neon-border-pink bg-card/60 px-6 py-3 text-sm neon-text-pink font-semibold hover:bg-white/5"
          >
            積立クエストを始める
          </Link>
          <a
            href={OPENCHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full neon-border bg-card/60 px-6 py-3 text-sm neon-text font-semibold hover:bg-white/5"
          >
            みんなと参加する
          </a>
        </div>
      </section>

      <div
        className="max-w-xs mx-auto w-full h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }}
      />

      {/* 何をするの？ */}
      <section className="max-w-2xl mx-auto px-6 py-12 w-full">
        <h2 className="text-sm tracking-[0.3em] gold-text mb-6">— 何をするの？ —</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "① 家計を知る", body: "毎月出ていくお金と、使った記憶のない支出を見つける" },
            { title: "② ムダや固定費を整理する", body: "生活防衛資金を計算し、貯金の目的を1つ決める" },
            { title: "③ 貯金・投資に回せるお金を作る", body: "使えるお金を計算し、記録を始める" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-card/40 p-4">
              <p className="font-semibold text-sm mb-2">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          見るだけ参加OK、匿名OK、金額の公開は不要です。投資商品の勧誘は一切行いません。
        </p>
      </section>

      <div
        className="max-w-xs mx-auto w-full h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }}
      />

      {/* 積立クエスト紹介 */}
      <section className="max-w-2xl mx-auto px-6 py-12 w-full">
        <h2 className="text-sm tracking-[0.3em] gold-text mb-6">— 積立クエスト —</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          家計を入力すると、今の家計を整理して、毎月の予算づくりをサポートするWebツールです。
          ログイン不要。入力したデータはこの端末のブラウザ内だけに保存され、運営者のサーバーには送信されません。
        </p>
        <Link
          href="/tools/investment-tracker"
          className="inline-block rounded-full neon-border-pink bg-card/60 px-5 py-2 text-sm neon-text-pink font-semibold hover:bg-white/5"
        >
          積立クエストを開く →
        </Link>
      </section>

      <div
        className="max-w-xs mx-auto w-full h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }}
      />

      {/* Dayごとの会話 */}
      <section className="max-w-2xl mx-auto px-6 py-12 w-full">
        <h2 className="text-sm tracking-[0.3em] gold-text mb-2">— ずんだもんとめたんと一緒にやろう —</h2>
        <p className="text-xs text-muted-foreground mb-6">
          運営者本人も実際にやってみた感想込みで、ずんだもんとめたんが1日ずつ会話形式で案内します(金額は非公開です)。
        </p>
        <ul className="space-y-3">
          {KAKEI_QUEST_DAYS.map((d) => (
            <li key={d.day}>
              <Link
                href={`/30days/${d.slug}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/30 p-3 hover:bg-white/5"
              >
                <span className="neon-text-pink font-mono text-xs shrink-0">
                  Day{d.day}
                </span>
                <span className="text-xs text-foreground/90 flex-1">{d.title}</span>
                <span className="text-muted-foreground text-xs shrink-0">会話を読む →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div
        className="max-w-xs mx-auto w-full h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }}
      />

      {/* みんなで続ける */}
      <section className="max-w-2xl mx-auto px-6 py-12 w-full text-center">
        <h2 className="text-sm tracking-[0.3em] gold-text mb-6">— みんなで続ける —</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          一人だと続かない、という人向けに、30日家計改善クエスト参加者のオープンチャットを作りました。
          <br />
          ニックネームで参加できます。見るだけでもOKです。
        </p>
        <a
          href={OPENCHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full neon-border bg-card/60 px-6 py-3 text-sm neon-text font-semibold hover:bg-white/5 mb-6"
        >
          オープンチャットに参加する →
        </a>
        <div className="text-left text-xs text-muted-foreground leading-relaxed rounded-xl border border-white/10 bg-card/30 p-4 space-y-1">
          <p className="font-semibold text-foreground/80 mb-1">参加にあたって</p>
          <p>・個別の銘柄・投資商品の売買推奨や勧誘は禁止です</p>
          <p>・「絶対儲かる」等の断定的な勧誘、DM営業、商材の紹介は禁止です</p>
          <p>・資産額・勤務先・住所など個人を特定できる情報のやり取りは避けてください</p>
          <p>・他の人の家計や進捗を否定したり比較して煽ったりしないでください</p>
          <p>・投稿する金額は任意です。金額を書かない報告でも歓迎します</p>
        </div>
      </section>

      <footer className="text-center py-10 text-xs text-muted-foreground space-y-2">
        <p>本企画は投資商品の勧誘を目的としたものではありません。投資の最終判断はご自身で行ってください。</p>
        <p className="gold-text opacity-40">— 30日家計改善クエスト —</p>
      </footer>
    </div>
  );
}
