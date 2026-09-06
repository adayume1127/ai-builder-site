// 過去月の支出をカテゴリ別に可視化するための集計ロジック(円グラフ・推移グラフ共通)。
// 表示専用の派生値のみを扱い、BudgetTransaction・BudgetCategory本体には触れない。

import { categoryTotalsForMonth, monthKey, type BudgetCategory, type BudgetTransaction } from "./household";

// 円グラフの区分数上限(上位5件+「その他」)。7区分を超えると隣接区分の判別が難しくなるため
// (dataviz原則: part-to-wholeは6区分まで)。推移グラフの積み上げ棒でも同じ区分・同じ色を使う。
export const MAX_CATEGORY_SLICES = 6;
export const OTHER_CATEGORY_ID = "__other__";
export const OTHER_CATEGORY_LABEL = "その他";

export type CategorySlot = { categoryId: string; label: string };

// 対象期間全体の支出合計でカテゴリをランキングし、上位(MAX_CATEGORY_SLICES-1)件を固定の
// 色スロットに割り当てる。月ごとに上位カテゴリを再計算すると、同じカテゴリでも月によって
// 色が変わってしまう(dataviz原則: 色はエンティティに従う、ランクに従わない)ため、
// 期間全体で1回だけランキングを決め、以後は月をまたいでも同じ色を保つ。
export function topExpenseCategorySlots(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  months: string[]
): CategorySlot[] {
  const monthSet = new Set(months);
  const totals = new Map<string, number>();
  const labelById = new Map(categories.map((c) => [c.id, c.label]));
  const expenseCategoryIds = new Set(categories.filter((c) => c.kind === "expense").map((c) => c.id));
  for (const t of transactions) {
    if (!expenseCategoryIds.has(t.categoryId) || !monthSet.has(monthKey(t.date))) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORY_SLICES - 1)
    .map(([categoryId]) => ({ categoryId, label: labelById.get(categoryId) ?? "不明なカテゴリ" }));
}

export type CategoryShare = {
  categoryId: string;
  label: string;
  amountYen: number;
  ratio: number; // その月の支出合計に対する割合(0〜1)
};

export type MonthlyCategoryBreakdown = {
  month: string;
  totalYen: number;
  shares: CategoryShare[]; // 金額の多い順。topSlotsに無いカテゴリは「その他」に集約
};

// topSlots(期間全体のランキング)を基準に、指定した1ヶ月分の内訳を作る。
// topSlotsに無い(=期間全体では上位に入らない)カテゴリの支出は「その他」にまとめる。
export function monthlyExpenseBreakdown(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  month: string,
  topSlots: CategorySlot[]
): MonthlyCategoryBreakdown {
  const totals = categoryTotalsForMonth(transactions, categories, month).filter((t) => t.category.kind === "expense");
  const totalYen = totals.reduce((sum, t) => sum + t.totalYen, 0);
  const topIds = new Set(topSlots.map((s) => s.categoryId));
  const byTopId = new Map(totals.filter((t) => topIds.has(t.category.id)).map((t) => [t.category.id, t.totalYen]));
  const otherYen = totals.filter((t) => !topIds.has(t.category.id)).reduce((sum, t) => sum + t.totalYen, 0);

  const shares: CategoryShare[] = topSlots
    .map((slot) => ({
      categoryId: slot.categoryId,
      label: slot.label,
      amountYen: byTopId.get(slot.categoryId) ?? 0,
      ratio: totalYen > 0 ? (byTopId.get(slot.categoryId) ?? 0) / totalYen : 0,
    }))
    .filter((s) => s.amountYen > 0);
  if (otherYen > 0) {
    shares.push({
      categoryId: OTHER_CATEGORY_ID,
      label: OTHER_CATEGORY_LABEL,
      amountYen: otherYen,
      ratio: totalYen > 0 ? otherYen / totalYen : 0,
    });
  }
  shares.sort((a, b) => b.amountYen - a.amountYen);

  return { month, totalYen, shares };
}

// 何らかの取引(収入・支出を問わない)が存在する月を古い→新しい順で返す。monthsCountを
// 指定すると直近N ヶ月に絞る(積み上げ棒グラフ用、多すぎると1本あたりが細くなり判読しづらい
// ため)。省略すると記録が存在する全期間を返す(円グラフの月移動用、過去に遡る上限を設けない)。
// 収入のみで支出が無い月も含まれる(カレンダー上の連続性を保つため、意図的に支出取引の
// 有無では絞り込まない)。その場合、円グラフ/積み上げ棒には「支出の記録なし」の月として
// 表示される(monthlyExpenseBreakdown側の責務)。
export function recentMonthsWithTransactions(transactions: BudgetTransaction[], monthsCount?: number): string[] {
  const set = new Set(transactions.map((t) => monthKey(t.date)));
  const sorted = [...set].sort();
  return monthsCount === undefined ? sorted : sorted.slice(-monthsCount);
}
