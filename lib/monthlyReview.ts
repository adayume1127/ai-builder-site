// 家計簿タブの「実績学習」機能(Phase5)。
// 過去の収支記録(BudgetTransaction)から月次の実績を集計し、月末レビュー・月次履歴・
// 支出ペース表示の土台にする。すべて決定論的な計算のみ(AIによる推定は行わない)。
//
// 重要: MonthlyReviewは「ユーザーが選んだ余剰金の割り当て」だけを保存する薄いレコードで、
// 収入・支出などの実績数値は一切スナップショット保存しない。過去の取引を後から編集・削除しても
// 家計簿本体とレビュー画面の数値が食い違わないよう、表示のたびにこのファイルの集計関数で再計算する。

import {
  categoryTotalsForMonth,
  monthKey,
  monthlySummaries,
  type BudgetCategory,
  type BudgetTransaction,
} from "@/lib/household";
import { sumExpenseByNature } from "@/lib/monthlyBudget";

// ===== 実績月の判定 =====

// 「実績が十分にある月」とみなす最低支出記録件数。MVPとしての暫定値。
// 将来的に件数だけでなく記録内容(カテゴリの網羅性など)も加味した判定に拡張する可能性があるため、
// この定数はこのファイル内に閉じ込め、呼び出し側は必ず hasEnoughActualData() を経由すること
// (UI側からこの数値へ直接依存させない)。
const MIN_TRANSACTIONS_FOR_COMPLETED_MONTH = 5;

export function hasEnoughActualData(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): boolean {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const count = transactions.filter((t) => monthKey(t.date) === month && categoryById.get(t.categoryId)?.kind === "expense").length;
  return count >= MIN_TRANSACTIONS_FOR_COMPLETED_MONTH;
}

// hasEnoughActualDataを満たす月の一覧を新しい順(降順)で返す。upToMonthを指定するとその月以前(含む)に絞る。
export function completedMonths(transactions: BudgetTransaction[], categories: BudgetCategory[], upToMonth?: string): string[] {
  const allMonths = Array.from(new Set(transactions.map((t) => monthKey(t.date))));
  return allMonths
    .filter((m) => (upToMonth ? m <= upToMonth : true))
    .filter((m) => hasEnoughActualData(transactions, categories, m))
    .sort((a, b) => b.localeCompare(a));
}

// ===== 実績集計(月次) =====

export function actualIncome(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): number {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  let sum = 0;
  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue;
    if (categoryById.get(t.categoryId)?.kind === "income") sum += t.amount;
  }
  return sum;
}

export function actualFixedExpenses(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): number {
  return sumExpenseByNature(transactions, categories, month, "fixed");
}

// 既存のダッシュボード計算(lib/monthlyBudget.ts)と同じ定義を再利用する(実装を重複させない)。
export function actualVariableExpenses(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): number {
  return sumExpenseByNature(transactions, categories, month, "variable");
}

export function actualSpecialExpenses(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): number {
  return sumExpenseByNature(transactions, categories, month, "special");
}

export function actualMonthlyInvestment(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): number {
  return sumExpenseByNature(transactions, categories, month, "investment");
}

// nature="savings"に手動でタグ付けした取引(現金振替など)の合計。参考値として提供する。
export function actualSavingsTransactions(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): number {
  return sumExpenseByNature(transactions, categories, month, "savings");
}

// その月に結果として残った現金。既存の monthlySummaries().savingsYen(収入-支出の実績)をそのまま使う
// (nature別の内訳を積み上げて再計算すると、BudgetTabに既に表示されている数値とわずかでもズレる余地が生まれるため、
// 単一の真実源から取得する)。「貯金した金額」ではなく「結果として残った現金」である点に注意。
export function monthlySurplus(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string): number {
  const summary = monthlySummaries(transactions, categories).find((s) => s.month === month);
  return summary?.savingsYen ?? 0;
}

