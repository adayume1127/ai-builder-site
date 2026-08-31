// 資産ポートフォリオ(国内株式/米国株式/投資信託/金銀プラチナ)のスナップショット管理。
// 積立クエストの「目標」とは独立した、口座全体の資産推移を記録する。
// すべて「円」単位で計算する(v1は万円単位だったが、v2で円単位に変更した)。

export type AssetCategoryKey = "domesticStocks" | "usStocks" | "mutualFunds" | "preciousMetals" | "cashSavings";

export type AssetCategoryDef = {
  key: AssetCategoryKey;
  label: string;
  // datavizスキルのカテゴリカルパレット(隣接ペアでCVD検証済み、ダークサーフェス用)
  color: string;
};

export const ASSET_CATEGORIES: AssetCategoryDef[] = [
  { key: "domesticStocks", label: "国内株式", color: "#3987e5" },
  { key: "usStocks", label: "米国株式", color: "#d95926" },
  { key: "mutualFunds", label: "投資信託", color: "#199e70" },
  { key: "preciousMetals", label: "金銀プラチナ", color: "#c98500" },
  { key: "cashSavings", label: "預金", color: "#a855f7" },
];

// 家計簿と連動せず手入力するカテゴリ(預金は家計簿の収支から自動計算する)
export type ManualAssetCategoryKey = Exclude<AssetCategoryKey, "cashSavings">;
export const MANUAL_ASSET_CATEGORIES: { key: ManualAssetCategoryKey; label: string; color: string }[] =
  ASSET_CATEGORIES.filter(
    (c): c is AssetCategoryDef & { key: ManualAssetCategoryKey } => c.key !== "cashSavings"
  );

export type CategoryEntry = { currentValueYen: number; profitYen: number; monthlyContributionYen: number };

export type CategoryBreakdown = Record<AssetCategoryKey, CategoryEntry>;

function zeroEntry(): CategoryEntry {
  return { currentValueYen: 0, profitYen: 0, monthlyContributionYen: 0 };
}

export function emptyBreakdown(): CategoryBreakdown {
  return {
    domesticStocks: zeroEntry(),
    usStocks: zeroEntry(),
    mutualFunds: zeroEntry(),
    preciousMetals: zeroEntry(),
    cashSavings: zeroEntry(),
  };
}

// 家計簿の記録(初期預金額+収入-支出の累計)から「預金」カテゴリの値を自動算出する
export function deriveCashCategory(openingCashBalanceYen: number, netYen: number, thisMonthNetYen: number): CategoryEntry {
  return {
    currentValueYen: openingCashBalanceYen + netYen,
    profitYen: 0,
    monthlyContributionYen: Math.max(0, thisMonthNetYen),
  };
}

export type PortfolioSnapshot = {
  id: string;
  date: string; // YYYY-MM-DD(ローカル日付、1日1件)
  categories: CategoryBreakdown;
};

const STORAGE_KEY = "investment-tracker:portfolio-snapshots:v4";
const LEGACY_V3_KEY = "investment-tracker:portfolio-snapshots:v3"; // 預金カテゴリなし
const LEGACY_V2_KEY = "investment-tracker:portfolio-snapshots:v2"; // 円単位・毎月積立額なし
const LEGACY_V1_KEY = "investment-tracker:portfolio-snapshots:v1"; // 万円単位

type LegacyV1CategoryEntry = { currentValueMan: number; profitMan: number };
type LegacyV1Snapshot = { id: string; date: string; categories: Record<AssetCategoryKey, LegacyV1CategoryEntry> };

type LegacyV2CategoryEntry = { currentValueYen: number; profitYen: number };
type LegacyV2Snapshot = { id: string; date: string; categories: Record<AssetCategoryKey, LegacyV2CategoryEntry> };

type LegacyV3Snapshot = { id: string; date: string; categories: Record<AssetCategoryKey, CategoryEntry> };

// v1〜v3は「預金」カテゴリが存在しなかったため、当時の4カテゴリのみを対象にする
function migrateV1ToV2(s: LegacyV1Snapshot): LegacyV2Snapshot {
  const categories = {} as Record<AssetCategoryKey, LegacyV2CategoryEntry>;
  for (const cat of MANUAL_ASSET_CATEGORIES) {
    const legacy = s.categories[cat.key];
    categories[cat.key] = { currentValueYen: legacy.currentValueMan * 10000, profitYen: legacy.profitMan * 10000 };
  }
  return { id: s.id, date: s.date, categories };
}

