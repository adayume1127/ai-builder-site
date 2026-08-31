"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/portfolio";
import {
  apportionVariableExpenses,
  provisionalVariableExpenses,
  type DataConfidenceState,
  type HouseholdProfile,
} from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

type Mode = HouseholdProfile["livingExpenseMode"];

const MODE_LABELS: Record<Mode, string> = {
  detailed: "詳しく分かる",
  totalOnly: "総額だけ分かる",
  unknown: "よく分からない",
};

const DETAILED_FIELDS: { key: keyof HouseholdProfile["baselineVariableExpenses"]; label: string }[] = [
  { key: "food", label: "食費" },
  { key: "dailyGoods", label: "日用品" },
  { key: "transportation", label: "交通費" },
  { key: "dining", label: "外食" },
  { key: "entertainment", label: "趣味 / 娯楽" },
  { key: "beauty", label: "美容 / 衣服" },
  { key: "social", label: "交際費" },
  { key: "other", label: "その他" },
];

export function LivingExpenseStep({
  mode,
  value,
  income,
  onBack,
  onNext,
}: {
  mode: Mode;
  value: HouseholdProfile["baselineVariableExpenses"];
  income: number;
  onBack: () => void;
  onNext: (mode: Mode, expenses: HouseholdProfile["baselineVariableExpenses"], confidence: DataConfidenceState) => void;
}) {
  const [localMode, setLocalMode] = useState<Mode>(mode);
  const [detailedValues, setDetailedValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(DETAILED_FIELDS.map((f) => [f.key, value[f.key] ? String(value[f.key]) : ""]))
  );
  const [totalInput, setTotalInput] = useState("");

  const detailedTotal = DETAILED_FIELDS.reduce((sum, f) => sum + (Number(detailedValues[f.key]) || 0), 0);

  function setDetailedField(key: string, v: string) {
    setDetailedValues((prev) => ({ ...prev, [key]: v }));
  }

  function handleNext() {
    if (localMode === "detailed") {
      const expenses = Object.fromEntries(
        DETAILED_FIELDS.map((f) => [f.key, Math.max(0, Number(detailedValues[f.key]) || 0)])
      ) as HouseholdProfile["baselineVariableExpenses"];
      onNext("detailed", expenses, "confirmed");
    } else if (localMode === "totalOnly") {
      const expenses = apportionVariableExpenses(Math.max(0, Number(totalInput) || 0));
      onNext("totalOnly", expenses, "estimated");
    } else {
      const expenses = provisionalVariableExpenses({ income: { monthlyTakeHome: income, otherMonthlyIncome: 0, annualBonus: 0 } } as HouseholdProfile);
      onNext("unknown", expenses, "unknown");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        毎月の生活費(食費・日用品・交通費など)は、どのくらい把握できていますか?
      </p>

      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setLocalMode(m)}
            className={`rounded-xl border px-4 py-3 text-left font-mono text-sm transition-colors ${
              localMode === m ? "neon-border neon-text bg-white/5" : "border-white/15 text-muted-foreground"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {localMode === "detailed" && (
        <div className="space-y-3">
          <div className="gold-border rounded-xl bg-white/5 p-3 text-center font-mono">
            <p className="text-[10px] text-muted-foreground">生活費合計</p>
            <p className="gold-text text-sm font-bold">{formatYen(detailedTotal)}</p>
          </div>
          {DETAILED_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground">{f.label}(円)</label>
              <input
                type="number"
                inputMode="decimal"
                value={detailedValues[f.key]}
                onChange={(e) => setDetailedField(f.key, e.target.value)}
                placeholder="任意"
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {localMode === "totalOnly" && (
        <div className="space-y-1">
          <label className="font-mono text-xs text-muted-foreground">月間生活費の総額(円)</label>
          <input
            type="number"
            inputMode="decimal"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            placeholder="例: 70000"
            className={inputClass}
          />
          <p className="text-[10px] text-muted-foreground">
            カテゴリ別の内訳は、一般的な支出配分をもとに仮に計算します。記録が増えると実績に合わせて調整を提案します。
          </p>
        </div>
      )}

      {localMode === "unknown" && (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">
          入力は不要です。まずは仮の生活費で診断を始めましょう。この場合、診断結果は「仮診断」として表示され、記録が増えるほど精度が上がっていきます。
        </p>
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
