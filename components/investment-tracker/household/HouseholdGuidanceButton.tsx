"use client";

import { useEffect, useRef, useState } from "react";
import type { HouseholdGuidance } from "@/lib/householdGuidance";

export function HouseholdGuidanceButton({
  guidance,
  onAction,
}: {
  guidance: HouseholdGuidance;
  // モーダルの「わかった」を押した時に呼ばれる。レビュー・診断など既存画面への
  // 誘導が必要な場合はここで遷移(state変更)を行う。それ以外は何もしなくてよい。
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // 開いたら「わかった」ボタンへフォーカスし、Escapeで閉じられるようにする。
  // 閉じたら元のトリガーボタンへフォーカスを戻す(モーダルの基本的なアクセシビリティ)。
  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
      >
        💡 困ったらここ
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={handleClose}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="困ったらここ"
            className="w-full max-w-sm space-y-3 rounded-2xl gold-border bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">今の状態</p>
              <p className="text-sm">{guidance.headline}</p>
              {guidance.supportingFacts.length > 0 && (
                <div className="space-y-0.5 pt-1 font-mono text-xs text-muted-foreground">
                  {guidance.supportingFacts.map((fact, i) => (
                    <p key={i}>{fact}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1 border-t border-white/10 pt-3">
              <p className="font-mono text-xs text-muted-foreground">次にやること</p>
              <p className="gold-text text-sm">{guidance.actionLabel}</p>
            </div>

            <button
              ref={confirmRef}
              type="button"
              onClick={() => {
                onAction();
                handleClose();
              }}
              className="w-full rounded-lg gold-border gold-text px-3 py-2 font-mono text-xs"
            >
              わかった
            </button>
          </div>
        </div>
      )}
    </>
  );
}
