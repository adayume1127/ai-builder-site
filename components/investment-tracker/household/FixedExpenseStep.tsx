"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/portfolio";
import type { HouseholdProfile } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const FIELDS: { key: keyof HouseholdProfile["fixedExpenses"]; label: string; placeholder: string }[] = [
  { key: "housing", label: "家賃 / 住宅ローン", placeholder: "例: 80000" },
  { key: "utilities", label: "水道光熱費", placeholder: "例: 12000" },
  { key: "communication", label: "通信費", placeholder: "例: 8000" },
  { key: "insurance", label: "保険", placeholder: "例: 10000" },
  { key: "car", label: "車 / 駐車場", placeholder: "なければ0円でOK" },
  { key: "loans", label: "ローン / 奨学金", placeholder: "なければ0円でOK" },
  { key: "subscriptions", label: "サブスク", placeholder: "例: 3000" },
  { key: "other", label: "その他固定費", placeholder: "任意" },
];

export function FixedExpenseStep({
  value,
  income,
  onBack,
  onNext,
}: {
  value: HouseholdProfile["fixedExpenses"];
  income: number;
  onBack: () => void;
  onNext: (fixedExpenses: HouseholdProfile["fixedExpenses"]) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, value[f.key] ? String(value[f.key]) : ""]))
  );

  const parsed = Object.fromEntries(FIELDS.map((f) => [f.key, Math.max(0, Number(values[f.key]) || 0)]));
  const total = FIELDS.reduce((sum, f) => sum + parsed[f.key], 0);
  const fixedRate = income > 0 ? total / income : 0;
  const housingRate = income > 0 ? parsed.housing / income : 0;

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function handleNext() {
    onNext(parsed as HouseholdProfile["fixedExpenses"]);
  }

  return (
    <div className="space-y-4">
      <div className="gold-border grid grid-cols-3 gap-2 rounded-xl bg-white/5 p-3 text-center font-mono">
        <div>
          <p className="text-[10px] text-muted-foreground">固定費合計</p>
          <p className="gold-text text-sm font-bold">{formatYen(total)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">固定費率</p>
          <p className="text-sm font-bold">{Math.round(fixedRate * 100)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">住居費率</p>
          <p className="text-sm font-bold">{Math.round(housingRate * 100)}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">{f.label}(円)</label>
            <input
              type="number"
              inputMode="decimal"
              value={values[f.key]}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              className={inputClass}
            />
          </div>
        ))}
      </div>

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
