// 「今日のアクション」カード(Phase7a)。既存の判定関数(monthlyBudget/household)が
// すでに算出した結果を受け取り、今ユーザーが完了できる行動を1件だけ選ぶ、決定論的な
// ルールベースの集約層。lib/householdGuidance.ts(「困ったらここ」ボタン)と設計思想は
// 同じだが役割が異なる: Guidanceは「状況の説明」、Actionは「ユーザーが今日ボタンを押す・
// 金額を決める・支出を抑えるなど、具体的に完了できるものだけ」に絞る。
//
// 重要な制約:
// - ここで新しい家計判断・計算式を導入しない(householdGuidance.tsと同じ方針)。
// - 赤字の間は先取り貯金アクションを出さない(赤字なのに貯金を促すのは矛盾するため)。
// - AIによる文章生成は行わない。事前に決めた文言の出し分けのみ。

import { formatYen } from "@/lib/portfolio";
import type { CashSavingsActionStatus } from "@/lib/monthlyActionState";

export type TodayActionReason = "deficit_notice" | "over_budget_category" | "cash_savings_pending" | "on_track";

export type TodayAction = {
  reason: TodayActionReason;
  headline: string;
  detail: string;
  // reason === "cash_savings_pending" のときだけ意味を持つ、提案金額(MonthlyBudget.plannedCashSavings)
  cashSavingsSuggestedAmount: number | null;
};

export type TodayActionInput = {
  remainingSpendable: number; // 今月あと使えるお金(HouseholdDashboardSummary.remainingSpendable)
  // 変動費カテゴリのうち最も超過額が大きい1件。無ければnull。
  mostOverBudgetCategory: { label: string; overAmountYen: number } | null;
  plannedCashSavings: number; // MonthlyBudget.plannedCashSavings
  cashSavingsStatus: CashSavingsActionStatus | null; // MonthlyActionStateが無い月はnull(pending扱い)
};

export function buildTodayAction(input: TodayActionInput): TodayAction {
  if (input.remainingSpendable < 0) {
    return {
      reason: "deficit_notice",
      headline: "今月は予算より支出が多くなる見込みです。",
      detail: "まずは支出の見直しから。詳しくは「困ったらここ」で確認できます。",
      cashSavingsSuggestedAmount: null,
    };
  }

  if (input.mostOverBudgetCategory) {
    return {
      reason: "over_budget_category",
      headline: `${input.mostOverBudgetCategory.label}が予算を${formatYen(input.mostOverBudgetCategory.overAmountYen)}超えています。`,
      detail: `今月全体ではあと${formatYen(input.remainingSpendable)}使えます。${input.mostOverBudgetCategory.label}の追加支出を抑えましょう。`,
      cashSavingsSuggestedAmount: null,
    };
  }

  const cashSavingsStatus = input.cashSavingsStatus ?? "pending";
  if (input.plannedCashSavings > 0 && cashSavingsStatus === "pending") {
    return {
      reason: "cash_savings_pending",
      headline: `今月の先取り貯金 ${formatYen(input.plannedCashSavings)}を確保しましょう。`,
      detail: "確保できたら「実行した」を押してください。金額の変更や見送りも選べます。",
      cashSavingsSuggestedAmount: input.plannedCashSavings,
    };
  }

  return {
    reason: "on_track",
    headline: "今日、特にやることはありません。",
    detail: "このまま記録を続けましょう。",
    cashSavingsSuggestedAmount: null,
  };
}
