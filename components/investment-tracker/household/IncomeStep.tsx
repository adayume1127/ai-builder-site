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
  mode,
  onNext,
}: {
  value: HouseholdProfile["income"];
  // "create"(新規診断)ではannualBonusの新規入力を受け付けない(bonusPaymentsに一本化する
  // legacy化方針)。"edit"(再診断)で既存プロファイルにannualBonus>0が残っている場合のみ、
  // 参考情報として表示し、bonusPaymentsへの移行を促す。
  mode: "create" | "edit";
  onNext: (income: HouseholdProfile["income"]) => void;
}) {
  const [monthlyTakeHome, setMonthlyTakeHome] = useState(value.monthlyTakeHome ? String(value.monthlyTakeHome) : "");
  const [otherMonthlyIncome, setOtherMonthlyIncome] = useState(
    value.otherMonthlyIncome ? String(value.otherMonthlyIncome) : ""
  );
  // annualBonusはlegacy field。新規入力欄は出さず、既存値をそのまま引き継ぐだけにする
  // (ユーザーがここで新しい値を入力・上書きする経路は用意しない)。
  const legacyAnnualBonus = value.annualBonus ?? 0;
  // 既存のannualBonusから自動生成はしない(支給月が分からないため)。ユーザーが手動で追加する。
  const [bonusPayments, setBonusPayments] = useState<BonusPaymentDraft[]>(toBonusPaymentDrafts(value.bonusPayments ?? []));
  // 複数行の年月+金額入力は最初のステップにしては重いため、既存データが無い限り
  // 初期状態では折りたたんでおく(GPTとのPDCA Cycle2)。
  const [showBonusSection, setShowBonusSection] = useState(bonusPayments.length > 0);

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
      annualBonus: legacyAnnualBonus, // このステップでは編集させない。既存値をそのまま引き継ぐ
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
      {mode === "edit" && legacyAnnualBonus > 0 && (
        <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="font-mono text-xs text-muted-foreground">
            以前の診断で登録した年間ボーナス: {legacyAnnualBonus.toLocaleString("ja-JP")}円(参考情報)
          </p>
          <p className="text-[10px] text-muted-foreground">
            この金額は現在の目標達成プランには反映されません。反映したい場合は、下の「ボーナスの支給予定」に
            支給年月と金額を登録してください。
          </p>
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        {showBonusSection ? (
          <>
            <label className="font-mono text-xs text-muted-foreground">ボーナスの支給予定(任意)</label>
            <p className="text-[10px] text-muted-foreground">
              支給予定の年月と金額を登録すると、貯金目標の「目標達成プラン」に反映できます
              (毎月の生活費計算には含めません)。
            </p>
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
          </>
        ) : (
          <>
            <label className="font-mono text-xs text-muted-foreground">ボーナスの予定はありますか？(任意)</label>
            <p className="text-[10px] text-muted-foreground">
              目標の計画をより正確にできます。あとからでも登録できるので、今は飛ばしても大丈夫です。
            </p>
            <button
              type="button"
              onClick={() => setShowBonusSection(true)}
              className="w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
            >
              + ボーナス予定を登録する
            </button>
          </>
        )}
      </div>

      <Button type="button" className="w-full" onClick={handleNext}>
        次へ
      </Button>
    </div>
  );
}
