"use client";

import { useMemo, useState } from "react";
import {
  GRANULARITY_LABELS,
  bucketSnapshotsByGranularity,
  formatYen,
  simulateGrowth,
  snapshotTotals,
  type ChartGranularity,
  type PortfolioSnapshot,
} from "@/lib/portfolio";

const GRANULARITY_OPTIONS: ChartGranularity[] = ["month", "halfYear", "year"];

const WIDTH = 560;
const HEIGHT = 210;
const PAD_LEFT = 64;
const PAD_RIGHT = 8;
const PAD_TOP = 20;
const PAD_BOTTOM = 24;
const CHART_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_H = HEIGHT - PAD_TOP - PAD_BOTTOM;
const NEON_CYAN = "oklch(0.85 0.22 195)";
const SIM_COLOR = "#eda100"; // ゴールド系。実績(シアン)と区別できる暖色

// 目盛りの間隔を50万・100万円単位を中心とした「きりのいい」数値に丸める
const NICE_TICK_STEPS = [
  100000, 200000, 250000, 500000, 1000000, 2000000, 2500000, 5000000, 10000000, 20000000, 25000000, 50000000,
  100000000, 200000000, 250000000, 500000000, 1000000000,
];

function chooseTickStep(maxValue: number): number {
  const target = Math.max(maxValue, 1) / 5;
  for (const step of NICE_TICK_STEPS) {
    if (step >= target) return step;
  }
  return NICE_TICK_STEPS[NICE_TICK_STEPS.length - 1];
}

