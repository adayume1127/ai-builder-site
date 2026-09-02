// 「今日のアクション」カード(Phase7a)のうち、先取り貯金アクションの実行確認状態。
//
// 重要な制約(GPT設計相談での結論): これは新しい金融データのsource of truthではない。
// 「◯円を実行した」と記録しても、預金残高・HouseholdProfile・MonthlyBudget・
// BudgetTransactionのいずれも一切変更しない。あくまで「ユーザーが今月の貯金計画について
// 行動したことの確認記録」という補助状態であり、家計計算の入力値には使わない。
//
// MonthlyReview.allocatedToCashSavings(月末に「結果としての余剰金をどう配分したか」を
// 記録する)とは役割が異なる。こちらは月初の「計画していた金額を確保できたか」という
// 実行確認であり、月の途中で何度でも修正できる(最終状態だけを保持し、履歴は残さない)。
//
// 仕様: MonthlyBudget.plannedCashSavingsが後から編集されても、保存済みのMonthlyActionState
// を自動的に変更・pending化しない。ユーザーが「実行した30,000円」という明示操作をした事実を、
// 予算編集という別操作で勝手に消さない(既存の「ユーザー確認なしの自動変更禁止」と一致)。
// そのため予算編集後は、計画額と実行確認額が一時的にズレることがあるが、これは仕様であり
// バグではない(ズレの解消はユーザーが「修正する」を押すまで待つ)。

export type CashSavingsActionStatus = "pending" | "completed" | "skipped";

export type MonthlyActionState = {
  month: string;
  cashSavingsStatus: CashSavingsActionStatus;
  // completed/skipped時に確定した金額。pending中は意味を持たない(0のままでよい)。
  cashSavingsAmountYen: number;
  updatedAt: string;
};

const MONTHLY_ACTION_STATE_KEY = "investment-tracker:household-diagnosis:monthly-action-state:v1";

export function loadMonthlyActionStates(): MonthlyActionState[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MONTHLY_ACTION_STATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMonthlyActionStates(states: MonthlyActionState[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MONTHLY_ACTION_STATE_KEY, JSON.stringify(states));
  } catch {
    // 保存できない場合は諦める
  }
}

export function getMonthlyActionState(states: MonthlyActionState[], month: string): MonthlyActionState | null {
  return states.find((s) => s.month === month) ?? null;
}

export function upsertMonthlyActionState(states: MonthlyActionState[], state: MonthlyActionState): MonthlyActionState[] {
  const idx = states.findIndex((s) => s.month === state.month);
  if (idx === -1) return [...states, state];
  const next = [...states];
  next[idx] = state;
  return next;
}

