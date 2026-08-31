"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ASSET_CATEGORIES,
  MANUAL_ASSET_CATEGORIES,
  formatYen,
  type CategoryBreakdown,
  type CategoryEntry,
  type ManualAssetCategoryKey,
} from "@/lib/portfolio";

type FieldValues = { current: string; profit: string; monthly: string };
type ManualCategoryKey = ManualAssetCategoryKey;

export function PortfolioForm({
  initial,
  cashCategory,
  onSave,
}: {
  initial: CategoryBreakdown;
  cashCategory: CategoryEntry;
  onSave: (breakdown: CategoryBreakdown) => void;
}) {
  const [values, setValues] = useState<Record<ManualCategoryKey, FieldValues>>(() => {
    const init = {} as Record<ManualCategoryKey, FieldValues>;
    for (const cat of MANUAL_ASSET_CATEGORIES) {
      init[cat.key] = {
        current: initial[cat.key].currentValueYen ? String(initial[cat.key].currentValueYen) : "",
        profit: initial[cat.key].profitYen ? String(initial[cat.key].profitYen) : "",
        monthly: initial[cat.key].monthlyContributionYen ? String(initial[cat.key].monthlyContributionYen) : "",
      };
    }
    return init;
  });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const breakdown = useMemo<CategoryBreakdown>(() => {
    const b = { cashSavings: cashCategory } as CategoryBreakdown;
    for (const cat of MANUAL_ASSET_CATEGORIES) {
      b[cat.key] = {
        currentValueYen: Number(values[cat.key].current) || 0,
        profitYen: Number(values[cat.key].profit) || 0,
        monthlyContributionYen: Number(values[cat.key].monthly) || 0,
      };
    }
    return b;
  }, [values, cashCategory]);

  const totalYen = ASSET_CATEGORIES.reduce((sum, cat) => sum + breakdown[cat.key].currentValueYen, 0);
  const profitYen = ASSET_CATEGORIES.reduce((sum, cat) => sum + breakdown[cat.key].profitYen, 0);
  const monthlyTotalYen = ASSET_CATEGORIES.reduce((sum, cat) => sum + breakdown[cat.key].monthlyContributionYen, 0);

  function setField(key: ManualCategoryKey, field: keyof FieldValues, v: string) {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [field]: v } }));
    setSavedAt(null);
  }

  function handleSave() {
    onSave(breakdown);
    setSavedAt(Date.now());
  }

  const cashCategoryDef = ASSET_CATEGORIES.find((c) => c.key === "cashSavings")!;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cashCategoryDef.color }} />
          {cashCategoryDef.label}
        </div>
        <div className="flex items-center justify-between font-mono text-sm">
          <span className="text-xs text-muted-foreground">現在の金額(円)</span>
          <span className="font-bold">{formatYen(cashCategory.currentValueYen)}</span>
        </div>
        <div className="flex items-center justify-between font-mono text-sm">
          <span className="text-xs text-muted-foreground">今月の積立(円)</span>
          <span className="font-bold">{formatYen(cashCategory.monthlyContributionYen)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          家計簿タブの収入・支出の記録から自動計算されます(手入力不要)。
        </p>
      </div>

      {MANUAL_ASSET_CATEGORIES.map((cat) => (
        <div key={cat.key} className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
            {cat.label}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-mono">現在の金額(円)</label>
              <input
                type="number"
                inputMode="decimal"
                value={values[cat.key].current}
                onChange={(e) => setField(cat.key, "current", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-mono">含み損益(円)</label>
              <input
                type="number"
                inputMode="decimal"
                value={values[cat.key].profit}
                onChange={(e) => setField(cat.key, "profit", e.target.value)}
                placeholder="マイナスも入力可"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-mono">毎月の積立額(円)</label>
            <input
              type="number"
              inputMode="decimal"
              value={values[cat.key].monthly}
              onChange={(e) => setField(cat.key, "monthly", e.target.value)}
              placeholder="例: 100000"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
            />
          </div>
        </div>
      ))}

      <div className="space-y-1.5 rounded-xl gold-border bg-white/5 p-3 font-mono text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">資産合計額</span>
          <span className="gold-text text-lg font-bold">{formatYen(totalYen)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">評価損益</span>
          <span className={profitYen >= 0 ? "neon-text font-bold" : "text-destructive font-bold"}>
            {profitYen >= 0 ? "+" : ""}
            {formatYen(profitYen)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">毎月の積立合計</span>
          <span className="neon-text-pink font-bold">{formatYen(monthlyTotalYen)}</span>
        </div>
      </div>

      <Button type="button" className="w-full" onClick={handleSave}>
        今日の記録として保存する
      </Button>
      {savedAt && (
        <p className="text-center text-xs neon-text">保存しました。1ヶ月後などに同じように入力すると推移がわかります。</p>
      )}
    </div>
  );
}
