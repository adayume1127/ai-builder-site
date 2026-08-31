"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HouseholdProfile } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const EMERGENCY_OPTIONS: HouseholdProfile["emergencyFundMonths"][] = [3, 6, 12];

export function SavingsStep({
  value,
  emergencyFundMonths,
  onBack,
  onNext,
}: {
  value: HouseholdProfile["savings"];
  emergencyFundMonths: HouseholdProfile["emergencyFundMonths"];
  onBack: () => void;
  onNext: (savings: HouseholdProfile["savings"], emergencyFundMonths: HouseholdProfile["emergencyFundMonths"]) => void;
}) {
  const [cashSavingsBalance, setCashSavingsBalance] = useState(
    value.cashSavingsBalance ? String(value.cashSavingsBalance) : ""
  );
  const [monthlyCashSavings, setMonthlyCashSavings] = useState(
    value.monthlyCashSavings ? String(value.monthlyCashSavings) : ""
  );
  const [monthlyInvestment, setMonthlyInvestment] = useState(
    value.monthlyInvestment ? String(value.monthlyInvestment) : ""
  );
  const [otherSavings, setOtherSavings] = useState(value.otherSavings ? String(value.otherSavings) : "");
  const [months, setMonths] = useState(emergencyFundMonths);

  function handleNext() {
    onNext(
      {
        cashSavingsBalance: Math.max(0, Number(cashSavingsBalance) || 0),
        monthlyCashSavings: Math.max(0, Number(monthlyCashSavings) || 0),
        monthlyInvestment: Math.max(0, Number(monthlyInvestment) || 0),
        otherSavings: Math.max(0, Number(otherSavings) || 0),
      },
      months
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground">現在の現金貯金(円)</label>
        <input
          type="number"
          inputMode="decimal"
          value={cashSavingsBalance}
          onChange={(e) => setCashSavingsBalance(e.target.value)}
          placeholder="例: 500000"
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground">毎月している現金貯金(円)</label>
        <input
          type="number"
          inputMode="decimal"
          value={monthlyCashSavings}
          onChange={(e) => setMonthlyCashSavings(e.target.value)}
          placeholder="なければ0円でOK"
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground">毎月している投資(円)</label>
        <input
          type="number"
          inputMode="decimal"
          value={monthlyInvestment}
          onChange={(e) => setMonthlyInvestment(e.target.value)}
          placeholder="なければ0円でOK"
          className={inputClass}
        />
        <p className="text-[10px] text-muted-foreground">現金貯金と投資は別のものとして扱います。</p>
      </div>
      <div className="space-y-1">
        <label className="font-mono text-xs text-muted-foreground">その他積立(円・任意)</label>
        <input
          type="number"
          inputMode="decimal"
          value={otherSavings}
          onChange={(e) => setOtherSavings(e.target.value)}
          placeholder="財形貯蓄など"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-xs text-muted-foreground">生活防衛資金の目標(何ヶ月分の生活費を備えるか)</label>
        <div className="flex gap-2">
          {EMERGENCY_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`flex-1 rounded-lg px-3 py-2 font-mono text-sm ${
                months === m ? "neon-border neon-text" : "border border-white/15 text-muted-foreground"
              }`}
            >
              {m}ヶ月
            </button>
          ))}
        </div>
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
