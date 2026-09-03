// 家計簿(/tools/investment-tracker「家計簿」タブ)のデータ永続化・集計ロジック。
// 積立クエストの目標・資産ポートフォリオとは独立した、日々の収入・支出の記録。
// すべて「円」単位で計算する。

export type BudgetCategoryKind = "income" | "expense";

// 支出の性質。固定費/投資は家計診断のMonthlyBudgetですでに月初に確保額を引いてあるため、
// このタグで「今月あと使えるお金」の実績集計(variable/special)から除外し、二重計上を防ぐ。
//
// 「貯金」はここには含めない(過去に nature: "savings" として存在したが未使用のまま
// 削除した)。現金貯金の計画はMonthlyBudget.plannedCashSavings、実績はmonthlySurplus()
// (収入-支出の結果)、月末の用途決定はMonthlyReview.allocatedToCashSavingsが担当しており、
// 「普通預金→貯金用預金」のような口座間振替はBudgetTransactionの支出として記録すると、
// 実際には現金資産の総額が変わらないのに預金残高(全収支から再計算する仕組み)を
// 過少計上してしまうため、支出扱いにすること自体が設計と相性が悪い。
export type ExpenseNature = "fixed" | "variable" | "special" | "investment";

export type BudgetCategory = {
  id: string;
  label: string;
  kind: BudgetCategoryKind;
  isDefault: boolean;
  monthlyBudgetYen?: number; // 支出カテゴリのみ意味を持つ、任意の月間予算上限
  nature?: ExpenseNature; // 支出カテゴリのみ意味を持つ。未設定は categoryNature() が "variable" にフォールバック
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
  { id: "food", label: "食費", kind: "expense", isDefault: true, nature: "variable" },
  { id: "housing", label: "家賃・住居費", kind: "expense", isDefault: true, nature: "fixed" },
  { id: "utilities", label: "光熱費", kind: "expense", isDefault: true, nature: "fixed" },
  { id: "communication", label: "通信費", kind: "expense", isDefault: true, nature: "fixed" },
  { id: "transport", label: "交通費", kind: "expense", isDefault: true, nature: "variable" },
  { id: "entertainment", label: "娯楽費", kind: "expense", isDefault: true, nature: "variable" },
  { id: "other-expense", label: "その他支出", kind: "expense", isDefault: true, nature: "variable" },
  {
    id: "special-expense",
    label: "特別費(旅行・帰省など)",
    kind: "expense",
    isDefault: true,
    nature: "special",
  },
  { id: "investment", label: "投資", kind: "expense", isDefault: true, nature: "investment" },
];

// nature未設定の支出カテゴリ(既存データ・分類し忘れた新規カテゴリ)は "variable" 扱いにする。
// 収入カテゴリにnatureは意味を持たないが、型の都合上 "variable" を返しておく(呼び出し側はkindで先に弾く想定)。
export function categoryNature(category: BudgetCategory): ExpenseNature {
  return category.nature ?? "variable";
}

const CATEGORIES_KEY = "investment-tracker:budget-categories:v1";
const TRANSACTIONS_KEY = "investment-tracker:budget-transactions:v1";

const SPECIAL_EXPENSE_CATEGORY: BudgetCategory = DEFAULT_CATEGORIES.find((c) => c.id === "special-expense")!;
const INVESTMENT_CATEGORY: BudgetCategory = DEFAULT_CATEGORIES.find((c) => c.id === "investment")!;

// 既存ユーザーが保存済みのカテゴリ配列には「特別費」カテゴリが無いため、読み込み時に1件だけ補う軽量マイグレーション。
// 取引データ(BudgetTransaction)には一切触れない。
function withSpecialExpenseCategory(categories: BudgetCategory[]): BudgetCategory[] {
  const hasSpecial = categories.some((c) => c.nature === "special");
  return hasSpecial ? categories : [...categories, SPECIAL_EXPENSE_CATEGORY];
}