// カテゴリごとの当月実績(変動費カテゴリの予算比較・学習に使う)
export function categoryActualsForMonth(transactions: BudgetTransaction[], categories: BudgetCategory[], month: string) {
  return categoryTotalsForMonth(transactions, categories, month);
}

// ===== 月末レビュー(ユーザー操作の結果のみを保存する薄いレコード) =====

export type MonthlyReview = {
  month: string; // YYYY-MM
  allocatedToCashSavings: number; // ユーザーが「貯金へ」と割り当てた額。0もあり得る。monthlySurplusと必ずしも一致しない
  allocatedToSpecialReserve: number; // 「特別費として残す」と割り当てた額
  reviewedAt: string | null; // 割り当てを保存した日時。未レビューならnull
};

export function createUnreviewedMonthlyReview(month: string): MonthlyReview {
  return { month, allocatedToCashSavings: 0, allocatedToSpecialReserve: 0, reviewedAt: null };
}

const MONTHLY_REVIEWS_KEY = "investment-tracker:household-diagnosis:monthly-review:v1";

export function loadMonthlyReviews(): MonthlyReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MONTHLY_REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMonthlyReviews(reviews: MonthlyReview[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MONTHLY_REVIEWS_KEY, JSON.stringify(reviews));
  } catch {
    // 保存できない場合は諦める
  }
}

export function getMonthlyReview(reviews: MonthlyReview[], month: string): MonthlyReview | null {
  return reviews.find((r) => r.month === month) ?? null;
}

export function upsertMonthlyReview(reviews: MonthlyReview[], review: MonthlyReview): MonthlyReview[] {
  const idx = reviews.findIndex((r) => r.month === review.month);
  if (idx === -1) return [...reviews, review];
  const next = [...reviews];
  next[idx] = review;
  return next;
}

// 保存済みレビューの割当合計(貯金へ+特別費へ)が、その後の取引編集・削除で再計算された
// 最新のmonthlySurplusを上回っていないかを判定する。
// 上回っている場合でも保存済みの割当額を自動でクランプ・変更してはいけない — 呼び出し側は
// 「再確認が必要」な状態としてユーザーに警告を出し、ユーザー自身が金額を見直して再保存するまで
// 過去の割当値をそのまま保持すること。
export function reviewNeedsReconciliation(review: MonthlyReview | null, currentSurplus: number): boolean {
  if (!review || review.reviewedAt === null) return false;
  // 赤字/ゼロの月に割り当てられる上限は0円(マイナスの余剰金には割り当てられない)。
  // 0円/0円まで見直した保存は「解消済み」とみなせるよう、比較対象を currentSurplus ではなく
  // max(currentSurplus, 0) にする(MonthlyReviewCardのoverAllocated判定と同じ考え方)。
  return review.allocatedToCashSavings + review.allocatedToSpecialReserve > Math.max(currentSurplus, 0);
}

// ===== 月次履歴(過去月の一覧) =====

export type MonthlyHistoryEntry = {
  month: string;
  actualIncome: number;
  actualFixedExpenses: number;
  actualVariableExpenses: number;
  actualSpecialExpenses: number;
  actualMonthlyInvestment: number;
  monthlySurplus: number;
  review: MonthlyReview | null;
};

// completedMonths()で「実績が十分にある月」に絞ったうえで、各月の実績を都度計算して返す(新しい順)。
export function monthlyHistory(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  reviews: MonthlyReview[],
  upToMonth?: string
): MonthlyHistoryEntry[] {
  return completedMonths(transactions, categories, upToMonth).map((month) => ({
    month,
    actualIncome: actualIncome(transactions, categories, month),
    actualFixedExpenses: actualFixedExpenses(transactions, categories, month),
    actualVariableExpenses: actualVariableExpenses(transactions, categories, month),
    actualSpecialExpenses: actualSpecialExpenses(transactions, categories, month),
    actualMonthlyInvestment: actualMonthlyInvestment(transactions, categories, month),
    monthlySurplus: monthlySurplus(transactions, categories, month),
    review: getMonthlyReview(reviews, month),
  }));
}
