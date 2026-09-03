"use client";

import { useMemo, useState } from "react";
import { formatYen } from "@/lib/portfolio";
import type { SavingsTrendPoint } from "@/lib/household";

const WIDTH = 560;
const HEIGHT = 190;
const PAD_LEFT = 64;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 22;
const CHART_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_H = HEIGHT - PAD_TOP - PAD_BOTTOM;
const NEON_CYAN = "oklch(0.85 0.22 195)";
const NEG_COLOR = "oklch(0.75 0.2 20)";

const NICE_TICK_STEPS = [
  10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000, 2000000, 2500000, 5000000, 10000000,
];

function chooseTickStep(maxAbs: number): number {
  const target = Math.max(maxAbs, 1) / 4;
  for (const step of NICE_TICK_STEPS) {
    if (step >= target) return step;
  }
  return NICE_TICK_STEPS[NICE_TICK_STEPS.length - 1];
}

function formatTickLabel(v: number) {
  if (!Number.isFinite(v) || v === 0) return "0円";
  // 8桁以上の金額をそのまま表示するとY軸の左端でテキストが見切れるため、万円単位で短く表示する
  if (Math.abs(v) >= 10000) {
    return `${(v / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万円`;
  }
  return `${Math.round(v).toLocaleString("ja-JP")}円`;
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-");
  return `${y}/${Number(m)}`;
}

export function SavingsTrendChart({ points }: { points: SavingsTrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-muted-foreground">
        収入・支出を記録すると、収支の推移グラフが表示されます。
      </p>
    );
  }

  const values = points.map((p) => p.cumulativeSavingsYen);
  const maxV = Math.max(...values, 0);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;
  const tickStep = chooseTickStep(Math.max(Math.abs(maxV), Math.abs(minV)));

  const tickValues: number[] = [];
  const tickStart = Math.ceil(minV / tickStep) * tickStep;
  for (let v = tickStart; v <= maxV + tickStep * 0.001; v += tickStep) {
    tickValues.push(v);
  }

  const xAt = (i: number) => (points.length === 1 ? PAD_LEFT + CHART_W / 2 : PAD_LEFT + (i / (points.length - 1)) * CHART_W);
  const yAt = (v: number) => PAD_TOP + CHART_H - ((v - minV) / range) * CHART_H;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.cumulativeSavingsYen)}`).join(" ");
  const zeroY = yAt(0);
  const areaPath =
    points.length > 1 ? `${linePath} L ${xAt(points.length - 1)} ${zeroY} L ${xAt(0)} ${zeroY} Z` : "";

  const lastValue = values[values.length - 1];
  const lineColor = lastValue >= 0 ? NEON_CYAN : NEG_COLOR;

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(xAt(i) - relX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" onMouseLeave={() => setHoverIndex(null)}>
        {tickValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD_LEFT}
              y1={yAt(v)}
              x2={WIDTH - PAD_RIGHT}
              y2={yAt(v)}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 6} y={yAt(v) + 3} fontSize="9" textAnchor="end" className="fill-muted-foreground font-mono">
              {formatTickLabel(v)}
            </text>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill={lineColor} fillOpacity={0.12} />}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
        {points.length === 1 && <circle cx={xAt(0)} cy={yAt(values[0])} r={3} fill={lineColor} />}

        <text
          x={xAt(0)}
          y={HEIGHT - 4}
          fontSize="10"
          textAnchor={points.length === 1 ? "middle" : "start"}
          className="fill-muted-foreground font-mono"
        >
          {formatMonthLabel(points[0].month)}
        </text>
        {points.length > 1 && (
          <text x={xAt(points.length - 1)} y={HEIGHT - 4} fontSize="10" textAnchor="end" className="fill-muted-foreground font-mono">
            {formatMonthLabel(points[points.length - 1].month)}
          </text>
        )}

        {hovered && (
          <>
            <line
              x1={xAt(hoverIndex!)}
              y1={PAD_TOP}
              x2={xAt(hoverIndex!)}
              y2={PAD_TOP + CHART_H}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1}
            />
            <circle cx={xAt(hoverIndex!)} cy={yAt(hovered.cumulativeSavingsYen)} r={4} fill={lineColor} />
          </>
        )}

        <rect x={PAD_LEFT} y={0} width={CHART_W} height={HEIGHT} fill="transparent" onMouseMove={handleMove} />
      </svg>

      <p className="min-h-4 text-center font-mono text-xs text-muted-foreground">
        {hovered ? (
          <>
            {formatMonthLabel(hovered.month)}時点:{" "}
            <span className={hovered.cumulativeSavingsYen >= 0 ? "neon-text font-bold" : "text-destructive font-bold"}>
              {formatYen(hovered.cumulativeSavingsYen)}
            </span>
          </>
        ) : (
          "グラフをなぞると各月の収支を確認できます"
        )}
      </p>
    </div>
  );
}
