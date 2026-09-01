"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/portfolio";
import { LunaCoach } from "../LunaCoach";
import type { MonthlyBudget, RecommendedMonthlyBudget } from "@/lib/monthlyBudget";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

type DraftKey = keyof RecommendedMonthlyBudget;
type Variant = "initial" | "rollover" | "edit";

const FIELD_LABELS: { key: DraftKey; label: string }[] = [
  { key: "totalIncome", label: "今月の収入" },
  { key: "plannedFixedExpenses", label: "固定費" },
  { key: "plannedCashSavings", label: "現金貯金の予定額" },
  { key: "plannedInvestment", label: "投資の予定額" },
  { key: "specialExpenseReserve", label: "特別費の確保額" },
];

const CTA_LABEL: Record<Variant, string> = {
  initial: "このプランで今月を始める",
  rollover: "この内容で今月を始める",
  edit: "この内容で更新する",
};

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

// previousBudget: rolloverは「前月のMonthlyBudget」、editは「編集対象=今月すでに採用済みのMonthlyBudget」。
// どちらの場合も、採用/更新はここから新しい値を作るだけで、previousBudget自体は書き換えない
// (呼び出し側のonAdoptが月キー付きで別レコードとして保存/上書きする)。
export function BudgetPlanAdopt({
  variant,
  diagnosisRecommendation,
  previousBudget,
  onAdopt,
}: {
  variant: Variant;
  diagnosisRecommendation: RecommendedMonthlyBudget;
  previousBudget: MonthlyBudget | null;
  onAdopt: (values: RecommendedMonthlyBudget) => void;
}) {
  const baseline = previousBudget ?? diagnosisRecommendation;
  const [showEditor, setShowEditor] = useState(variant !== "rollover");
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
      {variant !== "edit" && (
        <LunaCoach
          variant="cheer"
          message={
            variant === "initial"
              ? "診断おつかれさま!このおすすめプランで今月を始めてみよう。もちろん、あとから金額は自由に調整できるよ。"
              : `🌙 新しい月が始まったね。${previousBudget ? `先月(${previousBudget.month})の予算を引き継ぐか、調整するか選んでね。` : "予算を決めて今月を始めよう。"}`
          }
        />
      )}

      {variant === "edit" && (
        <p className="text-center text-xs text-muted-foreground">
          今月すでに採用したプランです。金額を変更しても、家計診断の基本設定(収入・固定費などの申告値)は変わりません。
        </p>
      )}

      {variant === "rollover" && (
        <div className="space-y-2">
          <p className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center font-mono text-xs text-muted-foreground">
            🌙 新しい月(今月)の予算がまだありません。前月のMonthlyBudgetは変更せず、今月用に新しく作成します。
          </p>
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
              家計診断から見直す(おすすめ額に戻す)
            </button>
          </div>
        </div>
      )}

      {variant === "edit" && (
        <button
          type="button"
          onClick={() => resetTo(diagnosisRecommendation)}
          className="w-full rounded-lg border border-white/15 px-3 py-2 text-center font-mono text-xs text-muted-foreground hover:bg-white/5"
        >
          家計診断のおすすめ額に戻す
        </button>
      )}

      {showEditor && (
        <div className="space-y-3 rounded-xl gold-border bg-white/5 p-4">
          <h3 className="gold-text font-mono text-sm font-bold">
            {variant === "initial" ? "Lunaのおすすめプラン" : variant === "edit" ? "今月の予算を編集" : "今月の予算"}
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
        {CTA_LABEL[variant]}
      </Button>
    </div>
  );
}