function migrateV2ToV3(s: LegacyV2Snapshot): LegacyV3Snapshot {
  const categories = {} as Record<AssetCategoryKey, CategoryEntry>;
  for (const cat of MANUAL_ASSET_CATEGORIES) {
    const legacy = s.categories[cat.key];
    categories[cat.key] = { ...legacy, monthlyContributionYen: 0 };
  }
  return { id: s.id, date: s.date, categories };
}

function migrateV3ToV4(s: LegacyV3Snapshot): PortfolioSnapshot {
  const categories = { ...s.categories, cashSavings: zeroEntry() } as CategoryBreakdown;
  return { id: s.id, date: s.date, categories };
}

export function loadSnapshots(): PortfolioSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.sort((a: PortfolioSnapshot, b: PortfolioSnapshot) => a.date.localeCompare(b.date));
    }

    const v3Raw = window.localStorage.getItem(LEGACY_V3_KEY);
    if (v3Raw) {
      const v3Parsed = JSON.parse(v3Raw);
      if (Array.isArray(v3Parsed)) {
        const migrated = v3Parsed
          .map(migrateV3ToV4)
          .sort((a: PortfolioSnapshot, b: PortfolioSnapshot) => a.date.localeCompare(b.date));
        saveSnapshots(migrated);
        return migrated;
      }
    }

    const v2Raw = window.localStorage.getItem(LEGACY_V2_KEY);
    if (v2Raw) {
      const v2Parsed = JSON.parse(v2Raw);
      if (Array.isArray(v2Parsed)) {
        const migrated = v2Parsed
          .map(migrateV2ToV3)
          .map(migrateV3ToV4)
          .sort((a: PortfolioSnapshot, b: PortfolioSnapshot) => a.date.localeCompare(b.date));
        saveSnapshots(migrated);
        return migrated;
      }
    }

    const v1Raw = window.localStorage.getItem(LEGACY_V1_KEY);
    if (v1Raw) {
      const v1Parsed = JSON.parse(v1Raw);
      if (Array.isArray(v1Parsed)) {
        const migrated = v1Parsed
          .map(migrateV1ToV2)
          .map(migrateV2ToV3)
          .map(migrateV3ToV4)
          .sort((a: PortfolioSnapshot, b: PortfolioSnapshot) => a.date.localeCompare(b.date));
        saveSnapshots(migrated);
        return migrated;
      }
    }

    return [];
  } catch {
    return [];
  }
}

export function saveSnapshots(snapshots: PortfolioSnapshot[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // 保存できない場合は諦める
  }
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 今日の日付の記録があれば上書き、なければ新規追加(日付順を維持)
export function upsertSnapshot(snapshots: PortfolioSnapshot[], categories: CategoryBreakdown): PortfolioSnapshot[] {
  const date = todayKey();
  const existingIndex = snapshots.findIndex((s) => s.date === date);
  if (existingIndex >= 0) {
    const next = [...snapshots];
    next[existingIndex] = { ...next[existingIndex], categories };
    return next;
  }
  return [...snapshots, { id: crypto.randomUUID(), date, categories }].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function snapshotTotals(snapshot: PortfolioSnapshot): { totalYen: number; profitYen: number; monthlyContributionYen: number } {
  return ASSET_CATEGORIES.reduce(
    (acc, cat) => {
      const entry = snapshot.categories[cat.key];
      return {
        totalYen: acc.totalYen + entry.currentValueYen,
        profitYen: acc.profitYen + entry.profitYen,
        monthlyContributionYen: acc.monthlyContributionYen + entry.monthlyContributionYen,
      };
    },
    { totalYen: 0, profitYen: 0, monthlyContributionYen: 0 }
  );
}

export function latestSnapshot(snapshots: PortfolioSnapshot[]): PortfolioSnapshot | null {
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

export function firstSnapshot(snapshots: PortfolioSnapshot[]): PortfolioSnapshot | null {
  return snapshots.length > 0 ? snapshots[0] : null;
}

export function formatYen(n: number) {
  if (!Number.isFinite(n)) return "-";
  return `${Math.round(n).toLocaleString("ja-JP")}円`;
}

// ===== シミュレーション設定(目標額・グラフ表示単位) =====

export type ChartGranularity = "month" | "halfYear" | "year";

export const GRANULARITY_LABELS: Record<ChartGranularity, string> = {
  month: "月単位",
  halfYear: "半年単位",
  year: "年単位",
};

export type PortfolioSettings = {
  targetAmountYen: number;
  chartGranularity: ChartGranularity;
  openingCashBalanceYen: number;
};

const SETTINGS_KEY = "investment-tracker:portfolio-settings:v1";

function isChartGranularity(v: unknown): v is ChartGranularity {
  return v === "month" || v === "halfYear" || v === "year";
}

export function loadPortfolioSettings(): PortfolioSettings {
  const fallback: PortfolioSettings = { targetAmountYen: 0, chartGranularity: "month", openingCashBalanceYen: 0 };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      targetAmountYen: Number(parsed?.targetAmountYen) || 0,
      chartGranularity: isChartGranularity(parsed?.chartGranularity) ? parsed.chartGranularity : "month",
      openingCashBalanceYen: Number(parsed?.openingCashBalanceYen) || 0,
    };
  } catch {
    return fallback;
  }
}

export function savePortfolioSettings(settings: PortfolioSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 保存できない場合は諦める
  }
}

