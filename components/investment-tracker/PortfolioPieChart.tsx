"use client";

import { formatMan } from "@/lib/investmentTracker";
import { ASSET_CATEGORIES, type CategoryBreakdown } from "@/lib/portfolio";

const SIZE = 200;
const CENTER = SIZE / 2;
const R_OUTER = 88;
const R_INNER = 54;
const PAD_ANGLE = 0.035; // ラジアン。セグメント間の2px相当のギャップ

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function donutSegmentPath(startAngle: number, endAngle: number) {
  const s = startAngle + PAD_ANGLE / 2;
  const e = endAngle - PAD_ANGLE / 2;
  if (e <= s) return "";
  const largeArc = e - s > Math.PI ? 1 : 0;

  const outerStart = polarToCartesian(CENTER, CENTER, R_OUTER, s);
  const outerEnd = polarToCartesian(CENTER, CENTER, R_OUTER, e);
  const innerStart = polarToCartesian(CENTER, CENTER, R_INNER, e);
  const innerEnd = polarToCartesian(CENTER, CENTER, R_INNER, s);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export function PortfolioPieChart({
  breakdown,
  totalMan,
}: {
  breakdown: CategoryBreakdown;
  totalMan: number;
}) {
  const hasData = totalMan > 0;
  let cursor = -Math.PI / 2; // 12時方向から開始

  const segments = ASSET_CATEGORIES.map((cat) => {
    const value = Math.max(0, breakdown[cat.key].currentValueMan);
    const ratio = hasData ? value / totalMan : 0;
    const startAngle = cursor;
    const endAngle = cursor + ratio * Math.PI * 2;
    cursor = endAngle;
    return { cat, value, ratio, startAngle, endAngle };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="shrink-0">
        {!hasData ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={(R_OUTER + R_INNER) / 2}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={R_OUTER - R_INNER}
          />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <path key={s.cat.key} d={donutSegmentPath(s.startAngle, s.endAngle)} fill={s.cat.color} />
            ))
        )}
        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          className="fill-muted-foreground font-mono"
          fontSize="10"
        >
          資産合計
        </text>
        <text x={CENTER} y={CENTER + 14} textAnchor="middle" className="fill-current font-mono font-bold" fontSize="18">
          {hasData ? formatMan(totalMan) : "未記録"}
        </text>
      </svg>

      <div className="w-full min-w-0 flex-1 space-y-1.5 font-mono text-xs">
        {segments.map((s) => (
          <div key={s.cat.key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.cat.color }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.cat.label}</span>
            <span className="shrink-0">{formatMan(s.value)}</span>
            <span className="w-10 shrink-0 text-right text-muted-foreground">
              {hasData ? `${Math.round(s.ratio * 100)}%` : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
