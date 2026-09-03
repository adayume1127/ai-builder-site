// 家計簿タブの「家計診断」機能。
// 既存の lib/household.ts(日々の収支記録・カテゴリ予算・マネークエスト)とは別レイヤーで、
// ユーザーが最初に申告する収入・固定費・生活費・貯金・目標(HouseholdProfile)をもとに、
// 「無理なく続けられる家計」を決定論的な計算式だけで診断する。
// すべて「円」単位・月額ベースで計算する。AIによる金額推定は行わない。

import type { BudgetCategory, BudgetTransaction } from "@/lib/household";

// ===== 定数 =====

// GoalStep.tsxのGOAL_TYPES選択肢のうち、「特定目的のために確保した一部の金額」ではなく
// 「資産全体」が進捗そのものを表す唯一の型。文字列の重複定義によるズレを防ぐため、
// GoalStep.tsx側もこの定数を参照する(GPTとのPDCA相談、資産タブ連携の修正)。
export const FIRE_GOAL_TYPE = "FIRE / 資産形成";

export const PROVISIONAL_BUFFER_RATE = 0.05;
export const PROVISIONAL_BUFFER_MIN = 5000;
export const DISCRETIONARY_FLOOR_RATE = 0.08;
export const DISCRETIONARY_FLOOR_MIN = 10000;
// STEP3「よく分からない」時の仮生活費(手取りに対する比率)。スペックに式の指定がないため、
// 一般的な生活費目安として手取りの3割を仮置きする独自定数。
export const PROVISIONAL_LIVING_EXPENSE_RATE = 0.3;

// STEP3「総額だけ分かる」時に、総額を各カテゴリへ仮配分する比率(合計100%)
const VARIABLE_EXPENSE_SPLIT_RATIOS = {
  food: 0.4,
  dailyGoods: 0.1,
  transportation: 0.15,
  dining: 0.1,
  entertainment: 0.1,
  beauty: 0.05,
  social: 0.05,
  other: 0.05,
} as const;

// ===== 型 =====

export type DataConfidenceState = "confirmed" | "estimated" | "unknown";

export type BonusPayment = { month: string; expectedAmountYen: number }; // month = "YYYY-MM"

export type HouseholdProfile = {
  income: {
    monthlyTakeHome: number;
    otherMonthlyIncome: number;
    annualBonus: number; // 後方互換のため残す。診断結果の参考表示にのみ使い、目標達成計算には使わない
    bonusPayments: BonusPayment[]; // 支給予定ごとの年月・金額。空配列 = 未回答
  };
  fixedExpenses: {
    housing: number;
    utilities: number;
    communication: number;
    insurance: number;
    car: number;
    loans: number;
    subscriptions: number;
    other: number;
  };
  livingExpenseMode: "detailed" | "totalOnly" | "unknown";
  baselineVariableExpenses: {
    food: number;
    dailyGoods: number;
    transportation: number;
    dining: number;
    entertainment: number;
    beauty: number;
    social: number;
    other: number;
  };
  savings: {
    cashSavingsBalance: number;
    monthlyCashSavings: number;
    monthlyInvestment: number;
    otherSavings: number;
  };
  emergencyFundMonths: 3 | 6 | 12;
  // goalは「ユーザーが設定した目標条件」だけでなく、目標達成シミュレーション用の選択値
  // (alreadyEarmarkedAmount / bonusAllocated)も含む。HouseholdProfileは診断時の完全な
  // 事実スナップショットではなく、目標に関してはユーザーが後から調整する値も保持する。
  goal?: {
    type: string;
    targetAmount?: number;
    targetDate?: string;
    // この目標のために既に確保している金額。undefined/0 = まだ何も確保していない。
    // profile.savings.cashSavingsBalance(現金貯金の全額)をそのまま流用しない
    // (預金全体と、特定の目標のために確保した額は別概念のため)。
    alreadyEarmarkedAmount?: number;
    // 期限内に見込まれるボーナスのうち、この目標に充てると確定した金額。undefined = 未確定。
    // GoalFundingPlanのsuggestedBonusAllocatedはUI初期表示にのみ使い、ユーザーが確定するまで
    // ここには保存しない。
    bonusAllocated?: number;
  };
  confidence: {
    income: DataConfidenceState;
    fixedExpenses: DataConfidenceState;
    livingExpenses: DataConfidenceState;
    specialExpenses: DataConfidenceState;
  };
  createdAt: string;
  updatedAt: string;
};

