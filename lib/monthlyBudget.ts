// 家計簿タブの「今月の予算(MonthlyBudget)」— 家計診断(lib/householdDiagnosis.ts)が出す推奨プランと、
// 実際にユーザーが採用・編集した今月の実行計画を分離するためのレイヤー。
// HouseholdProfile = 診断の入力値、MonthlyBudget = 今月ユーザーが採用した計画、
// BudgetTransaction(lib/household.ts) = 実際の収支記録、の3つを混同しない。
// すべて「円」単位・決定論的な計算のみ(AIによる金額推定は行わない)。

import {
  categoryNature,
  categoryTotalsForMonth,
  type BudgetCategory,
  type BudgetTransaction,
} from "@/lib/household";
import {
  availableForSavings,
  computeSavingsPlans,
  discretionaryFloor as diagnosisDiscretionaryFloor,
  fixedExpensesTotal,
  monthlySpecialExpenseReserve,
  recommendationMode,
  totalIncome as diagnosisTotalIncome,
  type HouseholdProfile,
  type SpecialExpense,
  type SpecialExpenseMode,
} from "@/lib/householdDiagnosis";

// ===== 型 =====

export type MonthlyBudget = {
  month: string; // YYYY-MM
  totalIncome: number;
  plannedFixedExpenses: number;
  plannedCashSavings: number;
  plannedInvestment: number;
  specialExpenseReserve: number;
  discretionaryFloor: number;
  createdAt: string;
  updatedAt: string;
};

export type HouseholdDashboardSummary = {
  monthlySpendableBudget: number;
  actualFlexibleSpending: number;
  remainingSpendable: number;
  plannedCashSavings: number;
  plannedInvestment: number;
  specialExpenseReserve: number;
  actualSpecialExpenses: number;
  specialExpenseOverage: number;
  remainingSpecialExpenseReserve: number;
  budgetUsageRate: number;
  monthProgressRate: number;
  projectedMonthEndBalance: number;
};

// ===== localStorage保存 =====

const MONTHLY_BUDGETS_KEY = "investment-tracker:household-diagnosis:monthly-budget:v1";

export function loadMonthlyBudgets(): MonthlyBudget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MONTHLY_BUDGETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMonthlyBudgets(budgets: MonthlyBudget[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MONTHLY_BUDGETS_KEY, JSON.stringify(budgets));
  } catch {
    // 保存できない場合は諦める
  }
}

export function getMonthlyBudget(budgets: MonthlyBudget[], month: string): MonthlyBudget | null {
  return budgets.find((b) => b.month === month) ?? null;
}

export function upsertMonthlyBudget(budgets: MonthlyBudget[], budget: MonthlyBudget): MonthlyBudget[] {
  const idx = budgets.findIndex((b) => b.month === budget.month);
  if (idx === -1) return [...budgets, budget];
  const next = [...budgets];
  next[idx] = budget;
  return next;
}

// 直近(月が一番新しい)のMonthlyBudgetを返す。月替わり時に「先月の予算をコピー」する起点として使う。
export function latestMonthlyBudget(budgets: MonthlyBudget[]): MonthlyBudget | null {
  if (budgets.length === 0) return null;
  return [...budgets].sort((a, b) => b.month.localeCompare(a.month))[0];
}

// 前月の計画数値を引き継いで、新しい月のMonthlyBudgetを作る(spec 25番: 初期値は前月予算をコピー)
export function createMonthlyBudgetFromPrevious(previous: MonthlyBudget, month: string): MonthlyBudget {
  const now = new Date().toISOString();
  return { ...previous, month, createdAt: now, updatedAt: now };
}

// ===== ダッシュボード計算(spec 41番) =====

export function calculateMonthlySpendableBudget(budget: MonthlyBudget): number {
  return (
    budget.totalIncome -
    budget.plannedFixedExpenses -
    budget.plannedCashSavings -
    budget.plannedInvestment -
    budget.specialExpenseReserve
  );
}

function sumByNature(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  month: string,
  nature: "variable" | "special"
): number {
  const totals = categoryTotalsForMonth(transactions, categories, month);
  return totals
    .filter((t) => t.category.kind === "expense" && categoryNature(t.category) === nature)
    .reduce((sum, t) => sum + t.totalYen, 0);
}

// 今月の実績のうち、変動費(nature="variable")の支出合計。固定費・貯金・投資・特別費は含めない。
export function calculateActualFlexibleSpending(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  month: string
): number {
  return sumByNature(transactions, categories, month, "variable");
}

// 今月の実績のうち、特別費(nature="special")の支出合計。
export function calculateActualSpecialExpenses(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  month: string
): number {
  return sumByNature(transactions, categories, month, "special");
}

// 特別費の確保額を超えた分だけを返す(確保額の範囲内なら0 = 通常の生活費を圧迫しない)
export function calculateSpecialExpenseOverage(actualSpecialExpenses: number, specialExpenseReserve: number): number {
  return Math.max(actualSpecialExpenses - specialExpenseReserve, 0);
}

export function calculateRemainingSpendable(
  monthlySpendableBudget: number,
  actualFlexibleSpending: number,
  specialExpenseOverage: number
): number {
  return monthlySpendableBudget - actualFlexibleSpending - specialExpenseOverage;
}

