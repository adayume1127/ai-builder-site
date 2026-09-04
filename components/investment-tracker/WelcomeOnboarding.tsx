"use client";

import { useEffect, useRef, useState } from "react";

// ルナが最初に1つだけ行動を促し、家計診断へ案内するだけの軽量な入口。
// 以前は「目標/資産/家計/全体」の4択だったが、初心者には「どれを選べばいいか分からない」
// という新たな判断を強いてしまうため撤廃した(GPTとのPDCA Cycle1)。資産タブやクエストタブは
// 消えておらず、下部タブからいつでも行ける。ここでは「まず何をすればいいか」を
// アプリ側が決め切ることを優先する。
export function WelcomeOnboarding({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const [avatarOk, setAvatarOk] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  // 開く直前にフォーカスしていた要素を覚えておき、閉じたら戻す。「？」ボタンから手動で
  // 開いた場合はそのボタンへ、初回自動表示(トリガーなし)の場合はbody等へ戻るだけで実害はない。
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    startButtonRef.current?.focus();

    // aria-modal="true"を名乗る以上、Tabで背後の要素にフォーカスが抜けないようにする
    // (見た目はoverlayで操作不能に見えても、キーボード操作では背後を触れてしまうのを防ぐ)。
    // Escapeは「今はスキップ」と同じ扱いにする(閉じる手段が無いとキーボード利用者にとって
    // 不自然なため。背景クリックは誤操作防止のため引き続き閉じない)。
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onSkip();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const list = Array.from(focusable);
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="積立クエストへようこそ"
        className="w-full max-w-sm space-y-4 rounded-2xl gold-border bg-background p-5"
      >
        <div className="flex items-center gap-3">
          {avatarOk && (
            <img
              src="/luna-avatar.png"
              alt="ルナ"
              className="h-14 w-14 shrink-0 rounded-full object-cover luna-glow-pulse"
              onError={() => setAvatarOk(false)}
            />
          )}
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground">ルナ</p>
            <p className="text-sm">
              まず、毎月いくら貯められそうか調べよう。ルナが順番に聞くから、分かるところだけ答えてね。
            </p>
          </div>
        </div>

        <button
          ref={startButtonRef}
          type="button"
          onClick={onStart}
          className="w-full rounded-xl gold-border gold-text px-4 py-3 text-center text-base font-bold"
        >
          はじめる
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full text-center font-mono text-xs text-muted-foreground underline underline-offset-2"
        >
          今はスキップ
        </button>

        {/* β公開前チェックリスト対応: データの保存場所・免責事項。「はじめる」の判断を
            妨げないよう主要導線の下に置くが、常に表示(折りたたまない)。この画面は初回に
            自動表示されるほか、ヘッダーの「?」ボタンからいつでも再表示できるため、
            新規ユーザーの初回接触時と、あとから確認したいときの両方をこの1箇所で満たす。 */}
        <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            入力したデータはこの端末のブラウザ内だけに保存されます(運営者のサーバーには送信されません)。ブラウザのデータ削除や機種変更などで消える場合があります。
          </p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            家計管理・資産形成のシミュレーションを目的としたツールで、特定の金融商品の購入・売却を推奨するものではありません。表示される金額や目安は将来の成果を保証するものではないので、投資の最終判断はご自身で行ってください。
          </p>
        </div>
      </div>
    </div>
  );
}