export type SpecialExpenseMode = "known" | "partial" | "unknown";

export type SpecialExpense = {
  id: string;
  category: string;
  amount: number; // 年間の想定金額
  recurrence: "one_time" | "annual" | "unknown";
  expectedMonth?: number; // 1-12
  memo?: string;
  source: "manual" | "learned"; // 大口支出からの学習提案で追加されたか
};

export type HouseholdDiagnosisSettings = { specialExpenseMode: SpecialExpenseMode };

export function createEmptyHouseholdProfile(): HouseholdProfile {
  const now = new Date().toISOString();
  return {
    income: { monthlyTakeHome: 0, otherMonthlyIncome: 0, annualBonus: 0, bonusPayments: [] },
    fixedExpenses: {
      housing: 0,
      utilities: 0,
      communication: 0,
      insurance: 0,
      car: 0,
      loans: 0,
      subscriptions: 0,
      other: 0,
    },
    livingExpenseMode: "unknown",
    baselineVariableExpenses: {
      food: 0,
      dailyGoods: 0,
      transportation: 0,
      dining: 0,
      entertainment: 0,
      beauty: 0,
      social: 0,
      other: 0,
    },
    savings: { cashSavingsBalance: 0, monthlyCashSavings: 0, monthlyInvestment: 0, otherSavings: 0 },
    emergencyFundMonths: 3,
    confidence: { income: "unknown", fixedExpenses: "unknown", livingExpenses: "unknown", specialExpenses: "unknown" },
    createdAt: now,
    updatedAt: now,
  };
}

// ===== localStorage保存 =====

const PROFILE_KEY = "investment-tracker:household-diagnosis:profile:v1";
const SPECIAL_EXPENSES_KEY = "investment-tracker:household-diagnosis:special-expenses:v1";
const SETTINGS_KEY = "investment-tracker:household-diagnosis:settings:v1";

export function loadHouseholdProfile(): HouseholdProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // 既存ユーザーのデータには income.bonusPayments が存在しないため、読み込み時に
    // 空配列を補う軽量マイグレーション(withSpecialExpenseCategoryと同じ考え方)。
    if (!Array.isArray(parsed.income?.bonusPayments)) {
      parsed.income = { ...parsed.income, bonusPayments: [] };
    }
    return parsed as HouseholdProfile;
  } catch {
    return null;
  }
}

export function saveHouseholdProfile(profile: HouseholdProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // 保存できない場合は諦める
  }
}

export function loadSpecialExpenses(): SpecialExpense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SPECIAL_EXPENSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSpecialExpenses(items: SpecialExpense[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SPECIAL_EXPENSES_KEY, JSON.stringify(items));
  } catch {
    // 保存できない場合は諦める
  }
}

export function addSpecialExpense(items: SpecialExpense[], input: Omit<SpecialExpense, "id">): SpecialExpense[] {
  return [...items, { ...input, id: crypto.randomUUID() }];
}

export function removeSpecialExpense(items: SpecialExpense[], id: string): SpecialExpense[] {
  return items.filter((e) => e.id !== id);
}

export function loadHouseholdDiagnosisSettings(): HouseholdDiagnosisSettings {
  const fallback: HouseholdDiagnosisSettings = { specialExpenseMode: "unknown" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const mode = parsed?.specialExpenseMode;
    return { specialExpenseMode: mode === "known" || mode === "partial" || mode === "unknown" ? mode : "unknown" };
  } catch {
    return fallback;
  }
}

export function saveHouseholdDiagnosisSettings(settings: HouseholdDiagnosisSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 保存できない場合は諦める
  }
}

// ===== 基本集計 =====

export function totalIncome(profile: HouseholdProfile): number {
  return profile.income.monthlyTakeHome + profile.income.otherMonthlyIncome;
}

