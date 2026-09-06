// 積立クエストのデータ引き継ぎ(書き出し/読み込み)。
// サーバーには一切送信せず、ブラウザのlocalStorageの内容をJSONファイルとして
// ダウンロード/読み込みするだけの、完全にクライアント完結の仕組み。
// 対象キーは各libファイルの最新スキーマ(:v1, :v5等)のみ。旧バージョンの
// snapshotキー(portfolio-snapshots:v1〜v4)は各モジュールの起動時マイグレーションで
// 最新版に統合済みのため対象外。onboarding表示済みフラグのような純粋なUI状態も対象外。
//
// 各キーの型(array/object)を明記し、読み込み時に最低限の形チェックを行う。
// 新しい永続化キーを追加・バージョンアップした場合は、ここへの追加を忘れないこと
// (バックアップに含まれない=引き継げないデータになるため)。
const TRANSFER_KEY_KINDS = {
  "investment-tracker:goals:v1": "array",
  "investment-tracker:portfolio-snapshots:v5": "array",
  "investment-tracker:portfolio-settings:v1": "object",
  "investment-tracker:budget-categories:v1": "array",
  "investment-tracker:budget-transactions:v1": "array",
  "investment-tracker:household-diagnosis:profile:v1": "object",
  "investment-tracker:household-diagnosis:special-expenses:v1": "array",
  "investment-tracker:household-diagnosis:settings:v1": "object",
  "investment-tracker:household-diagnosis:monthly-budget:v1": "array",
  "investment-tracker:household-diagnosis:monthly-review:v1": "array",
  "investment-tracker:household-diagnosis:monthly-action-state:v1": "array",
  "investment-tracker:household-diagnosis:special-expense-candidates:v1": "array",
  "investment-tracker:household-diagnosis:special-expense-prompt-resolved:v1": "array",
} as const satisfies Record<string, "array" | "object">;

export const TRANSFER_KEYS = Object.keys(TRANSFER_KEY_KINDS) as (keyof typeof TRANSFER_KEY_KINDS)[];

const EXPORT_APP_ID = "investment-tracker";
const EXPORT_FORMAT_VERSION = 1;
// 通常の利用でここまで大きくなることは想定しにくいサイズの上限(壊れた/悪意あるファイル対策)。
const MAX_IMPORT_FILE_BYTES = 20 * 1024 * 1024; // 20MB

type ExportBundle = {
  app: typeof EXPORT_APP_ID;
  formatVersion: typeof EXPORT_FORMAT_VERSION;
  exportedAt: string;
  data: Partial<Record<keyof typeof TRANSFER_KEY_KINDS, unknown>>;
};

function matchesKind(value: unknown, kind: "array" | "object"): boolean {
  if (kind === "array") return Array.isArray(value);
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildExportBundle(): ExportBundle {
  const data: ExportBundle["data"] = {};
  for (const key of TRANSFER_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      const parsed = JSON.parse(raw);
      if (matchesKind(parsed, TRANSFER_KEY_KINDS[key])) {
        data[key] = parsed;
      }
      // 型が想定と違う(壊れている)値は書き出しに含めない
    } catch {
      // JSONとして壊れている値は書き出しに含めない
    }
  }
  return { app: EXPORT_APP_ID, formatVersion: EXPORT_FORMAT_VERSION, exportedAt: new Date().toISOString(), data };
}

export function downloadExportFile(): void {
  const bundle = buildExportBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sekitate-quest-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportPreview =
  | { valid: true; exportedAt: string; keyCount: number; bundle: ExportBundle }
  | { valid: false; error: string };

// インポート実行前に内容を検証するだけの関数(何も書き込まない)。
// 確認ダイアログに「いつ書き出されたバックアップか」を出すためにも使う。
export function previewImport(jsonText: string, fileSizeBytes: number): ImportPreview {
  if (fileSizeBytes > MAX_IMPORT_FILE_BYTES) {
    return { valid: false, error: "ファイルサイズが大きすぎます。積立クエストの書き出しファイルではない可能性があります。" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { valid: false, error: "ファイルの形式が正しくありません(JSONとして読み込めませんでした)。" };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as Partial<ExportBundle>).app !== EXPORT_APP_ID ||
    (parsed as Partial<ExportBundle>).formatVersion !== EXPORT_FORMAT_VERSION ||
    typeof (parsed as Partial<ExportBundle>).exportedAt !== "string" ||
    typeof (parsed as Partial<ExportBundle>).data !== "object" ||
    (parsed as Partial<ExportBundle>).data === null
  ) {
    return { valid: false, error: "積立クエストの書き出しファイルではないようです。" };
  }

  const bundle = parsed as ExportBundle;
  let keyCount = 0;
  for (const key of TRANSFER_KEYS) {
    if (!(key in bundle.data)) continue;
    if (!matchesKind(bundle.data[key], TRANSFER_KEY_KINDS[key])) {
      return { valid: false, error: `ファイルの内容が壊れているようです(${key})。` };
    }
    keyCount++;
  }
  if (keyCount === 0) {
    return { valid: false, error: "復元できるデータが1件も見つかりませんでした。" };
  }

  return { valid: true, exportedAt: bundle.exportedAt, keyCount, bundle };
}

export type ImportResult = { success: true; restoredKeyCount: number } | { success: false; error: string };

// previewImportで検証済みのbundleを実際にlocalStorageへ反映する。
// 「一部のキーだけ新しく、残りは古いまま」という中途半端な状態を避けるため、
// 書き込み前に現在値を全部メモリへ退避しておき、途中で失敗したら全キーを
// 退避値へ戻す(ロールバック)。バックアップに含まれないキーは削除し、
// 「マージ」ではなく「その時点の状態への復元」として扱う。
export function applyImport(bundle: ExportBundle): ImportResult {
  const previousValues = new Map<string, string | null>();
  for (const key of TRANSFER_KEYS) {
    previousValues.set(key, localStorage.getItem(key));
  }

  try {
    let restoredKeyCount = 0;
    for (const key of TRANSFER_KEYS) {
      if (key in bundle.data) {
        localStorage.setItem(key, JSON.stringify(bundle.data[key]));
        restoredKeyCount++;
      } else {
        localStorage.removeItem(key);
      }
    }
    return { success: true, restoredKeyCount };
  } catch (e) {
    // 途中で失敗(容量超過等)した場合は、退避しておいた値へ全キーを戻す
    for (const [key, value] of previousValues) {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    }
    return {
      success: false,
      error: `読み込み中にエラーが発生したため、元のデータに戻しました。(${e instanceof Error ? e.message : String(e)})`,
    };
  }
}
