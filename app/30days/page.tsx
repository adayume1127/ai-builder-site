import type { Metadata } from "next";
import Link from "next/link";

// TODO: LINEオープンチャットを作成したら、実際の招待URLに差し替える
const OPENCHAT_URL = "https://line.me/ti/g2/";

export const metadata: Metadata = {
  title: "30日家計改善クエスト",
  description:
    "お金の不安を、30日で少しずつ整理する。YouTube「ずんだもんとめたんの資産形成日記」発、1日1つの小さなミッション企画です。",
};

const MISSIONS = [
  { day: 1, label: "毎月絶対に出ていくお金を書き出す" },
  { day: 2, label: "覚えてない支出を1つ見つける" },
  { day: 3, label: "生活防衛資金が何ヶ月分あるか計算する" },
  { day: 4, label: "貯金の目的を1つ決める" },
  { day: 5, label: "今月自由に使えるお金を計算する" },
  { day: 6, label: "1週間、支出の記録を始める" },
  { day: 7, label: "6日間を振り返る" },
];

const OPERATOR_LOG = [
  { day: 1, note: "固定費、思ったより費目が多くて驚いた。サブスクだけで5個あった。" },
  { day: 2, note: "案の定、使った記憶のない支出が1つ見つかった。地味にショック。" },
  { day: 3, note: "計算したら3ヶ月分もなかった…まずは意識するところから。" },
  { day: 4, note: "「なんとなく」じゃなく目的を決めたら、貯める理由がはっきりした。" },
  { day: 5, note: "使えるお金、思ったより少なかった。でも数字で見えると安心感がある。" },
  { day: 6, note: "レシートを取っておくだけ、を1週間続けてみている。完璧じゃなくていい。" },
  { day: 7, note: "振り返ってみると、一番大変だったのはDay2(謎支出探し)でした。" },
];

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

      {/* 運営者の進捗 */}
      <section className="max-w-2xl mx-auto px-6 py-12 w-full">
        <h2 className="text-sm tracking-[0.3em] gold-text mb-6">— 運営者も30日クエスト挑戦中 —</h2>
        <p className="text-xs text-muted-foreground mb-6">
          動画を作っている本人も、同じミッションを実際にやってみています(金額は非公開です)。
        </p>
        <ul className="space-y-3">
          {MISSIONS.map((m) => {
            const log = OPERATOR_LOG.find((l) => l.day === m.day);
            return (
              <li key={m.day} className="flex gap-3 rounded-xl border border-white/10 bg-card/30 p-3">
                <span className="neon-text-pink font-mono text-xs shrink-0 pt-0.5">
                  Day{m.day} ✓
                </span>
                <div className="text-xs">
                  <p className="text-foreground/90">{m.label}</p>
                  {log && <p className="text-muted-foreground mt-1">{log.note}</p>}
                </div>
              </li>
            );
          })}
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
