"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HouseholdProfile } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const GOAL_TYPES = ["生活防衛資金", "100万円", "旅行", "車", "住宅", "結婚", "教育", "FIRE / 資産形成", "その他", "特に決まっていない"];

export function GoalStep({
  value,
  onBack,
  onNext,
}: {
  value: HouseholdProfile["goal"];
  onBack: () => void;
  onNext: (goal: HouseholdProfile["goal"]) => void;
}) {
  const [type, setType] = useState(value?.type ?? "");
  const [targetAmount, setTargetAmount] = useState(value?.targetAmount ? String(value.targetAmount) : "");
  const [targetDate, setTargetDate] = useState(value?.targetDate ?? "");

  const noGoal = type === "特に決まっていない";

  function handleNext() {
    if (!type || noGoal) {
      onNext(undefined);
      return;
    }
    onNext({
      type,
      targetAmount: targetAmount ? Math.max(0, Number(targetAmount) || 0) : undefined,
      targetDate: targetDate || undefined,
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">今、目指したい貯金の目標はありますか?(任意)</p>

      <div className="grid grid-cols-2 gap-2">
        {GOAL_TYPES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setType(g)}
            className={`rounded-lg border px-3 py-2 text-left font-mono text-xs ${
              type === g ? "neon-border neon-text bg-white/5" : "border-white/15 text-muted-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {type && !noGoal && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">目標金額(円・任意)</label>
            <input
              type="number"
              inputMode="decimal"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="例: 1000000"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">目標期限(任意)</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          戻る
        </Button>
        <Button type="button" className="flex-1" onClick={handleNext}>
          次へ
        </Button>
      </div>
    </div>
  );
}