export function fixedExpensesTotal(profile: HouseholdProfile): number {
  const f = profile.fixedExpenses;
  return f.housing + f.utilities + f.communication + f.insurance + f.car + f.loans + f.subscriptions + f.other;
}

export function variableExpensesTotal(profile: HouseholdProfile): number {
  const v = profile.baselineVariableExpenses;
  return v.food + v.dailyGoods + v.transportation + v.dining + v.entertainment + v.beauty + v.social + v.other;
}

export function totalExpenses(profile: HouseholdProfile): number {
  return fixedExpensesTotal(profile) + variableExpensesTotal(profile);
}

export function surplus(profile: HouseholdProfile): number {
  return totalIncome(profile) - totalExpenses(profile);
}

export function fixedExpenseRate(profile: HouseholdProfile): number {
  const income = totalIncome(profile);
  return income > 0 ? fixedExpensesTotal(profile) / income : 0;
}

export function housingRate(profile: HouseholdProfile): number {
  const income = totalIncome(profile);
  return income > 0 ? profile.fixedExpenses.housing / income : 0;
}

export function savingsRate(profile: HouseholdProfile): number {
  const income = totalIncome(profile);
  if (income <= 0) return 0;
  return (profile.savings.monthlyCashSavings + profile.savings.monthlyInvestment) / income;
}

export function variableExpenseRate(profile: HouseholdProfile): number {
  const income = totalIncome(profile);
  return income > 0 ? variableExpensesTotal(profile) / income : 0;
}

// STEP3「総額だけ分かる」: 総額を一般的な支出配分比で仮に内訳へ分解する(confidence="estimated"を想定)
export function apportionVariableExpenses(totalAmount: number): HouseholdProfile["baselineVariableExpenses"] {
  const amount = Math.max(totalAmount, 0);
  return {
    food: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.food),
    dailyGoods: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.dailyGoods),
    transportation: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.transportation),
    dining: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.dining),
    entertainment: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.entertainment),
    beauty: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.beauty),
    social: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.social),
    other: Math.round(amount * VARIABLE_EXPENSE_SPLIT_RATIOS.other),
  };
}

// STEP3「よく分からない」: 手取りの一定割合を仮の生活費とし、全額を「その他」に計上する(confidence="unknown")
export function provisionalVariableExpenses(profile: HouseholdProfile): HouseholdProfile["baselineVariableExpenses"] {
  const amount = Math.round(totalIncome(profile) * PROVISIONAL_LIVING_EXPENSE_RATE);
  return { food: 0, dailyGoods: 0, transportation: 0, dining: 0, entertainment: 0, beauty: 0, social: 0, other: amount };
}

// ===== 年間特別費 =====

// 月間特別費の積立額。分かる/一部だけ分かる/分からない、で計算を切り替える。
export function monthlySpecialExpenseReserve(
  profile: HouseholdProfile,
  specialExpenses: SpecialExpense[],
  mode: SpecialExpenseMode
): number {
  const provisionalBuffer = Math.max(totalIncome(profile) * PROVISIONAL_BUFFER_RATE, PROVISIONAL_BUFFER_MIN);
  if (mode === "unknown") return provisionalBuffer;

  const annualKnown = specialExpenses.reduce((sum, e) => sum + Math.max(e.amount, 0), 0);
  const monthlyFromKnown = annualKnown / 12;

  if (mode === "partial") {
    // 把握できていない分の存在を見込み、予備費との大きい方を採用する
    return Math.max(monthlyFromKnown, provisionalBuffer);
  }
  return monthlyFromKnown;
}

// ===== 貯金余力 =====

export function discretionaryFloor(income: number): number {
  return Math.max(income * DISCRETIONARY_FLOOR_RATE, DISCRETIONARY_FLOOR_MIN);
}

export type RecommendationMode = "normal" | "cashflow_recovery";

export function availableForSavings(profile: HouseholdProfile, specialReserve: number): number {
  const income = totalIncome(profile);
  const floor = discretionaryFloor(income);
  return income - fixedExpensesTotal(profile) - variableExpensesTotal(profile) - specialReserve - floor;
}

export function recommendationMode(available: number): RecommendationMode {
  return available <= 0 ? "cashflow_recovery" : "normal";
}

export type SavingsPlans = { safeSavings: number; standardSavings: number; challengeSavings: number };

