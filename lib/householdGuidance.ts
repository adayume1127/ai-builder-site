// 家計簿タブの「困ったらここ」ボタン。既存の各判定関数(monthlyReview/budgetSuggestions/
// specialExpenseDetection/householdDiagnosis/monthlyBudget)がすでに算出した結果を受け取り、
// 今ユーザーに見せるべき最重要の1件だけを選んで返す、決定論的なルールベースの集約層。
//
// 重要な制約:
// - ここで新しい家計判断・計算式を導入しない。例えば生活防衛資金が不足していても、
//   「投資を止めて防衛資金を優先しましょう」のような、既存のrecommendMonthlyBudget()が
//   行っていない資金配分ルールをこの層が新しく決めることはしない(既存の判断範囲を
//   説明するだけに留める)。
// - AIによる文章生成は行わない(APIコストが発生するため)。すべて事前に決めた文言の
//   出し分けのみ。
// - 呼び出し側は結果をlocalStorageへ保存しない。取引の追加・削除やレビューのたびに
//   答えが変わる性質のため、ボタンを押すたびに最新状態から再計算する想定。
// - 「今月」を含めるか除外するかは、渡された入力(各既存関数の呼び出し結果)側の判断に
//   従う。ここで独自に「今月除外」等のフィルタを再定義しない(Phase6で確定した、
//   機能ごとに異なる「今月」の扱いの原則を参照)。

import { formatYen } from "@/lib/portfolio";
import type { SpendingPaceStatus } from "@/lib/monthlyBudget";
import type { GoalFeasibility } from "@/lib/householdDiagnosis";

export type GuidanceReason =
  | "budget_not_adopted"
  | "deficit"
  | "over_budget_categories"
  | "spending_pace_fast"
  | "review_needs_reconciliation"
  | "unresolved_large_expense"
  | "unreviewed_past_month"
  | "budget_adjustment_suggested"
  | "special_reserve_suggested"
  | "emergency_fund_low"
  | "goal_insufficient"
  | "goal_achievable_with_bonus"
  | "not_enough_data"
  | "on_track";

export type HouseholdGuidance = {
  reason: GuidanceReason;
  headline: string; // 「今の状態」を1文で
  supportingFacts: string[]; // 補助数値。最大2件程度に抑える(呼び出し側もこの想定で作る)
  actionLabel: string; // 「次にやること」
};

export type HouseholdGuidanceInput = {
  hasMonthlyBudget: boolean;
  remainingSpendable: number | null;
  overBudgetCategoryCount: number;
  spendingPace: SpendingPaceStatus | null;
  // reviewableMonthsDesc(今月を除く完了月)全体の中で、保存済みレビューの割り当てが
  // 最新の実績とズレて「再確認が必要」になっている月があるかどうか。UIで現在選択中の
  // 月(selectedReviewMonth)だけを見るのではなく、対象を広げて探索した結果を渡すこと
  // (現在選択中の月だけで判定すると、ユーザーが◀/▶で表示月を切り替えるだけで
  // Guidanceの回答が変わってしまう=UIのナビゲーション状態にGuidanceが依存してしまう)。
  monthNeedingReconciliation: string | null;
  hasUnresolvedLargeExpense: boolean;
  hasUnreviewedPastMonth: boolean;
  unreviewedPastMonth: string | null;
  budgetAdjustmentSuggestionCount: number;
  hasSpecialReserveSuggestion: boolean;
  emergencyFundMonthsCovered: number | null;
  emergencyFundTargetMonths: number;
  goalFeasibility: GoalFeasibility | null;
  transactionCountThisMonth: number;
};