// 既存ユーザーの保存済みカテゴリにnature="investment"が1件も無いと、月末レビューの「投資へ」
// 導線が「カテゴリ管理で投資に分類したカテゴリを選んでください」という案内止まりになり、
// 実際には投資を記録できない。特別費と同じ考え方で、id/labelではなくnatureの有無で判定し、
// ユーザーが独自に投資natureのカテゴリを作成済みなら追加しない(非破壊・重複防止)。
function withInvestmentCategory(categories: BudgetCategory[]): BudgetCategory[] {
  const hasInvestment = categories.some((c) => c.nature === "investment");
  return hasInvestment ? categories : [...categories, INVESTMENT_CATEGORY];
}

export function loadCategories(): BudgetCategory[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = window.localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES;
    return withInvestmentCategory(withSpecialExpenseCategory(parsed));
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

export function addCategory(
  categories: BudgetCategory[],
  label: string,
  kind: BudgetCategoryKind,
  nature?: ExpenseNature
): BudgetCategory[] {
  return [...categories, { id: crypto.randomUUID(), label, kind, isDefault: false, nature }];
}

// デフォルトカテゴリは削除不可(記録済みの取引が迷子にならないように)
export function removeCategory(categories: BudgetCategory[], id: string): BudgetCategory[] {
  return categories.filter((c) => c.id !== id || c.isDefault);
}

// 0以下は「予算なし」として扱う
export function setCategoryBudget(categories: BudgetCategory[], id: string, budgetYen: number): BudgetCategory[] {
  return categories.map((c) =>
    c.id === id ? { ...c, monthlyBudgetYen: budgetYen > 0 ? budgetYen : undefined } : c
  );
}

export function setCategoryNature(categories: BudgetCategory[], id: string, nature: ExpenseNature): BudgetCategory[] {
  return categories.map((c) => (c.id === id ? { ...c, nature } : c));
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

// 既存の取引のカテゴリだけを変更する(例: 「特別費にする」)。新しい取引を追加するわけではないので、
// 同じ支出が変更前後のカテゴリに二重計上されることはない。
export function updateTransactionCategory(transactions: BudgetTransaction[], id: string, categoryId: string): BudgetTransaction[] {
  return transactions.map((t) => (t.id === id ? { ...t, categoryId } : t));
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

// 記録開始からの収入-支出の累計(資産タブの「預金」に自動反映する)
export function totalNetYen(transactions: BudgetTransaction[], categories: BudgetCategory[]): number {
  const kindById = new Map(categories.map((c) => [c.id, c.kind]));
  let net = 0;
  for (const t of transactions) {
    const kind = kindById.get(t.categoryId);
    net += kind === "income" ? t.amount : -t.amount;
  }
  return net;
}

export function transactionsByDate(transactions: BudgetTransaction[]): Map<string, BudgetTransaction[]> {
  const map = new Map<string, BudgetTransaction[]>();
  for (const t of transactions) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return map;
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

export type CategoryBudgetStatus = {
  category: BudgetCategory;
  spentYen: number;
  budgetYen: number;
  ratio: number; // spentYen / budgetYen(0〜、上限なし)
  overBudget: boolean;
};

// 予算(monthlyBudgetYen)を設定している支出カテゴリの、当月の使用状況
export function categoryBudgetStatusForMonth(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  month: string
): CategoryBudgetStatus[] {
  const totals = categoryTotalsForMonth(transactions, categories, month);
  const totalsById = new Map(totals.map((t) => [t.category.id, t.totalYen]));
  return categories
    .filter((c) => c.kind === "expense" && (c.monthlyBudgetYen ?? 0) > 0)
    .map((c) => {
      const spentYen = totalsById.get(c.id) ?? 0;
      const budgetYen = c.monthlyBudgetYen!;
      return { category: c, spentYen, budgetYen, ratio: spentYen / budgetYen, overBudget: spentYen > budgetYen };
    });
}

// ===== マネークエスト(実績タブ): 貯金体質を作るまでのステージ1 =====
//
// 「貯金目標」は以前、この機能専用にHouseholdSettings.monthlySavingsGoalYenという
// 独立した手動入力を持っていたが、家計診断→ルナの診断結果→採用という一本道フロー
// (Cycle3)が生む MonthlyBudget.plannedCashSavings と意味が重複し、2つの「貯金目標」が
// 食い違いうる状態になっていた。今月採用済みのMonthlyBudget.plannedCashSavingsを
// 唯一の基準にする(GPTとのPDCA Cycle4)。

export type MoneyQuestContext = {
  transactions: BudgetTransaction[];
  categories: BudgetCategory[];
  // 今月採用済みのMonthlyBudget.plannedCashSavings(未採用の月は0)。
  plannedCashSavingsYen: number;
  // 今月、MonthlyBudgetを採用済みか。赤字家計時はルナが先取り貯金0円を正しくおすすめすることがあり、
  // その場合plannedCashSavingsYenは0になるが「プランを決めていない」わけではない。「決めた」ことの
  // 判定にはplannedCashSavingsYen > 0ではなくこちらを使う(GPT実装レビューでの指摘、Cycle4)。
  hasAdoptedBudget: boolean;
  nowMonth: string; // YYYY-MM
  hasInvestmentRecord: boolean; // 資産タブで最低1回、記録を保存しているか
};

export type MoneyQuestStep = {
  id: string;
  title: string;
  description: string;
  check: (ctx: MoneyQuestContext) => boolean;
};

export const MONEY_QUEST_STAGE1: MoneyQuestStep[] = [
  {
    id: "first-record",
    title: "家計簿デビュー",
    description: "収入か支出を1件記録しよう。まずは今日使ったお金からでOK。",
    check: (ctx) => ctx.transactions.length >= 1,
  },
  {
    id: "both-sides",
    title: "収支を両方記録",
    description: "収入と支出をそれぞれ1件以上記録して、お金の流れを見える化しよう。",
    check: (ctx) => {
      const kindById = new Map(ctx.categories.map((c) => [c.id, c.kind]));
      const hasIncome = ctx.transactions.some((t) => kindById.get(t.categoryId) === "income");
      const hasExpense = ctx.transactions.some((t) => kindById.get(t.categoryId) === "expense");
      return hasIncome && hasExpense;
    },
  },
  {
    id: "savings-goal",
    title: "今月の先取り貯金プランを決める",
    description: "家計簿タブの「今月の予算」で、今月いくら先取り貯金するか決めよう。",
    check: (ctx) => ctx.hasAdoptedBudget,
  },
  {
    id: "category-budget",
    title: "予算の壁を作る",
    description: "使いすぎやすい支出カテゴリに、月の予算上限を1つ設定しよう。",
    check: (ctx) => ctx.categories.some((c) => (c.monthlyBudgetYen ?? 0) > 0),
  },
  {
    id: "keep-going",
    title: "続ける力",
    description: "2ヶ月以上、記録を続けよう。継続こそが貯まる家計簿の一番の近道。",
    check: (ctx) => new Set(ctx.transactions.map((t) => monthKey(t.date))).size >= 2,
  },
  {
    id: "positive-month",
    title: "黒字家計",
    description: "今月の収支をプラスにしよう。収入が支出を上回れば黒字達成。",
    check: (ctx) => {
      const summary = monthlySummaries(ctx.transactions, ctx.categories).find((s) => s.month === ctx.nowMonth);
      return (summary?.savingsYen ?? 0) > 0;
    },
  },
  {
    id: "goal-achieved",
    title: "目標達成",
    description: "今月の先取り貯金額を、今月の実績で100%達成しよう。",
    check: (ctx) => {
      if (ctx.plannedCashSavingsYen <= 0) return false;
      const summary = monthlySummaries(ctx.transactions, ctx.categories).find((s) => s.month === ctx.nowMonth);
      return (summary?.savingsYen ?? 0) >= ctx.plannedCashSavingsYen;
    },
  },
  {
    id: "invest-surplus",
    title: "余剰金を投資へ",
    description: "貯まった余剰資金を、資産タブで投資として記録しよう。貯金体質の完成。",
    check: (ctx) => ctx.hasInvestmentRecord,
  },
];

export function moneyQuestCompletion(ctx: MoneyQuestContext): boolean[] {
  return MONEY_QUEST_STAGE1.map((step) => step.check(ctx));
}
