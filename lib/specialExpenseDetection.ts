// 家計簿タブの「特別費候補の検出」機能(Phase5 Step5)。
// 大きな支出を検知しても自動で特別費へ変更することは絶対にしない。
// 必ず「特別費として扱いますか?」とユーザーに確認し、選んだ場合だけ
// (1)対象取引のカテゴリを既存の特別費カテゴリへ変更(新規取引の追加はしない=二重計上防止)
// (2)将来の特別費見込みとしてSpecialExpenseCandidateを保存する。
// 「毎年ありそう」を選んでも、年間特別費(HouseholdProfile/SpecialExpense[])やMonthlyBudgetは
// 自動変更しない。あくまで提案(estimatedMonthlySpecialExpenseReserve等)として提示するだけ。

import { categoryNature, monthKey, type BudgetCategory, type BudgetTransaction } from "@/lib/household";
import type { SpecialExpense } from "@/lib/householdDiagnosis";

// ===== 大口支出の判定 =====

export const LARGE_EXPENSE_THRESHOLD = 30000;
export const LARGE_EXPENSE_MULTIPLIER = 2.5;
// カテゴリの実績データがこの件数未満の場合、倍率判定(categoryMedian * MULTIPLIER)は使わない
// (母数が少なすぎる中央値は信頼できないため、金額しきい値のみで判定する)
const MIN_DATA_POINTS_FOR_MULTIPLIER = 3;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// amount: 判定対象の金額。categoryAmounts: 同じカテゴリの過去の取引額一覧(判定対象自身は除く)。
export function isLargeExpense(amount: number, categoryAmounts: number[]): boolean {
  if (amount >= LARGE_EXPENSE_THRESHOLD) return true;
  if (categoryAmounts.length >= MIN_DATA_POINTS_FOR_MULTIPLIER) {
    const categoryMedian = median(categoryAmounts);
    if (categoryMedian > 0 && amount > categoryMedian * LARGE_EXPENSE_MULTIPLIER) return true;
  }
  return false;
}

function categoryTransactionAmounts(transactions: BudgetTransaction[], categoryId: string, excludeTransactionId: string): number[] {
  return transactions.filter((t) => t.categoryId === categoryId && t.id !== excludeTransactionId).map((t) => t.amount);
}

// 大口支出の探索対象にする月数(今月を含む)。無制限に過去へ遡ると、古い取引について
// 今さら「特別費にしますか?」と聞かれても文脈を思い出せずノイズになるため、直近半年程度に絞る。
export const LARGE_EXPENSE_LOOKBACK_MONTHS = 6;

// month は "YYYY-MM"(ゼロパディング済み)、monthsBack は1以上の整数を前提とする内部専用ヘルパー。
function monthKeyMinus(month: string, monthsBack: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 - monthsBack, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 直近lookbackMonths分(今月を含む。lookbackMonths >= 1が契約)の取引のうち、まだ確認していない
// (resolvedTransactionIdsに含まれない)大口支出候補を1件返す。一度に複数プロンプトを出さず、
// 最新の取引から1件だけ提示する(今月の取引が最初に見つかればそれを優先し、無ければ過去月へ
// 遡って見逃した支出を拾う)。この「今月も対象に含める」判定は、月次レビュー(lib/monthlyReview.ts)
// が「完了した月だけを対象にする」のとは意図的に異なる — 大口支出検知は取引が記録された時点で
// その支出の性質を確認する機能であり、月が完了しているかどうかとは無関係なため
// (詳細はdocs/gpt-review-context.mdの「今月の扱い」を参照)。
// 対象は kind="expense" かつ nature="variable" の取引のみ
// (収入・固定費・投資・貯金・すでに特別費のものは原則として候補にしない)。
// 同一取引は resolvedTransactionIds によって月をまたいでも二度と候補にならない
// (「特別費にする」「通常支出のまま」いずれの回答でもtransaction.idが記録されるため)。
export function findUnresolvedLargeExpenseCandidate(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[],
  resolvedTransactionIds: Set<string>,
  currentMonth: string,
  lookbackMonths: number = LARGE_EXPENSE_LOOKBACK_MONTHS
): BudgetTransaction | null {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const earliestMonth = monthKeyMinus(currentMonth, lookbackMonths - 1);
  const windowTransactions = transactions
    .filter((t) => {
      const mk = monthKey(t.date);
      return mk >= earliestMonth && mk <= currentMonth;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  for (const t of windowTransactions) {
    if (resolvedTransactionIds.has(t.id)) continue;
    const category = categoryById.get(t.categoryId);
    if (!category || category.kind !== "expense") continue;
    if (categoryNature(category) !== "variable") continue;
    const pastAmounts = categoryTransactionAmounts(transactions, t.categoryId, t.id);
    if (isLargeExpense(t.amount, pastAmounts)) return t;
  }
  return null;
}

// ===== 確認済み取引の記録(同じ取引に再度プロンプトを出さないため) =====

const RESOLVED_PROMPT_KEY = "investment-tracker:household-diagnosis:special-expense-prompt-resolved:v1";

export function loadResolvedSpecialExpensePromptIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESOLVED_PROMPT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResolvedSpecialExpensePromptIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESOLVED_PROMPT_KEY, JSON.stringify(ids));
  } catch {
    // 保存できない場合は諦める
  }
}

