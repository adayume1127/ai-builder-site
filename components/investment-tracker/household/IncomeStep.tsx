"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BonusPayment, HouseholdProfile } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

type BonusPaymentDraft = { month: string; amount: string };

function toBonusPaymentDrafts(payments: BonusPayment[]): BonusPaymentDraft[] {
  return payments.map((p) => ({ month: p.month, amount: String(p.expectedAmountYen) }));
}

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
  // 既存のannualBonusから自動生成はしない(支給月が分からないため)。ユーザーが手動で追加する。
  const [bonusPayments, setBonusPayments] = useState<BonusPaymentDraft[]>(toBonusPaymentDrafts(value.bonusPayments ?? []));

  function addBonusPayment() {
    setBonusPayments((prev) => [...prev, { month: "", amount: "" }]);
  }

  function updateBonusPayment(index: number, field: "month" | "amount", v: string) {
    setBonusPayments((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: v } : p)));
  }

  function removeBonusPayment(index: number) {
    setBonusPayments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNext() {
    // month未入力または金額が不正な行は保存しない。同じ年月の重複は許可し合算しない
    // (賞与+業績賞与など複数回に分けて把握したい場合をそのまま残す)。
    const validPayments: BonusPayment[] = bonusPayments
      .filter((p) => /^\d{4}-\d{2}$/.test(p.month) && Number.isFinite(Number(p.amount)) && Number(p.amount) > 0)
      .map((p) => ({ month: p.month, expectedAmountYen: Math.max(0, Number(p.amount)) }));

    onNext({
      monthlyTakeHome: Math.max(0, Number(monthlyTakeHome) || 0),
      otherMonthlyIncome: Math.max(0, Number(otherMonthlyIncome) || 0),
      annualBonus: Math.max(0, Number(annualBonus) || 0),
      bonusPayments: validPayments,
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

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <label className="font-mono text-xs text-muted-foreground">ボーナスの支給予定(任意)</label>
        {Number(annualBonus) > 0 && bonusPayments.length === 0 && (
          <p className="text-[10px] text-muted-foreground">
            年間ボーナス{Number(annualBonus).toLocaleString("ja-JP")}円が登録されています。支給予定月を入力すると、
            目標達成プランに反映できます。
          </p>
        )}
        {bonusPayments.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="month"
              value={p.month}
              onChange={(e) => updateBonusPayment(i, "month", e.target.value)}
              className={`${inputClass} py-1.5 text-xs`}
              aria-label="支給予定年月"
            />
            <input
              type="number"
              inputMode="decimal"
              value={p.amount}
              onChange={(e) => updateBonusPayment(i, "amount", e.target.value)}
              placeholder="金額(円)"
              className={`${inputClass} py-1.5 text-xs`}
              aria-label="支給予定額"
            />
            <button
              type="button"
              onClick={() => removeBonusPayment(i)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="この支給予定を削除"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBonusPayment}
          className="w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
        >
          + 支給予定を追加
        </button>
      </div>

      <Button type="button" className="w-full" onClick={handleNext}>
        次へ
      </Button>
    </div>
  );
}