// SavingsPlansのうちユーザーが選ぶ1段階。recommendMonthlyBudget()へ渡し、
// どのプランを今月の予算のベースにするかを決める(Cycle3: 診断結果からのプラン選択)。
export type SavingsPlanTier = "safe" | "standard" | "challenge";

// 安全/標準/チャレンジの3段階。生活費の確度が低い場合は標準プランを保守化する。
export function computeSavingsPlans(available: number, livingExpensesConfidence: DataConfidenceState): SavingsPlans {
  const base = Math.max(available, 0);
  const safeSavings = base * 0.5;
  const challengeSavings = base;
  const standardSavings = livingExpensesConfidence === "unknown" ? base * 0.5 : base * 0.75;
  return { safeSavings, standardSavings, challengeSavings };
}

// ===== 貯金目標とボーナスの統合(目標達成プラン) =====
//
// このセクションはHouseholdProfile.goal起点の「目標達成プラン」を計算する。
// recommendMonthlyBudget()・MonthlyBudget・「今月あと使えるお金」には一切影響しない、
// 独立した派生計算(表示専用)。annualBonusは使わず、bonusPaymentsだけをsource of truthとする。

// targetDateが今月以前の場合はnullを返す(remainingMonths<=0は月額換算できないため)。
// このremainingMonthsの数え方(暦月差)は、bonusAmountWithinDeadline()の「来月から期限月まで」
// という判定範囲と一致する(例: 今日2026-09、期限2027-06 → 9。来月10月〜期限6月の9ヶ月と対応)。
function remainingMonthsUntil(targetDate: string | undefined, today: Date = new Date()): number | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return null;
  const remainingMonths = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
  return remainingMonths > 0 ? remainingMonths : null;
}

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// 期限内(来月〜期限月、期限月を含む)に支給予定のボーナス合計額。
// 目標達成プランは「これから期限までに作る」未来の資金計画であるため、当月分は対象外とし、
// 来月以降(まだ受け取っていない支給予定)だけを数える。
// 注意: alreadyEarmarkedAmountはcashSavingsBalance(現金貯金の全額)とは別概念であり、
// 「当月分のボーナスがcashSavingsBalanceに含まれているから二重計上になる」という意味ではない
// (alreadyEarmarkedAmountに何が含まれるかはユーザーの申告次第で、自動連動しない)。
export function bonusAmountWithinDeadline(
  bonusPayments: BonusPayment[],
  targetDate: string | undefined,
  today: Date = new Date()
): number {
  if (!targetDate) return 0;
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return 0;
  const targetMonth = monthKeyOf(target);
  const nextMonth = monthKeyOf(new Date(today.getFullYear(), today.getMonth() + 1, 1));
  return bonusPayments
    .filter((p) => p.month >= nextMonth && p.month <= targetMonth)
    // localStorageの直接編集等で不正な値(NaN等)が紛れ込んでも合計を壊さないよう防御する
    .reduce((sum, p) => sum + (Number.isFinite(p.expectedAmountYen) ? Math.max(p.expectedAmountYen, 0) : 0), 0);
}

export type GoalFeasibility = "on_track_without_bonus" | "achievable_with_bonus" | "insufficient_even_with_bonus";

// BudgetPlanAdopt・SavingsQuestCard等、複数画面で同じ達成可能性の説明文を出すための共有関数。
// 表示文言を画面ごとに個別定義すると、将来どちらかだけ更新されて表現がズレる恐れがあるため一元化する。
export function goalFeasibilityMessage(feasibility: GoalFeasibility): string {
  switch (feasibility) {
    case "on_track_without_bonus":
      return "貯金目標: 家計診断のおすすめ額を毎月続ければ、期限までに届く見込みです。";
    case "achievable_with_bonus":
      return "貯金目標: 家計診断のおすすめ額に加え、期限内のボーナスも充てれば届く見込みです。";
    case "insufficient_even_with_bonus":
      return "貯金目標: 家計診断のおすすめ額を毎月続けても、期限までには届かない見込みです。";
  }
}