// ===== 特別費候補(将来も発生しそうな支出の記録) =====
//
// SpecialExpenseCandidateは、独立した将来計画ではなく sourceTransactionId が指す
// BudgetTransaction に従属する派生データ(amountもその取引の金額をそのまま持つ)。
// そのため、元の取引が削除された場合は候補も一緒に削除する
// (removeSpecialExpenseCandidatesForTransaction参照)。「毎年ありそう」等の
// recurrence判断だけを取引削除後も独立して保持する、という仕様にはしていない。

export type SpecialExpenseCandidateRecurrence = "annual" | "occasional" | "one_time";

export type SpecialExpenseCandidate = {
  id: string;
  categoryId?: string; // 変更前の元カテゴリ(参考表示用)
  amount: number;
  sourceTransactionId: string;
  recurrence: SpecialExpenseCandidateRecurrence;
  expectedMonth?: number; // 1-12。annualの場合、取引が発生した月を参考値として入れる
  createdAt: string;
};

const CANDIDATES_KEY = "investment-tracker:household-diagnosis:special-expense-candidates:v1";

export function loadSpecialExpenseCandidates(): SpecialExpenseCandidate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CANDIDATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSpecialExpenseCandidates(candidates: SpecialExpenseCandidate[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
  } catch {
    // 保存できない場合は諦める
  }
}

export function addSpecialExpenseCandidate(
  candidates: SpecialExpenseCandidate[],
  input: Omit<SpecialExpenseCandidate, "id" | "createdAt">
): SpecialExpenseCandidate[] {
  return [...candidates, { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
}

// 元になった取引(sourceTransactionId)が削除された候補を取り除く。
// 取り除かないと、実在しない取引の金額が estimatedAnnualSpecialExpenses() に残り続けてしまう。
export function removeSpecialExpenseCandidatesForTransaction(
  candidates: SpecialExpenseCandidate[],
  transactionId: string
): SpecialExpenseCandidate[] {
  return candidates.filter((c) => c.sourceTransactionId !== transactionId);
}

// ===== 年間特別費の再見積もり(あくまで提案。自動反映はしない) =====

// 自己申告のSpecialExpense[](診断ウィザード由来)+ recurrence="annual"の特別費候補、の年間合計。
// 「ときどきある」は毎年発生するとは限らないため、この合計には含めない(過大評価を避ける)。
export function estimatedAnnualSpecialExpenses(candidates: SpecialExpenseCandidate[], existingSpecialExpenses: SpecialExpense[]): number {
  const fromExisting = existingSpecialExpenses.reduce((sum, e) => sum + Math.max(e.amount, 0), 0);
  const fromCandidates = candidates
    .filter((c) => c.recurrence === "annual")
    .reduce((sum, c) => sum + Math.max(c.amount, 0), 0);
  return fromExisting + fromCandidates;
}

export function estimatedMonthlySpecialExpenseReserve(annualTotal: number): number {
  return Math.round(annualTotal / 12);
}
