"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import { monthlyExpenseBreakdown, OTHER_CATEGORY_ID, OTHER_CATEGORY_LABEL, type CategorySlot } from "@/lib/categoryBreakdown";
import type { BudgetCategory, BudgetTransaction } from "@/lib/household";
import { colorForCategoryId, OTHER_SLICE_COLOR } from "./categoryChartPalette";

const WIDTH = 560;
const HEIGHT = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const CHART_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_H = HEIGHT - PAD_TOP - PAD_BOTTOM;
const BAR_MAX_W = 24;
const SEGMENT_GAP = 2;

const NICE_TICK_STEPS = [5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000, 2000000];

function chooseTickStep(maxV: number): number {
  const target = Math.max(maxV, 1) / 4;
  for (const step of NICE_TICK_STEPS) {
    if (step >= target) return step;
  }
  return NICE_TICK_STEPS[NICE_TICK_STEPS.length - 1];
}

function formatTickLabel(v: number) {
  if (v === 0) return "0円";
  if (Math.abs(v) >= 10000) {
    return `${(v / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万円`;
  }
  return `${Math.round(v).toLocaleString("ja-JP")}円`;
}

function formatMonthLabel(month: string) {
  const [, m] = month.split("-");
  return `${Number(m)}月`;
}

// 直近数ヶ月分の支出を、カテゴリ別に積み上げた棒グラフで見せる(推移の可視化)。
// 円グラフ(1ヶ月のスナップショット)とは別の役割: 複数月にまたがる比較は円グラフの
// 繰り返しではなく積み上げ棒が適切(dataviz原則: part-to-wholeの時系列比較)。
// カテゴリの色・積む順序は期間全体のランキング(topSlots)で固定し、月ごとの金額順には
// しない(色はエンティティに従う、ランクに従わない)。
export function CategoryTrendChart({
  transactions,
  categories,
  months,
  topSlots,
}: {
  transactions: BudgetTransaction[];
  categories: BudgetCategory[];
  months: string[]; // 記録が存在する月、古い→新しい順
  topSlots: CategorySlot[];
}) {
  const [hoverMonth, setHoverMonth] = useState<string | null>(null);

  if (months.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-muted-foreground">
        支出を記録すると、カテゴリ別の推移グラフが表示されます。
      </p>
    );
  }

  const breakdowns = months.map((m) => monthlyExpenseBreakdown(transactions, categories, m, topSlots));
  const maxTotal = Math.max(...breakdowns.map((b) => b.totalYen), 0);
  const tickStep = chooseTickStep(maxTotal);
  const tickValues: number[] = [];
  for (let v = 0; v <= maxTotal + tickStep * 0.001; v += tickStep) tickValues.push(v);

  const stackOrder = [...topSlots.map((s) => s.categoryId), OTHER_CATEGORY_ID];
  const colWidth = months.length === 1 ? CHART_W : CHART_W / months.length;
  const barWidth = Math.min(BAR_MAX_W, colWidth * 0.6);
  const yAt = (v: number) => (maxTotal > 0 ? PAD_TOP + CHART_H - (v / maxTotal) * CHART_H : PAD_TOP + CHART_H);
  const xCenterAt = (i: number) => PAD_LEFT + colWidth * i + colWidth / 2;

  const hovered = hoverMonth ? breakdowns.find((b) => b.month === hoverMonth) ?? null : null;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" onMouseLeave={() => setHoverMonth(null)}>
        {tickValues.map((v) => (
          <g key={v}>
            <line x1={PAD_LEFT} y1={yAt(v)} x2={WIDTH - PAD_RIGHT} y2={yAt(v)} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <text x={PAD_LEFT - 6} y={yAt(v) + 3} fontSize="9" textAnchor="end" className="fill-muted-foreground font-mono">
              {formatTickLabel(v)}
            </text>
          </g>
        ))}

        {breakdowns.map((b, i) => {
          const cx = xCenterAt(i);
          const x = cx - barWidth / 2;
          const isHovered = hoverMonth === b.month;
          const dimmed = hoverMonth !== null && !isHovered;
          const segments = stackOrder.reduce<{ categoryId: string; y0: number; y1: number; color: string; cumulative: number }[]>(
            (acc, categoryId) => {
              const share = b.shares.find((s) => s.categoryId === categoryId);
              if (!share || share.amountYen <= 0) return acc;
              const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
              const cumulative = prevCumulative + share.amountYen;
              const color = categoryId === OTHER_CATEGORY_ID ? OTHER_SLICE_COLOR : colorForCategoryId(categoryId, topSlots);
              acc.push({ categoryId, y0: yAt(prevCumulative), y1: yAt(cumulative), color, cumulative });
              return acc;
            },
            []
          );

          return (
            <g key={b.month} onMouseEnter={() => setHoverMonth(b.month)} className="cursor-pointer">
              {/* ホバー時の当たり判定を実際の棒より広くする(タップ操作でも当てやすくするため) */}
              <rect x={PAD_LEFT + colWidth * i} y={PAD_TOP} width={colWidth} height={CHART_H} fill="transparent" />
              {segments.map((seg, si) => {
                const isTop = si === segments.length - 1;
                const top = Math.min(seg.y0, seg.y1);
                const bottom = Math.max(seg.y0, seg.y1);
                const height = Math.max(bottom - top - SEGMENT_GAP, 0);
                if (!isTop) {
                  return (
                    <rect
                      key={seg.categoryId}
                      x={x}
                      y={top}
                      width={barWidth}
                      height={height}
                      fill={seg.color}
                      opacity={dimmed ? 0.35 : 1}
                    />
                  );
                }
                // 一番上の区分だけ4px丸めた「データの終端」にする(基準線側は角のまま)
                const r = Math.min(4, height / 2, barWidth / 2);
                const d = `M ${x} ${top + r}
                  A ${r} ${r} 0 0 1 ${x + r} ${top}
                  L ${x + barWidth - r} ${top}
                  A ${r} ${r} 0 0 1 ${x + barWidth} ${top + r}
                  L ${x + barWidth} ${top + height}
                  L ${x} ${top + height}
                  Z`;
                return <path key={seg.categoryId} d={d} fill={seg.color} opacity={dimmed ? 0.35 : 1} />;
              })}
              <text x={cx} y={HEIGHT - PAD_BOTTOM + 14} textAnchor="middle" fontSize="10" className="fill-muted-foreground font-mono">
                {formatMonthLabel(b.month)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        {[...topSlots, { categoryId: OTHER_CATEGORY_ID, label: OTHER_CATEGORY_LABEL }].map((slot) => (
          <span key={slot.categoryId} className="flex items-center gap-1">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: slot.categoryId === OTHER_CATEGORY_ID ? OTHER_SLICE_COLOR : colorForCategoryId(slot.categoryId, topSlots) }}
            />
            {slot.label}
          </span>
        ))}
      </div>

      <p className="min-h-4 text-center font-mono text-xs text-muted-foreground">
        {hovered
          ? `${formatMonthLabel(hovered.month)}の支出合計: ${formatYen(hovered.totalYen)}`
          : "棒グラフをなぞると各月の支出合計を確認できます"}
      </p>
    </div>
  );
}