export type GoalFundingPlan = {
  // 目標に対する現在の進捗額。目的別貯金型(旅行・車・結婚など)はalreadyEarmarkedAmount
  // (この目標のために確保したと申告した金額)、FIRE/資産形成型は資産タブの実際の総資産額を使う。
  // goal.type によって意味するもの(source of truth)が異なる点に注意(GPTとのPDCA相談で確定)。
  progressAmount: number;
  progressRatio: number; // min(progressAmount / targetAmount, 1)。進捗バー等はここを参照する
  // FIRE/資産形成型で、資産タブにまだ何も記録がない(currentAssetsYenがnull)場合はfalse。
  // 「本当に資産0円」と「まだ記録していない」を区別してUI側で表示を分けるために使う。
  // 目的別貯金型は常にtrue(alreadyEarmarkedAmountは未入力=0円として確定的に扱えるため)。
  hasAssetData: boolean;
  goalRemaining: number; // max(targetAmount - progressAmount, 0)
  remainingMonths: number;
  recommendedMonthlyCashSavings: number; // recommendMonthlyBudget().plannedCashSavings(現金分のみ、投資分は含めない)
  // 「このおすすめ現金貯金額を毎月この目標に充てた場合」のシナリオ計算値。目標専用に確保される
  // ことを保証する額ではない(生活防衛資金や他の目的との優先順位は現状コードでは強制されていない)。
  monthlyContributionTotal: number;
  bonusInWindowTotal: number; // 期限内に支給予定のボーナス合計(参考値)
  suggestedBonusAllocated: number; // UI初期表示用の提案値。goal.bonusAllocatedへは自動保存しない
  bonusAllocated: number; // ユーザーが確定した値(未確定ならsuggestedBonusAllocatedと同じ値が入る)
  fundingGap: number; // 現在のbonusAllocatedを前提にした場合の、なお不足する額
  // 理論上の達成可能性。bonusAllocated(ユーザーの現在の選択)ではなく、期限内に見込める
  // bonusInWindowTotal(上限)で判定する。fundingGapとは責務が異なる指標。
  feasibility: GoalFeasibility;
};

// bonusAllocatedOverride: HouseholdProfile.goal.bonusAllocatedに保存済みの値。undefinedなら
// まだユーザーが確定していないため、UI初期表示用にsuggestedBonusAllocatedをそのまま使う
// (呼び出し側はこの返り値のbonusAllocatedをそのままprofileへ書き戻してはいけない。
// ユーザーが確定操作をしたときだけ、そのときの値をsaveすること)。
export function computeGoalFundingPlan(
  goal: NonNullable<HouseholdProfile["goal"]>,
  // 資産タブの実際の総資産額(円)。FIRE/資産形成型の進捗計算にのみ使う。
  // null = 資産タブにまだ何も記録がない(page.tsxのhasAssetDataがfalse)。「0円」と「未記録」を
  // 区別するために、呼び出し元は0ではなくnullを渡すこと。
  currentAssetsYen: number | null,
  bonusPayments: BonusPayment[],
  recommendedMonthlyCashSavings: number,
  bonusAllocatedOverride: number | undefined,
  today: Date = new Date()
): GoalFundingPlan | null {
  if (!goal.targetAmount || goal.targetAmount <= 0) return null;
  const remainingMonths = remainingMonthsUntil(goal.targetDate, today);
  if (remainingMonths === null) return null;

  const isFireGoal = goal.type === FIRE_GOAL_TYPE;
  const progressAmount = isFireGoal ? Math.max(currentAssetsYen ?? 0, 0) : Math.max(goal.alreadyEarmarkedAmount ?? 0, 0);
  const hasAssetData = !isFireGoal || currentAssetsYen !== null;
  const progressRatio = Math.min(Math.max(progressAmount / goal.targetAmount, 0), 1);
  const goalRemaining = Math.max(goal.targetAmount - progressAmount, 0);
  const monthlyCash = Math.max(recommendedMonthlyCashSavings, 0);
  const monthlyContributionTotal = monthlyCash * remainingMonths;
  const bonusInWindowTotal = bonusAmountWithinDeadline(bonusPayments, goal.targetDate, today);
  const suggestedBonusAllocated = Math.min(Math.max(goalRemaining - monthlyContributionTotal, 0), bonusInWindowTotal);
  const bonusAllocated = Math.min(
    Math.max(bonusAllocatedOverride ?? suggestedBonusAllocated, 0),
    bonusInWindowTotal,
    goalRemaining
  );
  const fundingGap = Math.max(goalRemaining - monthlyContributionTotal - bonusAllocated, 0);
  const feasibility: GoalFeasibility =
    goalRemaining <= monthlyContributionTotal
      ? "on_track_without_bonus"
      : goalRemaining <= monthlyContributionTotal + bonusInWindowTotal
        ? "achievable_with_bonus"
        : "insufficient_even_with_bonus";

  return {
    progressAmount,
    progressRatio,
    hasAssetData,
    goalRemaining,
    remainingMonths,
    recommendedMonthlyCashSavings: monthlyCash,
    monthlyContributionTotal,
    bonusInWindowTotal,
    suggestedBonusAllocated,
    bonusAllocated,
    fundingGap,
    feasibility,
  };
}

