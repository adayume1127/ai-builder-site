"use client";

// 家計診断の再診断(見直し)が完了した直後に表示する確認画面。
// プロフィールの保存とMonthlyBudgetへの反映は別の操作であり、ユーザーが選ばない限り
// 現在進行中の今月のMonthlyBudgetは変更しない(spec: 月替わり処理と同じ非破壊方針)。
export function ReDiagnosisReflectChoice({
  onReflectThisMonth,
  onReflectNextMonthOnly,
}: {
  onReflectThisMonth: () => void;
  onReflectNextMonthOnly: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl gold-border bg-white/5 p-4">
      <p className="text-center font-mono text-sm">診断内容を更新しました</p>
      <p className="text-center font-mono text-xs text-muted-foreground">
        今月の予算にも反映しますか?選ばない限り、今月の予算はそのまま変わりません。
      </p>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onReflectThisMonth}
          className="w-full rounded-lg gold-border gold-text px-3 py-2 font-mono text-xs"
        >
          今月の予算にも反映する(新しい診断内容で作り直す)
        </button>
        <button
          type="button"
          onClick={onReflectNextMonthOnly}
          className="w-full rounded-lg border border-white/15 px-3 py-2 font-mono text-xs text-muted-foreground hover:bg-white/5"
        >
          来月から反映する(今月の予算はそのまま)
        </button>
      </div>
    </div>
  );
}