// ===== シミュレーション(年利5%運用の想定推移) =====

export type SimulationPoint = { date: string; year: number; valueYen: number };

const SIMULATION_ANNUAL_RATE = 0.05;
const SIMULATION_DEFAULT_HORIZON_YEARS = 20;
const SIMULATION_MAX_HORIZON_YEARS = 40;

const GRANULARITY_MONTHS: Record<ChartGranularity, number> = { month: 1, halfYear: 6, year: 12 };

function addMonthsKey(startDate: Date, months: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 初めて資産を記録した日を起点に、その時点の資産額と直近の毎月積立額をもとに
// 年利5%で複利運用した場合の資産推移を計算する(表示間隔は granularity で指定)。
// 目標額が設定されていれば、到達するまで(最大40年)伸ばして表示する。
export function simulateGrowth(
  snapshots: PortfolioSnapshot[],
  targetAmountYen: number,
  granularity: ChartGranularity = "month"
): SimulationPoint[] {
  const first = firstSnapshot(snapshots);
  const latest = latestSnapshot(snapshots);
  if (!first || !latest) return [];

  const startValue = snapshotTotals(first).totalYen;
  const monthlyContribution = snapshotTotals(latest).monthlyContributionYen;
  const monthlyRate = SIMULATION_ANNUAL_RATE / 12;
  const startDate = new Date(first.date);

  let horizonYears = SIMULATION_DEFAULT_HORIZON_YEARS;
  if (targetAmountYen > 0) {
    let value = startValue;
    for (let year = 1; year <= SIMULATION_MAX_HORIZON_YEARS; year++) {
      for (let m = 0; m < 12; m++) value = value * (1 + monthlyRate) + monthlyContribution;
      if (value >= targetAmountYen) {
        horizonYears = year;
        break;
      }
      if (year === SIMULATION_MAX_HORIZON_YEARS) horizonYears = SIMULATION_MAX_HORIZON_YEARS;
    }
  }

  const stepMonths = GRANULARITY_MONTHS[granularity];
  const totalMonths = horizonYears * 12;
  const points: SimulationPoint[] = [{ date: first.date, year: 0, valueYen: startValue }];
  let value = startValue;
  for (let m = 1; m <= totalMonths; m++) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    if (m % stepMonths === 0 || m === totalMonths) {
      points.push({ date: addMonthsKey(startDate, m), year: m / 12, valueYen: value });
    }
  }
  return points;
}

// スナップショットを granularity の期間ごとに束ね、各期間で最新の1件だけを残す
export function bucketSnapshotsByGranularity(
  snapshots: PortfolioSnapshot[],
  granularity: ChartGranularity
): PortfolioSnapshot[] {
  if (granularity === "month") return snapshots;
  const map = new Map<string, PortfolioSnapshot>();
  for (const s of snapshots) {
    const [y, m] = s.date.split("-").map(Number);
    const key = granularity === "year" ? `${y}` : `${y}-H${m <= 6 ? 1 : 2}`;
    map.set(key, s);
  }
  return Array.from(map.values());
}