// 優先順位は「家計理論上の重要度」ではなく「今ユーザーが実際に対処できるか
// (actionability)」を軸に並べる。ブロッカー(予算未採用) → 現在進行中の問題
// (赤字 > カテゴリ予算超過 > 支出ペース、の内部優先度) → 未処理タスク(レビュー・
// 確認待ち・提案) → 中長期の見通し(防衛資金・目標)、の順。
export function buildHouseholdGuidance(input: HouseholdGuidanceInput): HouseholdGuidance {
  // 現在のUI(HouseholdGuidanceButton)は今月の予算が採用済みの画面(HouseholdDashboard)に
  // のみ配置しており、この分岐は現状のUIからは到達しない(BudgetPlanAdopt画面は「予算を
  // 決める」ことだけに特化した単一目的の画面のため、ボタンをそこには置いていない)。
  // 将来ボタンの設置範囲を広げる場合のために型・分岐は残してある。
  if (!input.hasMonthlyBudget) {
    return {
      reason: "budget_not_adopted",
      headline: "まだ今月の予算が決まっていません。",
      supportingFacts: [],
      actionLabel: "今月の予算を決めましょう。",
    };
  }

  if (input.remainingSpendable !== null && input.remainingSpendable < 0) {
    return {
      reason: "deficit",
      headline: "今月は予算より支出が多くなる見込みです。",
      supportingFacts: [`超過見込み: ${formatYen(Math.abs(input.remainingSpendable))}`],
      actionLabel: "今月の支出を見直しましょう。",
    };
  }

  if (input.overBudgetCategoryCount > 0) {
    return {
      reason: "over_budget_categories",
      headline: "予算を超えているカテゴリがあります。",
      supportingFacts: [`超過カテゴリ数: ${input.overBudgetCategoryCount}件`],
      actionLabel: "家計簿でどのカテゴリか確認しましょう。",
    };
  }

  if (input.spendingPace === "over_pace") {
    return {
      reason: "spending_pace_fast",
      headline: "月の進み具合より支出のペースがやや速めです。",
      supportingFacts: [],
      actionLabel: "残りの日数を意識して支出を確認しましょう。",
    };
  }

  if (input.monthNeedingReconciliation) {
    return {
      reason: "review_needs_reconciliation",
      headline: "取引の変更で、保存済みの月末レビューの割り当てとズレが出ています。",
      supportingFacts: [`対象月: ${input.monthNeedingReconciliation}`],
      actionLabel: "月末レビューを再確認しましょう。",
    };
  }

  if (input.hasUnresolvedLargeExpense) {
    return {
      reason: "unresolved_large_expense",
      headline: "大きめの支出について、特別費にするか確認が必要です。",
      supportingFacts: [],
      actionLabel: "支出の確認に答えましょう。",
    };
  }

  if (input.hasUnreviewedPastMonth) {
    return {
      reason: "unreviewed_past_month",
      headline: "まだレビューしていない過去の月があります。",
      supportingFacts: input.unreviewedPastMonth ? [`対象月: ${input.unreviewedPastMonth}`] : [],
      actionLabel: "月末レビューを完了させましょう。",
    };
  }

  if (input.budgetAdjustmentSuggestionCount > 0) {
    return {
      reason: "budget_adjustment_suggested",
      headline: "カテゴリ予算の見直し提案があります。",
      supportingFacts: [`対象カテゴリ数: ${input.budgetAdjustmentSuggestionCount}件`],
      actionLabel: "提案内容を確認しましょう。",
    };
  }

  if (input.hasSpecialReserveSuggestion) {
    return {
      reason: "special_reserve_suggested",
      headline: "特別費の積立額を見直す余地があります。",
      supportingFacts: [],
      actionLabel: "見直し提案を確認しましょう。",
    };
  }

  // 生活防衛資金・貯金目標は「事実の共有」に留め、既存ロジックが決めていない
  // 資金配分の優先順位(投資を止める、貯金額を増やす等)をここで新しく提案しない。
  if (input.emergencyFundMonthsCovered !== null && input.emergencyFundMonthsCovered < input.emergencyFundTargetMonths) {
    return {
      reason: "emergency_fund_low",
      headline: "生活防衛資金は目標に対してまだ途中です。",
      supportingFacts: [
        `現在: 約${input.emergencyFundMonthsCovered.toFixed(1)}ヶ月分 / 目標: ${input.emergencyFundTargetMonths}ヶ月分`,
      ],
      // 「増やしていきましょう」は弱いとはいえ行動推奨になるため、既存ロジックが
      // 決めていない資金配分の優先順位(防衛資金を優先する等)を示唆しないよう、
      // より事実確認寄りの文言にする。
      actionLabel: "生活防衛資金の目安を確認しておきましょう。",
    };
  }

  if (input.goalFeasibility === "insufficient_even_with_bonus") {
    return {
      reason: "goal_insufficient",
      headline: "貯金目標は、現在のペースでは期限までに届かない見込みです。",
      supportingFacts: [],
      actionLabel: "目標達成プランを見直してみましょう。",
    };
  }

  if (input.goalFeasibility === "achievable_with_bonus") {
    return {
      reason: "goal_achievable_with_bonus",
      // このfeasibilityは、ユーザーが確定した bonusAllocated ではなく、期限内に見込まれる
      // ボーナスの理論上の合計額(bonusInWindowTotal)で判定されている。ボーナスを充てる
      // ことが既に確定しているかのように読める言い切りは避け、「充てる場合」という
      // 条件付きの表現にする。
      headline: "貯金目標は、期限内のボーナスも目標に充てる場合、達成できる範囲です。",
      supportingFacts: [],
      actionLabel: "必要なら目標達成プランを確認しましょう。",
    };
  }

  // 支出取引が1件もない場合のみ「記録がまだない」とする。1件以上ある場合の「順調」判定は
  // hasEnoughActualData()(5件以上)とは異なる基準で構わない— こちらは「困ったらここ」が
  // 誤った安心感を与えないための最低限のガードであり、月次実績の学習可否とは目的が違う。
  if (input.transactionCountThisMonth === 0) {
    return {
      reason: "not_enough_data",
      headline: "まだ今月の収支記録がありません。",
      supportingFacts: [],
      actionLabel: "今月の収支を記録していきましょう。",
    };
  }

  return {
    reason: "on_track",
    headline: "順調です。今月は大きな問題は見つかっていません。",
    supportingFacts: [],
    actionLabel: "このまま記録を続けましょう。",
  };
}
