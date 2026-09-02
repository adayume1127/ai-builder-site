// 積立クエスト(/tools/investment-tracker)の初回オンボーディング(ルナの「何から始めたい?」)の
// 表示状態。「見たかどうか」はデータの有無とは別概念のため、専用のフラグとして保存する
// (データが空でも一度スキップ/選択済みなら再表示しない。逆にデータが既にある場合は
// page.tsx側で読み込み直後に自動的に既読扱いにする — 詳細はpage.tsxのuseEffect参照)。

const STORAGE_KEY = "investment-tracker:onboarding:v1";

export type OnboardingState = { hasSeenWelcome: boolean };

export function loadOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return { hasSeenWelcome: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { hasSeenWelcome: false };
    const parsed = JSON.parse(raw);
    return { hasSeenWelcome: parsed?.hasSeenWelcome === true };
  } catch {
    return { hasSeenWelcome: false };
  }
}

export function saveOnboardingState(state: OnboardingState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorageが使えない(プライベートモード等)場合は保存を諦める
  }
}
