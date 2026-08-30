"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ASSET_CATEGORIES, formatYen, type AssetCategoryKey, type CategoryBreakdown } from "@/lib/portfolio";

export function PortfolioForm({
  initial,
  onSave,
}: {
  initial: CategoryBreakdown;
  onSave: (breakdown: CategoryBreakdown) => void;
}) {
  const [values, setValues] = useState<Record<AssetCategoryKey, { current: string; profit: string }>>(() => {
    const init = {} as Record<AssetCategoryKey, { current: string; profit: string }>;
    for (const cat of ASSET_CATEGORIES) {
      init[cat.key] = {
        current: initial[cat.key].currentValueYen ? String(initial[cat.key].currentValueYen) : "",
        profit: initial[cat.key].profitYen ? String(initial[cat.key].profitYen) : "",
      };
    }
    return init;
  });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const breakdown = useMemo<CategoryBreakdown>(() => {
    const b = {} as CategoryBreakdown;
    for (const cat of ASSET_CATEGORIES) {
      b[cat.key] = {
        currentValueYen: Number(values[cat.key].current) || 0,
        profitYen: Number(values[cat.key].profit) || 0,
      };
    }
    return b;
  }, [values]);

  const totalYen = ASSET_CATEGORIES.reduce((sum, cat) => sum + breakdown[cat.key].currentValueYen, 0);
  const profitYen = ASSET_CATEGORIES.reduce((sum, cat) => sum + breakdown[cat.key].profitYen, 0);

  function setField(key: AssetCategoryKey, field: "current" | "profit", v: string) {
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [field]: v } }));
    setSavedAt(null);
  }

  function handleSave() {
    onSave(breakdown);
    setSavedAt(Date.now());
  }

  return (
    <div className="space-y-4">
      {ASSET_CATEGORIES.map((cat) => (
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
