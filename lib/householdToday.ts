// 「今日やること」判定(常時表示のコンパクトCTAと「今日」タブの両方から使う共通ロジック)。
// タブの表示/非表示に関わらず同じ入力から同じ結果を計算する(表示先が2箇所になっても
// 判定ロジック自体は1箇所に保つ)。

import { categoryBudgetStatusForMonth, categoryNature, type BudgetCategory, type BudgetTransaction } from "@/lib/household";
import type { HouseholdDashboardSummary } from "@/lib/monthlyBudget";
import type { CashSavingsActionStatus } from "@/lib/monthlyActionState";
import { buildTodayAction, type TodayAction } from "@/lib/todayAction";

// remainingSpendableが、今月使ってよい総額(monthlySpendableBudget)のこの割合を下回ったら「少なくなってきた」と案内する。
// spec上の明示的な閾値指定は無いため、独自の目安として採用。
const LOW_REMAINING_RATE = 0.15;

export type LunaDashboardMessage = { variant: "watch" | "cheer" | "celebrate"; message: string };

export function lunaDashboardMessage(summary: HouseholdDashboardSummary, overBudgetCategoryCount: number): LunaDashboardMessage {
  if (summary.remainingSpendable < 0) {
    return {
      variant: "watch",
      message: "このペースだと少し赤字になりそう。大きめの支出がないか確認してみよう。",
    };
  }
  if (summary.monthlySpendableBudget > 0 && summary.remainingSpendable < summary.monthlySpendableBudget * LOW_REMAINING_RATE) {
    return {
      variant: "watch",
      message: "今月あと使える金額が少なくなってきたよ。残りの日数を見ながら調整しよう。",
    };
  }
  if (overBudgetCategoryCount > 0) {
    return {
      variant: "cheer",
      message: "予算をオーバーしているカテゴリがあるけど、家計全体ではまだ予算内だよ。",
    };
  }
  return { variant: "cheer", message: "いいペース。このままなら今月も余裕を残せそう。" };
}

export function computeHouseholdToday(
  summary: HouseholdDashboardSummary,
  categories: BudgetCategory[],
  transactions: BudgetTransaction[],
  month: string,
  cashSavingsStatus: CashSavingsActionStatus | null
): {
  todayAction: TodayAction;
  luna: LunaDashboardMessage;
  overBudgetCount: number;
  variableBudgetStatuses: ReturnType<typeof categoryBudgetStatusForMonth>;
} {
  const variableBudgetStatuses = categoryBudgetStatusForMonth(transactions, categories, month).filter(
    (b) => categoryNature(b.category) === "variable"
  );
  const overBudgetCount = variableBudgetStatuses.filter((b) => b.overBudget).length;
  const luna = lunaDashboardMessage(summary, overBudgetCount);

  // 最も超過額が大きい変動費カテゴリを1件だけ選ぶ(buildTodayActionは判断ロジックを持たず、
  // ここで用意した材料から1件選ぶだけ)。
  const mostOverBudget = [...variableBudgetStatuses]
    .filter((b) => b.overBudget)
    .sort((a, b) => b.spentYen - b.budgetYen - (a.spentYen - a.budgetYen))[0];
  const todayAction = buildTodayAction({
    remainingSpendable: summary.remainingSpendable,
    mostOverBudgetCategory: mostOverBudget
      ? { label: mostOverBudget.category.label, overAmountYen: mostOverBudget.spentYen - mostOverBudget.budgetYen }
      : null,
    plannedCashSavings: summary.plannedCashSavings,
    cashSavingsStatus,
  });

  return { todayAction, luna, overBudgetCount, variableBudgetStatuses };
}
