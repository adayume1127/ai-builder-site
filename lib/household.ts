// 家計簿(/tools/investment-tracker「家計簿」タブ)のデータ永続化・集計ロジック。
// 積立クエストの目標・資産ポートフォリオとは独立した、日々の収入・支出の記録。
// すべて「円」単位で計算する。

export type BudgetCategoryKind = "income" | "expense";

export type BudgetCategory = {
  id: string;
  label: string;
  kind: BudgetCategoryKind;
  isDefault: boolean;
};

export type BudgetTransaction = {
  id: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  amount: number; // 円、常に正の値
  memo: string;
};

export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: "salary", label: "給与", kind: "income", isDefault: true },
  { id: "other-income", label: "その他収入", kind: "income", isDefault: true },
  { id: "food", label: "食費", kind: "expense", isDefault: true },
  { id: "housing", label: "家賃・住居費", kind: "expense", isDefault: true },
  { id: "utilities", label: "光熱費", kind: "expense", isDefault: true },
  { id: "communication", label: "通信費", kind: "expense", isDefault: true },
  { id: "transport", label: "交通費", kind: "expense", isDefault: true },
  { id: "entertainment", label: "娯楽費", kind: "expense", isDefault: true },
  { id: "other-expense", label: "その他支出", kind: "expense", isDefault: true },
];

const CATEGORIES_KEY = "investment-tracker:budget-categories:v1";
const TRANSACTIONS_KEY = "investment-tracker:budget-transactions:v1";

export function loadCategories(): BudgetCategory[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = window.localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES;
    return parsed;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: BudgetCategory[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    // 保存できない場合は諦める
  }
}

export function addCategory(categories: BudgetCategory[], label: string, kind: BudgetCategoryKind): BudgetCategory[] {
  return [...categories, { id: crypto.randomUUID(), label, kind, isDefault: false }];
}

// デフォルトカテゴリは削除不可(記録済みの取引が迷子にならないように)
export function removeCategory(categories: BudgetCategory[], id: string): BudgetCategory[] {
  return categories.filter((c) => c.id !== id || c.isDefault);
}

export function loadTransactions(): BudgetTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a: BudgetTransaction, b: BudgetTransaction) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: BudgetTransaction[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch {
    // 保存できない場合は諦める
  }
}

export function addTransaction(
  transactions: BudgetTransaction[],
  input: Omit<BudgetTransaction, "id">
): BudgetTransaction[] {
  return [...transactions, { ...input, id: crypto.randomUUID() }].sort((a, b) => a.date.localeCompare(b.date));
}

export function removeTransaction(transactions: BudgetTransaction[], id: string): BudgetTransaction[] {
  return transactions.filter((t) => t.id !== id);
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export type MonthlySummary = { month: string; incomeYen: number; expenseYen: number; savingsYen: number };

export function monthlySummaries(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[]
): MonthlySummary[] {
  const kindById = new Map(categories.map((c) => [c.id, c.kind]));
  const map = new Map<string, { incomeYen: number; expenseYen: number }>();
  for (const t of transactions) {
    const key = monthKey(t.date);
    const kind = kindById.get(t.categoryId);
    const cur = map.get(key) ?? { incomeYen: 0, expenseYen: 0 };
    if (kind === "income") cur.incomeYen += t.amount;
    else cur.expenseYen += t.amount;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month,
      incomeYen: v.incomeYen,
      expenseYen: v.expenseYen,
      savingsYen: v.incomeYen - v.expenseYen,
    }));
}

export type SavingsTrendPoint = { month: string; cumulativeSavingsYen: number };

// 各月の貯金額(収入-支出)を積み上げた、貯金額推移
export function cumulativeSavingsTrend(summaries: MonthlySummary[]): SavingsTrendPoint[] {
  let running = 0;
  return summaries.map((s) => {
    running += s.savingsYen;
    return { month: s.month, cumulativeSavingsYen: running };
  });
}

export function categoryTotalsForMonth(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  month: string
): { category: BudgetCategory; totalYen: number }[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  return categories
    .map((c) => ({ category: c, totalYen: totals.get(c.id) ?? 0 }))
    .filter((c) => c.totalYen > 0);
}
