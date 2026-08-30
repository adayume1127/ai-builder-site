"use client";

import { useState } from "react";
import { formatYen, snapshotTotals, type PortfolioSnapshot } from "@/lib/portfolio";

const WIDTH = 560;
const HEIGHT = 180;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;
const CHART_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_H = HEIGHT - PAD_TOP - PAD_BOTTOM;
const NEON_CYAN = "oklch(0.85 0.22 195)";

function formatDateLabel(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function AssetTrendChart({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (snapshots.length < 2) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-muted-foreground">
        記録が2件以上になると、資産推移グラフが表示されます。
      </p>
    );
  }

  const points = snapshots.map((s) => ({ date: s.date, totalYen: snapshotTotals(s).totalYen }));
  const values = points.map((p) => p.totalYen);
  const maxV = Math.max(...values, 0);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const xAt = (i: number) => PAD_LEFT + (i / (points.length - 1)) * CHART_W;
  const yAt = (v: number) => PAD_TOP + CHART_H - ((v - minV) / range) * CHART_H;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.totalYen)}`).join(" ");
  const areaPath = `${linePath} L ${xAt(points.length - 1)} ${PAD_TOP + CHART_H} L ${xAt(0)} ${PAD_TOP + CHART_H} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (relX - PAD_LEFT) / CHART_W));
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIndex(idx);
  }

  return (
    <div className="space-y-1">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PAD_LEFT}
          y1={yAt(Math.max(minV, 0))}
          x2={WIDTH - PAD_RIGHT}
          y2={yAt(Math.max(minV, 0))}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
        />
        <path d={areaPath} fill={NEON_CYAN} fillOpacity={0.12} />
        <path d={linePath} fill="none" stroke={NEON_CYAN} strokeWidth={2} strokeLinejoin="round" />

        <text x={xAt(0)} y={HEIGHT - 6} fontSize="10" className="fill-muted-foreground font-mono">
          {formatDateLabel(points[0].date)}
        </text>
        <text
          x={xAt(points.length - 1)}
          y={HEIGHT - 6}
          fontSize="10"
          textAnchor="end"
          className="fill-muted-foreground font-mono"
        >
          {formatDateLabel(points[points.length - 1].date)}
        </text>

        {hovered && hoverIndex !== null && (
          <>
            <line
              x1={xAt(hoverIndex)}
              y1={PAD_TOP}
              x2={xAt(hoverIndex)}
              y2={PAD_TOP + CHART_H}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1}
            />
            <circle cx={xAt(hoverIndex)} cy={yAt(hovered.totalYen)} r={4} fill={NEON_CYAN} />
          </>
        )}

        <rect
          x={PAD_LEFT}
          y={0}
          width={CHART_W}
          height={HEIGHT}
          fill="transparent"
          onMouseMove={handleMove}
        />
      </svg>
      <div className="flex h-5 items-center justify-center font-mono text-xs">
        {hovered ? (
          <span className="text-muted-foreground">
            {formatDateLabel(hovered.date)}: <span className="neon-text font-bold">{formatYen(hovered.totalYen)}</span>
          </span>
        ) : (
          <span className="text-muted-foreground/60">グラフをなぞると各時点の資産額を確認できます</span>
        )}
      </div>
    </div>
  );
}