function formatTickLabel(v: number) {
  if (v === 0) return "0円";
  return `${Math.round(v).toLocaleString("ja-JP")}円`;
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}/${Number(m)}/${Number(d)}`;
}

function toTime(dateStr: string) {
  return new Date(dateStr).getTime();
}

export function AssetTrendChart({
  snapshots,
  targetAmountYen,
  granularity,
  onChangeGranularity,
}: {
  snapshots: PortfolioSnapshot[];
  targetAmountYen: number;
  granularity: ChartGranularity;
  onChangeGranularity: (granularity: ChartGranularity) => void;
}) {
  const [simulationOn, setSimulationOn] = useState(true);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const actualPoints = useMemo(
    () =>
      bucketSnapshotsByGranularity(snapshots, granularity).map((s) => ({
        date: s.date,
        valueYen: snapshotTotals(s).totalYen,
      })),
    [snapshots, granularity]
  );
  const simPoints = useMemo(
    () => (simulationOn ? simulateGrowth(snapshots, targetAmountYen, granularity) : []),
    [snapshots, targetAmountYen, simulationOn, granularity]
  );

  if (actualPoints.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-xs text-muted-foreground">
        資産を記録すると、資産推移グラフが表示されます。
      </p>
    );
  }

  const allTimes = [
    ...actualPoints.map((p) => toTime(p.date)),
    ...simPoints.map((p) => toTime(p.date)),
  ];
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const timeRange = maxTime - minTime || 1;

  const allValues = [
    ...actualPoints.map((p) => p.valueYen),
    ...simPoints.map((p) => p.valueYen),
    ...(targetAmountYen > 0 ? [targetAmountYen] : []),
  ];
  const maxV = Math.max(...allValues, 0);
  const minV = Math.min(...allValues, 0);
  const range = maxV - minV || 1;

  const tickStep = chooseTickStep(maxV - minV);
  const tickValues: number[] = [];
  const tickStart = Math.ceil(minV / tickStep) * tickStep;
  for (let v = tickStart; v <= maxV + tickStep * 0.001; v += tickStep) {
    tickValues.push(v);
  }

  const xAtTime = (t: number) => PAD_LEFT + ((t - minTime) / timeRange) * CHART_W;
  const yAt = (v: number) => PAD_TOP + CHART_H - ((v - minV) / range) * CHART_H;

  const actualLinePath = actualPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAtTime(toTime(p.date))} ${yAt(p.valueYen)}`)
    .join(" ");
  const actualAreaPath =
    actualPoints.length > 1
      ? `${actualLinePath} L ${xAtTime(toTime(actualPoints[actualPoints.length - 1].date))} ${PAD_TOP + CHART_H} L ${xAtTime(toTime(actualPoints[0].date))} ${PAD_TOP + CHART_H} Z`
      : "";
  const simLinePath = simPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAtTime(toTime(p.date))} ${yAt(p.valueYen)}`)
    .join(" ");

  function findNearest<T extends { date: string }>(points: T[], hoverTime: number): T | null {
    if (points.length === 0) return null;
    let nearest = points[0];
    let best = Math.abs(toTime(nearest.date) - hoverTime);
    for (const p of points) {
      const d = Math.abs(toTime(p.date) - hoverTime);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    return nearest;
  }

  const hoverTime = hoverX !== null ? minTime + ((hoverX - PAD_LEFT) / CHART_W) * timeRange : null;
  const hoveredActual = hoverTime !== null ? findNearest(actualPoints, hoverTime) : null;
  const hoveredSim = hoverTime !== null && simulationOn ? findNearest(simPoints, hoverTime) : null;

  function handleMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    setHoverX(Math.min(WIDTH - PAD_RIGHT, Math.max(PAD_LEFT, relX)));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NEON_CYAN }} />
            実績
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SIM_COLOR }} />
            シミュレーション(年利5%)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSimulationOn((v) => !v)}
          className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
            simulationOn ? "gold-border gold-text" : "border border-white/15 text-muted-foreground"
          }`}
        >
          シミュレーション {simulationOn ? "ON" : "OFF"}
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">表示単位</span>
        {GRANULARITY_OPTIONS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChangeGranularity(g)}
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] transition-colors ${
              granularity === g
                ? "neon-border neon-text"
                : "border border-white/15 text-muted-foreground"
            }`}
          >
            {GRANULARITY_LABELS[g]}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseLeave={() => setHoverX(null)}
      >
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
            <text
              x={PAD_LEFT - 6}
              y={yAt(v) + 3}
              fontSize="9"
              textAnchor="end"
              className="fill-muted-foreground font-mono"
            >
              {formatTickLabel(v)}
            </text>
          </g>
        ))}

        {targetAmountYen > 0 && (
          <>
            <line
              x1={PAD_LEFT}
              y1={yAt(targetAmountYen)}
              x2={WIDTH - PAD_RIGHT}
              y2={yAt(targetAmountYen)}
              stroke="#FFD700"
              strokeOpacity={0.6}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text x={WIDTH - PAD_RIGHT} y={yAt(targetAmountYen) - 4} fontSize="9" textAnchor="end" fill="#FFD700">
              目標額 {formatYen(targetAmountYen)}
            </text>
          </>
        )}

        {simulationOn && simPoints.length > 1 && (
          <path
            d={simLinePath}
            fill="none"
            stroke={SIM_COLOR}
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
        )}

        {actualAreaPath && <path d={actualAreaPath} fill={NEON_CYAN} fillOpacity={0.12} />}
        <path d={actualLinePath} fill="none" stroke={NEON_CYAN} strokeWidth={2} strokeLinejoin="round" />
        {actualPoints.length === 1 && (
          <circle cx={xAtTime(toTime(actualPoints[0].date))} cy={yAt(actualPoints[0].valueYen)} r={3} fill={NEON_CYAN} />
        )}

        <text x={xAtTime(minTime)} y={HEIGHT - 6} fontSize="10" className="fill-muted-foreground font-mono">
          {formatDateLabel(actualPoints[0].date)}
        </text>
        <text
          x={xAtTime(maxTime)}
          y={HEIGHT - 6}
          fontSize="10"
          textAnchor="end"
          className="fill-muted-foreground font-mono"
        >
          {formatDateLabel(
            simulationOn && simPoints.length > 0
              ? simPoints[simPoints.length - 1].date
              : actualPoints[actualPoints.length - 1].date
          )}
        </text>

        {hoverTime !== null && (
          <line
            x1={hoverX!}
            y1={PAD_TOP}
            x2={hoverX!}
            y2={PAD_TOP + CHART_H}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
          />
        )}
        {hoveredActual && (
          <circle
            cx={xAtTime(toTime(hoveredActual.date))}
            cy={yAt(hoveredActual.valueYen)}
            r={4}
            fill={NEON_CYAN}
          />
        )}
        {hoveredSim && (
          <circle cx={xAtTime(toTime(hoveredSim.date))} cy={yAt(hoveredSim.valueYen)} r={4} fill={SIM_COLOR} />
        )}

        <rect x={PAD_LEFT} y={0} width={CHART_W} height={HEIGHT} fill="transparent" onMouseMove={handleMove} />
      </svg>

      <div className="min-h-10 space-y-0.5 text-center font-mono text-xs">
        {hoveredActual || hoveredSim ? (
          <>
            {hoveredActual && (
              <p className="text-muted-foreground">
                実績({formatDateLabel(hoveredActual.date)}):{" "}
                <span className="neon-text font-bold">{formatYen(hoveredActual.valueYen)}</span>
              </p>
            )}
            {hoveredSim && (
              <p className="text-muted-foreground">
                シミュレーション({formatDateLabel(hoveredSim.date)}):{" "}
                <span className="font-bold" style={{ color: SIM_COLOR }}>
                  {formatYen(hoveredSim.valueYen)}
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground/60">グラフをなぞると各時点の資産額を確認できます</p>
        )}
      </div>

      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        ※ シミュレーションは、初回記録時点の資産額と直近の毎月積立額をもとに、あくまで年利5%で運用できた場合の試算です。
        <br />
        必ずこの通りになるというものではありません。
      </p>
    </div>
  );
}
