"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { actualAnnualRate, type Goal } from "@/lib/investmentTracker";

export function ActualReturnForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Goal["actual"];
  onSave: (actual: Goal["actual"]) => void;
  onCancel: () => void;
}) {
  const [principalMan, setPrincipalMan] = useState(
    initial.principalMan !== null ? String(initial.principalMan) : ""
  );
  const [currentValueMan, setCurrentValueMan] = useState(
    initial.currentValueMan !== null ? String(initial.currentValueMan) : ""
  );
  const [elapsedYears, setElapsedYears] = useState(
    initial.elapsedYears !== null ? String(initial.elapsedYears) : ""
  );

  const previewActual = useMemo(
    () => ({
      principalMan: principalMan === "" ? null : Number(principalMan),
      currentValueMan: currentValueMan === "" ? null : Number(currentValueMan),
      elapsedYears: elapsedYears === "" ? null : Number(elapsedYears),
    }),
    [principalMan, currentValueMan, elapsedYears]
  );
  const previewRate = actualAnnualRate(previewActual);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(previewActual);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-3"
    >
      <p className="text-xs text-muted-foreground">
        これまでに投資した元本と、現在の評価額を入れると実際の年利(運用成績)が分かります。
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-mono">投資元本(万円)</label>
          <input
            type="number"
            inputMode="decimal"
            value={principalMan}
            onChange={(e) => setPrincipalMan(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-mono">現在の評価額(万円)</label>
          <input
            type="number"
            inputMode="decimal"
            value={currentValueMan}
            onChange={(e) => setCurrentValueMan(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-mono">経過年数</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={elapsedYears}
            onChange={(e) => setElapsedYears(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-muted-foreground">実績年利</span>
        <span className={previewRate !== null && previewRate >= 0 ? "neon-text font-bold" : previewRate !== null ? "text-destructive font-bold" : "text-muted-foreground"}>
          {previewRate !== null ? `年利 ${previewRate.toFixed(1)}%` : "入力してください"}
        </span>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1">
          保存する
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          閉じる
        </Button>
      </div>
    </form>
  );
}
