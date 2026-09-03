"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HouseholdProfile } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const EMERGENCY_OPTIONS: { months: HouseholdProfile["emergencyFundMonths"]; note: string }[] = [
  { months: 3, note: "まずはここから(初期設定)" },
  { months: 6, note: "もう少し余裕を持って備えたい場合" },
  { months: 12, note: "収入の変動などに備えて、厚めに確保したい場合" },
];

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

      <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <label className="font-mono text-xs text-muted-foreground">もしものためのお金(生活防衛資金)</label>
        <p className="text-[10px] text-muted-foreground">
          病気や仕事が変わったときなど、収入が減っても、しばらく生活できるように残しておく貯金です。
          何ヶ月分の生活費を目安に貯めておきたいか選んでください。迷ったら、まず3ヶ月分から設定できます。あとから変更できます。
        </p>
        <div className="space-y-1.5 pt-1">
          {EMERGENCY_OPTIONS.map((o) => (
            <button
              key={o.months}
              type="button"
              onClick={() => setMonths(o.months)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-mono text-sm ${
                months === o.months ? "neon-border neon-text" : "border border-white/15 text-muted-foreground"
              }`}
            >
              <span>{o.months}ヶ月分</span>
              <span className="text-[10px]">{o.note}</span>
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
