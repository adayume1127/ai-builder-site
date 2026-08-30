// 資産ポートフォリオ(国内株式/米国株式/投資信託/金銀プラチナ)のスナップショット管理。
// 積立クエストの「目標」とは独立した、口座全体の資産推移を記録する。
// すべて「円」単位で計算する(v1は万円単位だったが、v2で円単位に変更した)。

export type AssetCategoryKey = "domesticStocks" | "usStocks" | "mutualFunds" | "preciousMetals";

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
];

export type CategoryEntry = { currentValueYen: number; profitYen: number };

export type CategoryBreakdown = Record<AssetCategoryKey, CategoryEntry>;

export function emptyBreakdown(): CategoryBreakdown {
  return {
    domesticStocks: { currentValueYen: 0, profitYen: 0 },
    usStocks: { currentValueYen: 0, profitYen: 0 },
    mutualFunds: { currentValueYen: 0, profitYen: 0 },
    preciousMetals: { currentValueYen: 0, profitYen: 0 },
  };
}

export type PortfolioSnapshot = {
  id: string;
  date: string; // YYYY-MM-DD(ローカル日付、1日1件)
  categories: CategoryBreakdown;
};

const STORAGE_KEY = "investment-tracker:portfolio-snapshots:v2";
const LEGACY_STORAGE_KEY = "investment-tracker:portfolio-snapshots:v1"; // 万円単位だった旧データ

type LegacyCategoryEntry = { currentValueMan: number; profitMan: number };
type LegacySnapshot = {
  id: string;
  date: string;
  categories: Record<AssetCategoryKey, LegacyCategoryEntry>;
};

function migrateLegacySnapshot(s: LegacySnapshot): PortfolioSnapshot {
  const categories = {} as CategoryBreakdown;
  for (const cat of ASSET_CATEGORIES) {
    const legacy = s.categories[cat.key];
    categories[cat.key] = {
      currentValueYen: legacy.currentValueMan * 10000,
      profitYen: legacy.profitMan * 10000,
    };
  }
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
    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        const migrated = legacyParsed
          .map(migrateLegacySnapshot)
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

export function snapshotTotals(snapshot: PortfolioSnapshot): { totalYen: number; profitYen: number } {
  return ASSET_CATEGORIES.reduce(
    (acc, cat) => {
      const entry = snapshot.categories[cat.key];
      return { totalYen: acc.totalYen + entry.currentValueYen, profitYen: acc.profitYen + entry.profitYen };
    },
    { totalYen: 0, profitYen: 0 }
  );
}

export function latestSnapshot(snapshots: PortfolioSnapshot[]): PortfolioSnapshot | null {
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

export function formatYen(n: number) {
  if (!Number.isFinite(n)) return "-";
  return `${Math.round(n).toLocaleString("ja-JP")}円`;
}
