// 資産ポートフォリオ(国内株式/米国株式/投資信託/金銀プラチナ)のスナップショット管理。
// 積立クエストの「目標」とは独立した、口座全体の資産推移を記録する。

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

export type CategoryEntry = { currentValueMan: number; profitMan: number };

export type CategoryBreakdown = Record<AssetCategoryKey, CategoryEntry>;

export function emptyBreakdown(): CategoryBreakdown {
  return {
    domesticStocks: { currentValueMan: 0, profitMan: 0 },
    usStocks: { currentValueMan: 0, profitMan: 0 },
    mutualFunds: { currentValueMan: 0, profitMan: 0 },
    preciousMetals: { currentValueMan: 0, profitMan: 0 },
  };
}

export type PortfolioSnapshot = {
  id: string;
  date: string; // YYYY-MM-DD(ローカル日付、1日1件)
  categories: CategoryBreakdown;
};

const STORAGE_KEY = "investment-tracker:portfolio-snapshots:v1";

export function loadSnapshots(): PortfolioSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a: PortfolioSnapshot, b: PortfolioSnapshot) => a.date.localeCompare(b.date));
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

export function snapshotTotals(snapshot: PortfolioSnapshot): { totalMan: number; profitMan: number } {
  return ASSET_CATEGORIES.reduce(
    (acc, cat) => {
      const entry = snapshot.categories[cat.key];
      return { totalMan: acc.totalMan + entry.currentValueMan, profitMan: acc.profitMan + entry.profitMan };
    },
    { totalMan: 0, profitMan: 0 }
  );
}

export function latestSnapshot(snapshots: PortfolioSnapshot[]): PortfolioSnapshot | null {
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}
