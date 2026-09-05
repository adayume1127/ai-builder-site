import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KAKEI_QUEST_DAYS, getKakeiQuestDay } from "@/lib/kakeiQuestDays";

const OPENCHAT_URL =
  "https://line.me/ti/g2/9qTQwB1X9phfFgv84RdcvRO_HnffYdHuSHEnsg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default";

export function generateStaticParams() {
  return KAKEI_QUEST_DAYS.map((d) => ({ day: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ day: string }>;
}): Promise<Metadata> {
  const { day } = await params;
  const content = getKakeiQuestDay(day);
  if (!content) return {};
  return {
    title: `Day${content.day} ${content.title} | 30日家計改善クエスト`,
    description: content.summary,
  };
}

export default async function KakeiQuestDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const content = getKakeiQuestDay(day);
  if (!content) notFound();

  const index = KAKEI_QUEST_DAYS.findIndex((d) => d.slug === day);
  const prev = index > 0 ? KAKEI_QUEST_DAYS[index - 1] : undefined;
  const next = index < KAKEI_QUEST_DAYS.length - 1 ? KAKEI_QUEST_DAYS[index + 1] : undefined;

  return (
    <div className="flex flex-col flex-1">
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-6 w-full text-center">
        <p className="text-xs tracking-[0.3em] text-muted-foreground mb-3">
          30日家計改善クエスト
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold neon-text mb-3">
          Day{content.day} {content.title}
        </h1>
        <p className="text-muted-foreground leading-relaxed text-sm">{content.summary}</p>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-10 w-full">
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-6 space-y-4">
          {content.dialogue.map((line, i) => {
            const isZundamon = line.speaker === "zundamon";
            return (
              <div
                key={i}
                className={`flex gap-3 ${isZundamon ? "flex-row" : "flex-row-reverse text-right"}`}
              >
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isZundamon
                      ? "neon-border neon-text"
                      : "neon-border-pink neon-text-pink"
                  }`}
                >
                  {isZundamon ? "ずん" : "めた"}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    isZundamon
                      ? "bg-card/60 border border-white/10 text-left"
                      : "bg-card/60 border border-white/10 text-left"
                  }`}
                >
                  {line.text}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-12 w-full">
        <h2 className="text-sm tracking-[0.3em] gold-text mb-4">— 今日やること —</h2>
        <div className="rounded-2xl border border-white/10 bg-card/30 p-4 text-sm text-foreground/90 leading-relaxed">
          {content.action}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          見るだけ参加OK、匿名OK、金額の公開は不要です。
        </p>
      </section>

      <div
        className="max-w-xs mx-auto w-full h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(234,179,8,0.4), transparent)" }}
      />

      <section className="max-w-2xl mx-auto px-6 py-12 w-full text-center">
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/tools/investment-tracker"
            className="rounded-full neon-border-pink bg-card/60 px-6 py-3 text-sm neon-text-pink font-semibold hover:bg-white/5"
          >
            積立クエストを開く
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

        <div className="flex items-center justify-between text-sm">
          {prev ? (
            <Link href={`/30days/${prev.slug}`} className="neon-text-pink hover:underline">
              ← Day{prev.day}
            </Link>
          ) : (
            <span />
          )}
          <Link href="/30days" className="text-muted-foreground hover:underline text-xs">
            全体の一覧に戻る
          </Link>
          {next ? (
            <Link href={`/30days/${next.slug}`} className="neon-text hover:underline">
              Day{next.day} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
    </div>
  );
}
