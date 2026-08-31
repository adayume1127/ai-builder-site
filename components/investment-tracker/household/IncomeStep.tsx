"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HouseholdProfile } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

export function IncomeStep({
  value,
  onNext,
}: {
  value: HouseholdProfile["income"];
  onNext: (income: HouseholdProfile["income"]) => void;
}) {
  const [monthlyTakeHome, setMonthlyTakeHome] = useState(value.monthlyTakeHome ? String(value.monthlyTakeHome) : "");
  const [otherMonthlyIncome, setOtherMonthlyIncome] = useState(
    value.otherMonthlyIncome ? String(value.otherMonthlyIncome) : ""
  );
  const [annualBonus, setAnnualBonus] = useState(value.annualBonus ? String(value.annualBonus) : "");

  function handleNext() {
    onNext({
      monthlyTakeHome: Math.max(0, Number(monthlyTakeHome) || 0),
      otherMonthlyIncome: Math.max(0, Number(otherMonthlyIncome) || 0),
      annualBonus: Math.max(0, Number(annualBonus) || 0),
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground">手取り月収(円)</label>
        <input
          type="number"
          inputMode="decimal"
          value={monthlyTakeHome}
          onChange={(e) => setMonthlyTakeHome(e.target.value)}
          placeholder="例: 250000"
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground">その他の月収(円・任意)</label>
        <input
          type="number"
          inputMode="decimal"
          value={otherMonthlyIncome}
          onChange={(e) => setOtherMonthlyIncome(e.target.value)}
          placeholder="副業収入など"
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground">年間ボーナス(円・任意)</label>
        <input
          type="number"
          inputMode="decimal"
          value={annualBonus}
          onChange={(e) => setAnnualBonus(e.target.value)}
          placeholder="例: 600000"
          className={inputClass}
        />
        <p className="text-[10px] text-muted-foreground">
          ボーナスは毎月の生活費計算には含めません。特別費や大きな買い物の原資として別枠で考えます。
        </p>
      </div>

      <Button type="button" className="w-full" onClick={handleNext}>
        次へ
      </Button>
    </div>
  );
}