// 変動費カテゴリの月間予算合計に対する、実績消化率(0〜、上限なし)。予算未設定なら0(NaN回避)。
export function calculateBudgetUsageRate(actualFlexibleSpending: number, totalFlexibleBudget: number): number {
  return totalFlexibleBudget > 0 ? actualFlexibleSpending / totalFlexibleBudget : 0;
}

export function calculateMonthProgressRate(today: Date = new Date()): number {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return today.getDate() / daysInMonth;
}

// 月末の黒字/赤字着地見込み。「残りの予算をこのペースで使い切っても黒字か」という意味で、
// remainingSpendableと同じ値を「今月あと使えるお金」とは別の切り口(黒字/赤字の着地見込み)として見せる。
export function calculateProjectedMonthEndBalance(remainingSpendable: number): number {
  return remainingSpendable;
}

// 変動費カテゴリ(nature="variable")に設定されている月間予算の合計。budgetUsageRateの分母に使う。
export function totalFlexibleBudget(categories: BudgetCategory[]): number {
  return categories
    .filter((c) => c.kind === "expense" && categoryNature(c) === "variable" && (c.monthlyBudgetYen ?? 0) > 0)
    .reduce((sum, c) => sum + (c.monthlyBudgetYen ?? 0), 0);
}

export function buildHouseholdDashboardSummary(
  budget: MonthlyBudget,
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  today: Date = new Date()
): HouseholdDashboardSummary {
  const month = budget.month;
  const monthlySpendableBudget = calculateMonthlySpendableBudget(budget);
  const actualFlexibleSpending = calculateActualFlexibleSpending(transactions, categories, month);
  const actualSpecialExpenses = calculateActualSpecialExpenses(transactions, categories, month);
  const specialExpenseOverage = calculateSpecialExpenseOverage(actualSpecialExpenses, budget.specialExpenseReserve);
  const remainingSpendable = calculateRemainingSpendable(monthlySpendableBudget, actualFlexibleSpending, specialExpenseOverage);
  const budgetUsageRate = calculateBudgetUsageRate(actualFlexibleSpending, totalFlexibleBudget(categories));
  const monthProgressRate = calculateMonthProgressRate(today);
  const projectedMonthEndBalance = calculateProjectedMonthEndBalance(remainingSpendable);

  return {
    monthlySpendableBudget,
    actualFlexibleSpending,
    remainingSpendable,
    plannedCashSavings: budget.plannedCashSavings,
    plannedInvestment: budget.plannedInvestment,
    specialExpenseReserve: budget.specialExpenseReserve,
    actualSpecialExpenses,
    specialExpenseOverage,
    remainingSpecialExpenseReserve: budget.specialExpenseReserve - actualSpecialExpenses,
    budgetUsageRate,
    monthProgressRate,
    projectedMonthEndBalance,
  };
}

// ===== 家計診断(HouseholdProfile)からの、今月のおすすめプラン(採用前の推奨値) =====

export type RecommendedMonthlyBudget = Pick<
  MonthlyBudget,
  "totalIncome" | "plannedFixedExpenses" | "plannedCashSavings" | "plannedInvestment" | "specialExpenseReserve" | "discretionaryFloor"
>;

// standardSavings(貯金プラン全体)を、本人が自己申告している現金貯金:投資の比率で振り分ける。
// 投資実績がまだ無い(申告0円)場合は、まず現金貯金から始めるのが無理がないため全額を貯金側に回す。
function splitRecommendedSavings(profile: HouseholdProfile, standardSavings: number): { cash: number; investment: number } {
  const currentCash = profile.savings.monthlyCashSavings;
  const currentInvestment = profile.savings.monthlyInvestment;
  const currentTotal = currentCash + currentInvestment;
  if (currentTotal <= 0) return { cash: standardSavings, investment: 0 };
  const investmentRatio = currentInvestment / currentTotal;
  const investment = Math.round(standardSavings * investmentRatio);
  return { cash: standardSavings - investment, investment };
}

// 家計診断(lib/householdDiagnosis.ts)の推奨貯金プラン(標準プラン)をベースに、今月のおすすめ予算案を組み立てる。
// この時点ではまだMonthlyBudgetとして保存しない(ユーザーが採用/編集して初めてMonthlyBudgetになる)。
export function recommendMonthlyBudget(
  profile: HouseholdProfile,
  specialExpenses: SpecialExpense[],
  specialExpenseMode: SpecialExpenseMode
): RecommendedMonthlyBudget {
  const income = diagnosisTotalIncome(profile);
  const specialExpenseReserve = monthlySpecialExpenseReserve(profile, specialExpenses, specialExpenseMode);
  const available = availableForSavings(profile, specialExpenseReserve);
  const plans = computeSavingsPlans(available, profile.confidence.livingExpenses);
  const standardSavings = recommendationMode(available) === "cashflow_recovery" ? 0 : plans.standardSavings;
  const { cash, investment } = splitRecommendedSavings(profile, standardSavings);

  return {
    totalIncome: income,
    plannedFixedExpenses: fixedExpensesTotal(profile),
    plannedCashSavings: cash,
    plannedInvestment: investment,
    specialExpenseReserve,
    discretionaryFloor: diagnosisDiscretionaryFloor(income),
  };
}

export function createMonthlyBudget(recommended: RecommendedMonthlyBudget, month: string): MonthlyBudget {
  const now = new Date().toISOString();
  return { ...recommended, month, createdAt: now, updatedAt: now };
}