// ===== 生活防衛資金 =====

export function essentialMonthlyExpenses(profile: HouseholdProfile): number {
  const f = profile.fixedExpenses;
  const v = profile.baselineVariableExpenses;
  return f.housing + f.utilities + f.communication + f.insurance + f.loans + v.transportation + v.food + v.dailyGoods;
}

export function emergencyFundTarget(essential: number, months: number): number {
  return essential * months;
}

// essentialが0以下(生活費が全く分からず"その他"に丸められている等)の場合はnullを返し、
// 「算出不可」として扱う(0か月やInfinityを無理に表示しない)。
export function emergencyFundMonthsCovered(cashSavingsBalance: number, essential: number): number | null {
  if (essential <= 0) return null;
  return cashSavingsBalance / essential;
}

// ===== 家計スコア(100点満点) =====

// 月間収支スコア(最大30点)。既に貯金・投資している分は「純粋な収支の黒字」から除いて二重評価しない。
export function scoreMonthlyBalance(profile: HouseholdProfile): number {
  const income = totalIncome(profile);
  if (income <= 0) return 0;
  const pureBalance = surplus(profile) - profile.savings.monthlyCashSavings - profile.savings.monthlyInvestment;
  if (pureBalance < 0) return 0;
  const ratio = pureBalance / income;
  if (ratio >= 0.1) return 30;
  if (ratio >= 0.05) return 20;
  return 10; // ほぼ±0
}

// 固定費スコア(最大20点)
export function scoreFixedExpense(profile: HouseholdProfile): number {
  const rate = fixedExpenseRate(profile);
  if (rate <= 0.4) return 20;
  if (rate <= 0.5) return 15;
  if (rate <= 0.6) return 8;
  return 3;
}

// 生活防衛資金スコア(最大20点)。0/1/3/6ヶ月の基準点の間を線形補間する。
export function scoreEmergencyFund(monthsCovered: number | null): number {
  if (monthsCovered === null) return 0;
  const m = Math.max(0, monthsCovered);
  if (m >= 6) return 20;
  if (m >= 3) return 15 + ((m - 3) / 3) * 5;
  if (m >= 1) return 7 + ((m - 1) / 2) * 8;
  return m * 7;
}

// 貯蓄習慣スコア(最大15点)
export function scoreSavingsHabit(profile: HouseholdProfile): number {
  const rate = savingsRate(profile);
  if (rate >= 0.1) return 15;
  if (rate >= 0.05) return 10;
  if (rate > 0) return 5;
  return 0;
}

// 家計余力スコア(最大15点、独自ロジック)。
// 自由費がdiscretionaryFloorを下回る「切り詰めすぎ」は減点し、floor〜3倍の適度な余白を満点帯にする。
// 5倍を超える「使われていない過剰な余力」もやや減点し、貯金/投資に回す提案につなげる。
export function scoreDiscretionary(profile: HouseholdProfile, available: number, plannedSavings: number): number {
  const income = totalIncome(profile);
  const floor = discretionaryFloor(income);
  if (floor <= 0) return 0;
  const actualDiscretionary = floor + Math.max(available - plannedSavings, 0);
  const ratio = actualDiscretionary / floor;
  if (ratio < 1) return Math.max(0, ratio * 8);
  if (ratio <= 3) return 8 + ((ratio - 1) / 2) * 7;
  if (ratio <= 5) return 15 - ((ratio - 3) / 2) * 5;
  return 10;
}

