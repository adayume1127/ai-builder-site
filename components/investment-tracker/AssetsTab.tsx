"use client";

import { useState } from "react";
import { AssetTrendChart } from "./AssetTrendChart";
import { PortfolioForm } from "./PortfolioForm";
import { PortfolioPieChart } from "./PortfolioPieChart";
import {
  emptyBreakdown,
  formatYen,
  latestSnapshot,
  snapshotTotals,
  type CategoryBreakdown,
  type ChartGranularity,
  type PortfolioSnapshot,
} from "@/lib/portfolio";

export function AssetsTab({
  snapshots,
  targetAmountYen,
  granularity,
  onSave,
  onSaveTarget,
  onChangeGranularity,
}: {
  snapshots: PortfolioSnapshot[];
  targetAmountYen: number;
  granularity: ChartGranularity;
  onSave: (breakdown: CategoryBreakdown) => void;
  onSaveTarget: (value: number) => void;
  onChangeGranularity: (granularity: ChartGranularity) => void;
}) {
  const latest = latestSnapshot(snapshots);
  const latestBreakdown = latest?.categories ?? emptyBreakdown();
  const latestTotal = latest ? snapshotTotals(latest).totalYen : 0;
  const [targetInput, setTargetInput] = useState(targetAmountYen ? String(targetAmountYen) : "");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">資産</h2>
        <p className="text-sm text-muted-foreground">
          国内株式・米国株式・投資信託・金銀プラチナの内訳を記録して、資産配分と推移を確認できます。
        </p>
      </div>

      <div className="gold-border rounded-2xl bg-white/5 p-4">
        <PortfolioPieChart breakdown={latestBreakdown} totalYen={latestTotal} />
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <label className="text-xs text-muted-foreground font-mono">シミュレーションの目標額(円)</label>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="例: 10000000"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
          />
          <button
            type="button"
            onClick={() => onSaveTarget(Number(targetInput) || 0)}
            className="shrink-0 rounded-lg gold-border gold-text px-3 py-1.5 font-mono text-xs"
          >
            設定
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          設定すると、下の資産推移グラフに目標額の線が表示されます。
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-sm text-muted-foreground">資産推移</h3>
        <AssetTrendChart
          snapshots={snapshots}
          targetAmountYen={targetAmountYen}
          granularity={granularity}
          onChangeGranularity={onChangeGranularity}
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-sm text-muted-foreground">内訳を入力</h3>
        <PortfolioForm initial={latestBreakdown} onSave={onSave} />
      </div>

      {snapshots.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-sm text-muted-foreground">記録の履歴</h3>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="px-3 py-2 text-left font-normal">日付</th>
                  <th className="px-3 py-2 text-right font-normal">資産合計</th>
                  <th className="px-3 py-2 text-right font-normal">評価損益</th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((s) => {
                  const { totalYen, profitYen } = snapshotTotals(s);
                  return (
                    <tr key={s.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2">{s.date}</td>
                      <td className="px-3 py-2 text-right">{formatYen(totalYen)}</td>
                      <td className={`px-3 py-2 text-right ${profitYen >= 0 ? "neon-text" : "text-destructive"}`}>
                        {profitYen >= 0 ? "+" : ""}
                        {formatYen(profitYen)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
