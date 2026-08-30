"use client";

import { AssetTrendChart } from "./AssetTrendChart";
import { PortfolioForm } from "./PortfolioForm";
import { PortfolioPieChart } from "./PortfolioPieChart";
import { formatMan } from "@/lib/investmentTracker";
import {
  emptyBreakdown,
  latestSnapshot,
  snapshotTotals,
  type CategoryBreakdown,
  type PortfolioSnapshot,
} from "@/lib/portfolio";

export function AssetsTab({
  snapshots,
  onSave,
}: {
  snapshots: PortfolioSnapshot[];
  onSave: (breakdown: CategoryBreakdown) => void;
}) {
  const latest = latestSnapshot(snapshots);
  const latestBreakdown = latest?.categories ?? emptyBreakdown();
  const latestTotal = latest ? snapshotTotals(latest).totalMan : 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">資産</h2>
        <p className="text-sm text-muted-foreground">
          国内株式・米国株式・投資信託・金銀プラチナの内訳を記録して、資産配分と推移を確認できます。
        </p>
      </div>

      <div className="gold-border rounded-2xl bg-white/5 p-4">
        <PortfolioPieChart breakdown={latestBreakdown} totalMan={latestTotal} />
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-sm text-muted-foreground">資産推移</h3>
        <AssetTrendChart snapshots={snapshots} />
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
                  const { totalMan, profitMan } = snapshotTotals(s);
                  return (
                    <tr key={s.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2">{s.date}</td>
                      <td className="px-3 py-2 text-right">{formatMan(totalMan)}</td>
                      <td className={`px-3 py-2 text-right ${profitMan >= 0 ? "neon-text" : "text-destructive"}`}>
                        {profitMan >= 0 ? "+" : ""}
                        {formatMan(profitMan)}
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
