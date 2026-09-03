// 積立クエスト(/tools/investment-tracker)のデータ永続化・計算ロジック。
// すべて「万円」単位で計算する(既存の積立シミュレーターと違い、円への変換は行わない)。

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  goalMan: number;
  years: number;
  assumedRate: number;
  investedMan: number;
  savingsMan: number;
  monthlyContributionMan: number;
  actual: {
    principalMan: number | null;
    currentValueMan: number | null;
    elapsedYears: number | null;
  };
  createdAt: string;
};

export type NewGoalInput = Omit<Goal, "id" | "createdAt" | "actual"> & {
  actual?: Partial<Goal["actual"]>;
};

const STORAGE_KEY = "investment-tracker:goals:v1";

export function createGoal(input: NewGoalInput): Goal {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    actual: {
      principalMan: input.actual?.principalMan ?? null,
      currentValueMan: input.actual?.currentValueMan ?? null,
      elapsedYears: input.actual?.elapsedYears ?? null,
    },
  };
}

export function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveGoals(goals: Goal[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // localStorageが使えない(プライベートモード等)場合は保存を諦める
  }
}

export function formatMan(n: number, decimals = 0) {
  if (!Number.isFinite(n)) return "-";
  return `${n.toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}万円`;
}

export function formatYearsMonths(totalMonths: number) {
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m}ヶ月`;
  if (m === 0) return `${y}年`;
  return `${y}年${m}ヶ月`;
}

export type RequiredMonthlyResult = {
  monthlyPaymentMan: number;
  totalContributionMan: number;
  totalInterestMan: number;
  months: number;
  alreadyAchievable: boolean;
};

// 目標額に到達するために必要な毎月の積立額(既存 investment-calculator の「目標額から逆算」と同じ式)
export function requiredMonthlyPayment(goal: Goal): RequiredMonthlyResult | null {
  const { goalMan, years, assumedRate, investedMan, savingsMan } = goal;
  if (!Number.isFinite(goalMan) || goalMan <= 0) return null;
  if (!Number.isFinite(years) || years <= 0) return null;
  if (!Number.isFinite(assumedRate) || assumedRate < 0) return null;

  const months = Math.round(years * 12);
  const monthlyRate = assumedRate / 100 / 12;

  const futureValueOfAssets = investedMan * Math.pow(1 + monthlyRate, months) + savingsMan;
  const remainingGoal = Math.max(0, goalMan - futureValueOfAssets);

  const monthlyPaymentMan =
    remainingGoal === 0
      ? 0
      : monthlyRate === 0
        ? remainingGoal / months
        : (remainingGoal * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);

  const totalContributionMan = monthlyPaymentMan * months;
  const totalInterestMan = goalMan - totalContributionMan - investedMan - savingsMan;

  return {
    monthlyPaymentMan,
    totalContributionMan,
    totalInterestMan,
    months,
    alreadyAchievable: remainingGoal === 0,
  };
}

export type ProjectedFutureResult = {
  totalFutureValueMan: number;
  totalContributionMan: number;
  totalInterestMan: number;
  months: number;
};

// 実際の積立額を続けた場合に何年後いくらになるか(既存の「積立額から将来額」と同じ式)
export function projectedFutureValue(goal: Goal): ProjectedFutureResult | null {
  const { monthlyContributionMan, years, assumedRate, investedMan, savingsMan } = goal;
  if (!Number.isFinite(monthlyContributionMan) || monthlyContributionMan < 0) return null;
  if (!Number.isFinite(years) || years <= 0) return null;
  if (!Number.isFinite(assumedRate) || assumedRate < 0) return null;

  const months = Math.round(years * 12);
  const monthlyRate = assumedRate / 100 / 12;

  const futureValueOfAssets = investedMan * Math.pow(1 + monthlyRate, months) + savingsMan;
  const futureValueOfContributions =
    monthlyRate === 0
      ? monthlyContributionMan * months
      : (monthlyContributionMan * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate;

  const totalFutureValueMan = futureValueOfAssets + futureValueOfContributions;
  const totalContributionMan = monthlyContributionMan * months;
  const totalInterestMan = totalFutureValueMan - totalContributionMan - investedMan - savingsMan;

  return { totalFutureValueMan, totalContributionMan, totalInterestMan, months };
}

// 実績年利(CAGR)。元本→評価額が経過年数で何%の年利で増えたか
export function actualAnnualRate(actual: Goal["actual"]): number | null {
  const { principalMan, currentValueMan, elapsedYears } = actual;
  if (!principalMan || principalMan <= 0) return null;
  if (currentValueMan === null || currentValueMan < 0) return null;
  if (!elapsedYears || elapsedYears <= 0) return null;

  const rate = Math.pow(currentValueMan / principalMan, 1 / elapsedYears) - 1;
  return rate * 100;
}

// この目標の「現在の資産」として扱う値。資産タブの総資産(portfolioAssetsMan)は家計全体で
// 1つしかない値のため、複数の目標にそのまま渡すと、同じ資産が複数の目標の達成根拠として
// 重複計上されてしまう(例: 総資産500万円 → 目標額30万円の目標も、目標額200万円の目標も、
// どちらも単独で「達成」扱いになる)。目標が1件だけのときに限り、従来通り資産タブとの連携
// (portfolioAssetsManをそのまま現在資産として扱う)を維持する互換ルールとし、2件以上ある
// ときは各目標自身の入力値(実績記録があればそちらを優先、なければ投資元本+貯金)に
// フォールバックする(GPTとのPDCA相談で確定)。progressRatio・達成判定など、この目標の
// 「現在資産」を必要とする箇所は必ずこの関数を経由し、判定を分散させないこと。
export function effectiveCurrentAssetsMan(
  goal: Goal,
  goalCount: number,
  portfolioAssetsMan: number | null = null
): number {
  if (goalCount === 1 && portfolioAssetsMan !== null) return portfolioAssetsMan;
  return goal.actual.currentValueMan ?? goal.investedMan + goal.savingsMan;
}

// 現在の資産 ÷ 目標額。0〜1にクランプ。currentAssetsManValueは呼び出し側が
// effectiveCurrentAssetsMan()で解決した値を渡すこと(このAPI単体では複数目標の
// 重複計上を防げない)。
export function progressRatio(goal: Goal, currentAssetsManValue: number): number {
  if (!Number.isFinite(goal.goalMan) || goal.goalMan <= 0) return 0;
  return Math.min(1, Math.max(0, currentAssetsManValue / goal.goalMan));
}

export type Level = { level: number; title: string };

const LEVELS: { threshold: number; level: number; title: string }[] = [
  { threshold: 0, level: 1, title: "駆け出し投資家" },
  { threshold: 0.1, level: 2, title: "積立の見習い" },
  { threshold: 0.3, level: 3, title: "コツコツ戦士" },
  { threshold: 0.6, level: 4, title: "ゴール目前の賢者" },
  { threshold: 1, level: 5, title: "目標達成の勇者" },
];

export function levelForProgress(ratio: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (ratio >= l.threshold) current = l;
  }
  return { level: current.level, title: current.title };
}

export type PaceStatus = "ahead" | "onTrack" | "behind" | "unknown";

// 実際の積立額が、目標達成に必要な積立額に対してどれくらいのペースか
export function paceStatus(goal: Goal): PaceStatus {
  const required = requiredMonthlyPayment(goal);
  if (!required || required.alreadyAchievable) return required?.alreadyAchievable ? "ahead" : "unknown";
  if (required.monthlyPaymentMan <= 0) return "unknown";

  const ratio = goal.monthlyContributionMan / required.monthlyPaymentMan;
  if (ratio >= 1.05) return "ahead";
  if (ratio >= 0.95) return "onTrack";
  return "behind";
}

export const DEFAULT_EMOJIS = ["🏖️", "🏠", "🎓", "🚗", "👴", "💍", "🌍", "💰"];

export type Achievement = {
  id: string;
  title: string;
  description: string;
  check: (goals: Goal[], portfolioAssetsMan?: number | null) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-goal",
    title: "はじめの一歩",
    description: "目標を1つ作成する",
    check: (goals) => goals.length >= 1,
  },
  {
    id: "record-actual",
    title: "運用の記録者",
    description: "実績(投資元本・評価額)を1つ記録する",
    check: (goals) => goals.some((g) => actualAnnualRate(g.actual) !== null),
  },
  {
    id: "positive-return",
    title: "プラス運用",
    description: "実績年利がプラスの目標を持つ",
    check: (goals) => goals.some((g) => (actualAnnualRate(g.actual) ?? -1) > 0),
  },
  {
    id: "multi-goal",
    title: "欲張り投資家",
    description: "3つ以上の目標を同時に管理する",
    check: (goals) => goals.length >= 3,
  },
  {
    id: "all-on-track",
    title: "ペースの達人",
    description: "すべての目標が順調ペースになる",
    check: (goals) => goals.length > 0 && goals.every((g) => paceStatus(g) !== "behind"),
  },
  {
    id: "goal-achieved",
    title: "目標達成",
    description: "いずれかの目標を100%達成する",
    check: (goals, portfolioAssetsMan) =>
      goals.some((g) => progressRatio(g, effectiveCurrentAssetsMan(g, goals.length, portfolioAssetsMan ?? null)) >= 1),
  },
];

export function unlockedAchievements(goals: Goal[], portfolioAssetsMan: number | null = null): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(goals, portfolioAssetsMan));
}

const PLAYER_TITLES = [
  "見習いプランナー",
  "駆け出し投資家",
  "積立の実践者",
  "資産形成の探求者",
  "コツコツ戦略家",
  "積立クエストの賢者",
  "伝説の資産家",
];

export function playerRank(goals: Goal[], portfolioAssetsMan: number | null = null): { level: number; title: string } {
  const unlockedCount = unlockedAchievements(goals, portfolioAssetsMan).length;
  return { level: unlockedCount + 1, title: PLAYER_TITLES[unlockedCount] };
}
