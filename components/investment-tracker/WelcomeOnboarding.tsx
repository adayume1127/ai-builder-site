"use client";

import { useEffect, useRef, useState } from "react";

export type OnboardingChoice = "quest" | "assets" | "budget" | "overview";

const CHOICES: { choice: OnboardingChoice; emoji: string; label: string }[] = [
  { choice: "quest", emoji: "🗺️", label: "貯金・投資の目標を決めたい" },
  { choice: "assets", emoji: "💰", label: "今の資産を整理したい" },
  { choice: "budget", emoji: "📒", label: "家計を診断したい" },
  { choice: "overview", emoji: "🏠", label: "まず全体を見てみる" },
];

// ルナが最初に1問だけ聞き、選んだ内容に応じて該当タブへ案内するだけの軽量な入口。
// 実際の入力操作は各タブの既存UI(QuestTabのGoalForm・HouseholdSetup等)にそのまま任せ、
// ここでステップ管理や進捗保存は持たない(汎用チュートリアルエンジンにしない設計方針)。
export function WelcomeOnboarding({
  onChoose,
  onSkip,
}: {
  onChoose: (choice: OnboardingChoice) => void;
  onSkip: () => void;
}) {
  const [avatarOk, setAvatarOk] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  // 開く直前にフォーカスしていた要素を覚えておき、閉じたら戻す。「？」ボタンから手動で
  // 開いた場合はそのボタンへ、初回自動表示(トリガーなし)の場合はbody等へ戻るだけで実害はない。
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    firstChoiceRef.current?.focus();

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
            <p className="text-sm">積立クエストへようこそ！まず、何から始めたい？</p>
          </div>
        </div>

        <div className="space-y-2">
          {CHOICES.map((c, i) => (
            <button
              key={c.choice}
              ref={i === 0 ? firstChoiceRef : undefined}
              type="button"
              onClick={() => onChoose(c.choice)}
              className="flex w-full items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-left text-sm hover:bg-white/5"
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="w-full text-center font-mono text-xs text-muted-foreground underline underline-offset-2"
        >
          今はスキップ
        </button>
      </div>
    </div>
  );
}
