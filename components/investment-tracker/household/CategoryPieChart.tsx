"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import { monthlyExpenseBreakdown, type CategorySlot } from "@/lib/categoryBreakdown";
import type { BudgetCategory, BudgetTransaction } from "@/lib/household";
import { colorForCategoryId } from "./categoryChartPalette";

const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER_R = 88;
const INNER_R = 54;
const GAP_PX = 2;

function pointAt(r: number, angle: number) {
  return { x: CENTER + r * Math.sin(angle), y: CENTER - r * Math.cos(angle) };
}

// ドーナツの1区分ぶんのpathを作る。区分どうしの間は色を塗った境界線ではなく
// 背景色の2pxギャップで区切る(dataviz原則: マークを分けるのは枠線ではなく余白)。
function donutSlicePath(startAngle: number, endAngle: number): string | null {
  const gapAngle = GAP_PX / OUTER_R;
  const s = startAngle + gapAngle / 2;
  const e = endAngle - gapAngle / 2;
  if (e - s <= 0.01) return null;
  const largeArc = e - s > Math.PI ? 1 : 0;
  const startOuter = pointAt(OUTER_R, s);
  const endOuter = pointAt(OUTER_R, e);
  const startInner = pointAt(INNER_R, e);
  const endInner = pointAt(INNER_R, s);
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

// 1ヶ月分の支出をカテゴリ別ドーナツ円グラフで見える化する。月は‹/›で切り替えられる
// (デフォルトは最新月)。上位カテゴリ以外は「その他」に集約する(MAX_CATEGORY_SLICES)。
export function CategoryPieChart({
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
  const [monthIndex, setMonthIndex] = useState(months.length - 1);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  if (months.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-muted-foreground">
        支出を記録すると、カテゴリ別の円グラフが表示されます。
      </p>
    );
  }

  const month = months[Math.max(0, Math.min(monthIndex, months.length - 1))];
  const breakdown = monthlyExpenseBreakdown(transactions, categories, month, topSlots);

  const slices = breakdown.shares.reduce<{ share: (typeof breakdown.shares)[number]; startAngle: number; endAngle: number; color: string }[]>(
    (acc, s) => {
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
      const endAngle = prevEnd + s.ratio * Math.PI * 2;
      acc.push({ share: s, startAngle: prevEnd, endAngle, color: colorForCategoryId(s.categoryId, topSlots) });
      return acc;
    },
    []
  );

  const highlighted = highlightId ? breakdown.shares.find((s) => s.categoryId === highlightId) ?? null : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between font-mono text-xs">
        <button
          type="button"
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
          disabled={monthIndex <= 0}
          className="px-2 text-muted-foreground disabled:opacity-30"
          aria-label="前の月"
        >
          ‹
        </button>
        <span className="text-foreground/90">{formatMonthLabel(month)}の支出内訳</span>
        <button
          type="button"
          onClick={() => setMonthIndex((i) => Math.min(months.length - 1, i + 1))}
          disabled={monthIndex >= months.length - 1}
          className="px-2 text-muted-foreground disabled:opacity-30"
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      {breakdown.shares.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-muted-foreground">
          この月は支出の記録がありません。
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full max-w-[220px]"
            onMouseLeave={() => setHighlightId(null)}
          >
            {slices.map(({ share, startAngle, endAngle, color }) => {
              const d = donutSlicePath(startAngle, endAngle);
              if (!d) return null;
              const dimmed = highlightId !== null && highlightId !== share.categoryId;
              return (
                <path
                  key={share.categoryId}
                  d={d}
                  fill={color}
                  opacity={dimmed ? 0.35 : 1}
                  onMouseEnter={() => setHighlightId(share.categoryId)}
                  onClick={() => setHighlightId(share.categoryId)}
                  className="cursor-pointer"
                />
              );
            })}
            <text x={CENTER} y={CENTER - 6} textAnchor="middle" fontSize="9" className="fill-muted-foreground font-mono">
              月間支出
            </text>
            <text x={CENTER} y={CENTER + 12} textAnchor="middle" fontSize="15" className="fill-foreground font-mono font-bold">
              {formatYen(breakdown.totalYen)}
            </text>
          </svg>

          <div className="w-full space-y-1">
            {breakdown.shares.map((s) => {
              const color = colorForCategoryId(s.categoryId, topSlots);
              const dimmed = highlightId !== null && highlightId !== s.categoryId;
              return (
                <button
                  key={s.categoryId}
                  type="button"
                  onClick={() => setHighlightId(s.categoryId)}
                  onMouseEnter={() => setHighlightId(s.categoryId)}
                  onMouseLeave={() => setHighlightId(null)}
                  className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left font-mono text-xs transition-opacity ${
                    dimmed ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="flex-1 truncate text-muted-foreground">{s.label}</span>
                  <span className="shrink-0 text-foreground/90">{formatYen(s.amountYen)}</span>
                  <span className="w-9 shrink-0 text-right text-muted-foreground">{Math.round(s.ratio * 100)}%</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="min-h-4 text-center font-mono text-xs text-muted-foreground">
        {highlighted
          ? `${highlighted.label}: ${formatYen(highlighted.amountYen)}(${Math.round(highlighted.ratio * 100)}%)`
          : "グラフやカテゴリをタップすると内訳を確認できます"}
      </p>
    </div>
  );
}
