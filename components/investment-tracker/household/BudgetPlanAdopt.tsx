"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/portfolio";
import { LunaCoach } from "../LunaCoach";
import type { MonthlyBudget, RecommendedMonthlyBudget } from "@/lib/monthlyBudget";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

type DraftKey = keyof RecommendedMonthlyBudget;

const FIELD_LABELS: { key: DraftKey; label: string }[] = [
  { key: "totalIncome", label: "今月の収入" },
  { key: "plannedFixedExpenses", label: "固定費" },
  { key: "plannedCashSavings", label: "現金貯金の予定額" },
  { key: "plannedInvestment", label: "投資の予定額" },
  { key: "specialExpenseReserve", label: "特別費の確保額" },
];

function toDraft(source: RecommendedMonthlyBudget): Record<DraftKey, string> {
  return {
    totalIncome: String(source.totalIncome),
    plannedFixedExpenses: String(source.plannedFixedExpenses),
    plannedCashSavings: String(source.plannedCashSavings),
    plannedInvestment: String(source.plannedInvestment),
    specialExpenseReserve: String(source.specialExpenseReserve),
    discretionaryFloor: String(source.discretionaryFloor),
  };
}

export function BudgetPlanAdopt({
  variant,
  diagnosisRecommendation,
  previousBudget,
  onAdopt,
}: {
  variant: "initial" | "rollover";
  diagnosisRecommendation: RecommendedMonthlyBudget;
  previousBudget: MonthlyBudget | null;
  onAdopt: (values: RecommendedMonthlyBudget) => void;
}) {
  const baseline = previousBudget ?? diagnosisRecommendation;
  const [showEditor, setShowEditor] = useState(variant === "initial");
  const [draft, setDraft] = useState<Record<DraftKey, string>>(() => toDraft(baseline));

  function resetTo(source: RecommendedMonthlyBudget) {
    setDraft(toDraft(source));
    setShowEditor(true);
  }

  function handleAdopt() {
    onAdopt({
      totalIncome: Number(draft.totalIncome) || 0,
      plannedFixedExpenses: Number(draft.plannedFixedExpenses) || 0,
      plannedCashSavings: Number(draft.plannedCashSavings) || 0,
      plannedInvestment: Number(draft.plannedInvestment) || 0,
      specialExpenseReserve: Number(draft.specialExpenseReserve) || 0,
      discretionaryFloor: diagnosisRecommendation.discretionaryFloor,
    });
  }

  const monthlySpendable =
    (Number(draft.totalIncome) || 0) -
    (Number(draft.plannedFixedExpenses) || 0) -
    (Number(draft.plannedCashSavings) || 0) -
    (Number(draft.plannedInvestment) || 0) -
    (Number(draft.specialExpenseReserve) || 0);

  return (
    <div className="space-y-4">
      <LunaCoach
        variant="cheer"
        message={
          variant === "initial"
            ? "診断おつかれさま！このおすすめプランで今月を始めてみよう。もちろん、あとから金額は自由に調整できるよ。"
            : "新しい月が始まったね。先月の予算を引き継ぐか、調整するか選んでね。"
        }
      />

      {variant === "rollover" && (
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(toDraft(baseline));
              setShowEditor(false);
            }}
            className="rounded-xl border border-white/15 px-4 py-3 text-left font-mono text-sm text-muted-foreground hover:bg-white/5"
          >
            先月と同じ予算で始める
          </button>
          <button
            type="button"
            onClick={() => resetTo(previousBudget ?? diagnosisRecommendation)}
            className="rounded-xl border border-white/15 px-4 py-3 text-left font-mono text-sm text-muted-foreground hover:bg-white/5"
          >
            予算を調整する
          </button>
          <button
            type="button"
            onClick={() => resetTo(diagnosisRecommendation)}
            className="rounded-xl border border-white/15 px-4 py-3 text-left font-mono text-sm text-muted-foreground hover:bg-white/5"
          >
            家計診断のおすすめ額に戻す
          </button>
        </div>
      )}

      {showEditor && (
        <div className="space-y-3 rounded-xl gold-border bg-white/5 p-4">
          <h3 className="gold-text font-mono text-sm font-bold">
            {variant === "initial" ? "Lunaのおすすめプラン" : "今月の予算"}
          </h3>
          <div className="space-y-2">
            {FIELD_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <label className="shrink-0 font-mono text-xs text-muted-foreground">{label}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={draft[key]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-xs">
            <span className="text-muted-foreground">今月あと使えるお金(自由費込み)</span>
            <span className={`font-bold ${monthlySpendable >= 0 ? "gold-text" : "text-destructive"}`}>
              {formatYen(monthlySpendable)}
            </span>
          </div>
        </div>
      )}

      <Button type="button" className="w-full" onClick={handleAdopt}>
        このプランで今月を始める
      </Button>
    </div>
  );
}