export type HouseholdScoreBreakdown = {
  monthlyBalance: number;
  fixedExpense: number;
  emergencyFund: number;
  savingsHabit: number;
  discretionary: number;
};

export type HouseholdScoreResult = { total: number; breakdown: HouseholdScoreBreakdown };

export function householdScore(
  profile: HouseholdProfile,
  monthsCovered: number | null,
  available: number,
  standardSavings: number
): HouseholdScoreResult {
  const breakdown: HouseholdScoreBreakdown = {
    monthlyBalance: Math.round(scoreMonthlyBalance(profile)),
    fixedExpense: Math.round(scoreFixedExpense(profile)),
    emergencyFund: Math.round(scoreEmergencyFund(monthsCovered)),
    savingsHabit: Math.round(scoreSavingsHabit(profile)),
    discretionary: Math.round(scoreDiscretionary(profile, available, standardSavings)),
  };
  const total =
    breakdown.monthlyBalance + breakdown.fixedExpense + breakdown.emergencyFund + breakdown.savingsHabit + breakdown.discretionary;
  return { total, breakdown };
}

// ===== 診断精度(100点満点) =====

export type DiagnosisConfidenceLabel = "仮診断" | "推定中" | "精度高め" | "安定";
export type DiagnosisConfidenceResult = { total: number; label: DiagnosisConfidenceLabel };

function confidencePoints(state: DataConfidenceState, maxPoints: number): number {
  if (state === "confirmed") return maxPoints;
  if (state === "estimated") return maxPoints * 0.5;
  return 0;
}

export function diagnosisConfidence(profile: HouseholdProfile, transactionMonthCount: number): DiagnosisConfidenceResult {
  const total =
    confidencePoints(profile.confidence.income, 25) +
    confidencePoints(profile.confidence.fixedExpenses, 25) +
    confidencePoints(profile.confidence.livingExpenses, 25) +
    confidencePoints(profile.confidence.specialExpenses, 15) +
    (Math.min(Math.max(transactionMonthCount, 0), 3) / 3) * 10;
  const rounded = Math.round(total);
  const label: DiagnosisConfidenceLabel =
    rounded >= 90 ? "安定" : rounded >= 70 ? "精度高め" : rounded >= 40 ? "推定中" : "仮診断";
  return { total: rounded, label };
}

// ===== 生活費の学習(実績支出からの基準値提案。自動適用はしない) =====

export type BaselineSuggestion = { categoryId: string; categoryLabel: string; suggestedMonthlyYen: number; monthsOfData: number };

// カテゴリごとに3ヶ月以上の実績があれば、月別支出額の中央値を基準生活費の提案として返す。
export function suggestBaselineFromTransactions(
  transactions: BudgetTransaction[],
  categories: BudgetCategory[]
): BaselineSuggestion[] {
  const expenseCategoryIds = new Set(categories.filter((c) => c.kind === "expense").map((c) => c.id));
  const byCategoryMonth = new Map<string, Map<string, number>>();

  for (const t of transactions) {
    if (!expenseCategoryIds.has(t.categoryId)) continue;
    const month = t.date.slice(0, 7);
    if (!byCategoryMonth.has(t.categoryId)) byCategoryMonth.set(t.categoryId, new Map());
    const monthMap = byCategoryMonth.get(t.categoryId)!;
    monthMap.set(month, (monthMap.get(month) ?? 0) + t.amount);
  }

  const labelById = new Map(categories.map((c) => [c.id, c.label]));
  const results: BaselineSuggestion[] = [];

  for (const [categoryId, monthMap] of byCategoryMonth) {
    const monthsOfData = monthMap.size;
    if (monthsOfData < 3) continue;
    const values = Array.from(monthMap.values()).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
    results.push({
      categoryId,
      categoryLabel: labelById.get(categoryId) ?? categoryId,
      suggestedMonthlyYen: Math.round(median),
      monthsOfData,
    });
  }

  return results;
}
