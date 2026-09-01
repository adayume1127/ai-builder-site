// 家計簿タブの「標準生活費学習・カテゴリ予算提案」機能(Phase5 Step4)。
// 過去の実績から「無理のない予算」を学習し、ユーザーに"提案"するだけ。
// 自動でBudgetCategory.monthlyBudgetYenやHouseholdProfileを書き換えることは絶対にしない
// (採用ボタンを押して初めて、既存のsetCategoryBudget()経由でそのカテゴリの予算が更新される)。
//
// 節約を強制するための機能ではない。実績が予算より継続して高いカテゴリには
// 「無理のない額まで予算を引き上げる」提案だけを行い、実績が低いカテゴリを
// 積極的に切り詰めさせる提案はしない(単に使っていないだけかもしれないため)。

import { categoryNature, categoryTotalsForMonth, type BudgetCategory, type BudgetTransaction } from "@/lib/household";
import { actualVariableExpenses } from "@/lib/monthlyReview";

// 予算改善提案のバッファ率。学習した実績値そのままではなく、少し余裕を持たせる。
export const CATEGORY_BUDGET_BUFFER_RATE = 0.05;

// 「継続した傾向」とみなすために必要な最低実績月数。1ヶ月(1回)だけの超過/未達では提案しない。
const MIN_MONTHS_FOR_TREND = 2;
// 継続傾向を判定する際に見る直近の月数(それより古いデータは傾向判定に使わない)
const TREND_WINDOW_MONTHS = 3;
// 学習(標準額算出)に使う直近の月数の上限
const BASELINE_WINDOW_MONTHS = 6;
// 実績が予算のこの割合以下なら「明らかに使っていない」とみなす
const UNDER_USE_RATIO = 0.5;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// 5%バッファ適用後の金額を、円単位で不自然にならないよう丸める。
// 金額の大きさに応じて丸め幅を変える(小さいカテゴリを100円単位、中規模は1000円単位、大きいものは5000円単位)。
export function roundToNiceYen(amount: number): number {
  if (amount < 10000) return Math.round(amount / 100) * 100;
  if (amount < 100000) return Math.round(amount / 1000) * 1000;
  return Math.round(amount / 5000) * 5000;
}

function categoryActualForMonth(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string, categoryId: string): number {
  return categoryTotalsForMonth(transactions, categories, month).find((t) => t.category.id === categoryId)?.totalYen ?? 0;
}

// 標準生活費(変動費全体)。1ヶ月ならそのまま、2ヶ月なら平均、3ヶ月以上なら直近最大6ヶ月の中央値(外れ値の影響を減らす)。
// completedMonthsDescは新しい順(lib/monthlyReview.ts の completedMonths() の戻り値を渡す想定)。
export function baselineLivingCost(
  completedMonthsDesc: string[],
  transactions: BudgetTransaction[],
  categories: BudgetCategory[]
): number | null {
  if (completedMonthsDesc.length === 0) return null;
  if (completedMonthsDesc.length === 1) {
    return actualVariableExpenses(transactions, categories, completedMonthsDesc[0]);
  }
  const window = completedMonthsDesc.slice(0, completedMonthsDesc.length >= 3 ? BASELINE_WINDOW_MONTHS : 2);
  const values = window.map((m) => actualVariableExpenses(transactions, categories, m));
  return Math.round(window.length >= 3 ? median(values) : average(values));
}

// カテゴリの「無理のない予算額」の学習値(バッファ込み)。suggestBudgetAdjustments()の内部でも使う。
export function suggestedCategoryBudget(
  categoryId: string,
  completedMonthsDesc: string[],
  transactions: BudgetTransaction[],
  categories: BudgetCategory[]
): { typicalActual: number; suggestedBudget: number } | null {
  if (completedMonthsDesc.length < MIN_MONTHS_FOR_TREND) return null;
  const window = completedMonthsDesc.slice(0, completedMonthsDesc.length >= 3 ? BASELINE_WINDOW_MONTHS : 2);
  const actuals = window.map((m) => categoryActualForMonth(transactions, categories, m, categoryId));
  const typicalActual = Math.round(window.length >= 3 ? median(actuals) : average(actuals));
  const suggestedBudget = roundToNiceYen(typicalActual * (1 + CATEGORY_BUDGET_BUFFER_RATE));
  return { typicalActual, suggestedBudget };
}

export type BudgetAdjustmentReason = "consistent_over" | "consistent_under";

export type BudgetAdjustmentSuggestion = {
  categoryId: string;
  categoryLabel: string;
  currentBudget: number;
  typicalActual: number; // 直近の「だいたいこのくらい」の実績額(バッファ適用前)
  suggestedBudget: number; // 採用時に反映する額。consistent_underはcurrentBudgetと同値(変更を積極提案しない)
  reason: BudgetAdjustmentReason;
  recentActuals: number[]; // 直近(最大TREND_WINDOW_MONTHS件)の実績、新しい順
};

// 変動費カテゴリのうち、月間予算が設定されているものだけを対象に、継続した傾向がある場合のみ提案を返す。
// - 直近2〜3ヶ月のうち2ヶ月以上が予算超過 → 「予算を引き上げる」提案(consistent_over)
// - 直近の実績が全期間UNDER_USE_RATIO以下 → 数値変更は提案せず、情報提供のみ(consistent_under)
// - どちらでもない、またはデータが1ヶ月分しかない場合は提案しない
export function suggestBudgetAdjustments(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  completedMonthsDesc: string[]
): BudgetAdjustmentSuggestion[] {
  if (completedMonthsDesc.length < MIN_MONTHS_FOR_TREND) return [];

  const budgetedCategories = categories.filter(
    (c) => c.kind === "expense" && categoryNature(c) === "variable" && (c.monthlyBudgetYen ?? 0) > 0
  );

  const suggestions: BudgetAdjustmentSuggestion[] = [];

  for (const category of budgetedCategories) {
    const budget = category.monthlyBudgetYen!;
    const windowMonths = completedMonthsDesc.slice(0, TREND_WINDOW_MONTHS);
    const actuals = windowMonths.map((m) => categoryActualForMonth(transactions, categories, m, category.id));

    const overCount = actuals.filter((a) => a > budget).length;
    const underCount = actuals.filter((a) => a <= budget * UNDER_USE_RATIO).length;

    if (overCount >= MIN_MONTHS_FOR_TREND) {
      const learned = suggestedCategoryBudget(category.id, completedMonthsDesc, transactions, categories);
      if (!learned) continue;
      suggestions.push({
        categoryId: category.id,
        categoryLabel: category.label,
        currentBudget: budget,
        typicalActual: learned.typicalActual,
        suggestedBudget: learned.suggestedBudget,
        reason: "consistent_over",
        recentActuals: actuals,
      });
    } else if (underCount >= MIN_MONTHS_FOR_TREND && underCount === actuals.length) {
      // 全期間で明らかに未達。単に使っていないだけの可能性があるため、数値変更は提案しない(情報提供のみ)。
      suggestions.push({
        categoryId: category.id,
        categoryLabel: category.label,
        currentBudget: budget,
        typicalActual: Math.round(average(actuals)),
        suggestedBudget: budget,
        reason: "consistent_under",
        recentActuals: actuals,
      });
    }
  }

  return suggestions;
}
