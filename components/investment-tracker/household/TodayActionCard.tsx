"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import type { CashSavingsActionStatus } from "@/lib/monthlyActionState";
import type { TodayAction } from "@/lib/todayAction";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

export function TodayActionCard({
  action,
  cashSavingsStatus,
  cashSavingsAmountYen,
  plannedCashSavings,
  onUpdateCashSavings,
}: {
  action: TodayAction;
  cashSavingsStatus: CashSavingsActionStatus | null;
  cashSavingsAmountYen: number;
  plannedCashSavings: number;
  // "pending"を渡すと未実行に戻せる(修正の取り消し)。金額は"completed"のときだけ意味を持つ。
  onUpdateCashSavings: (status: CashSavingsActionStatus, amountYen: number) => void;
}) {
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountInput, setAmountInput] = useState(String(action.cashSavingsSuggestedAmount ?? plannedCashSavings));

  const status = cashSavingsStatus ?? "pending";

  return (
    <div className="space-y-2 rounded-2xl gold-border bg-white/5 p-4">
      <p className="font-mono text-xs text-muted-foreground">🌙 今日やること</p>
      <p className="text-sm font-bold">{action.headline}</p>
      <p className="text-xs text-muted-foreground">{action.detail}</p>

      {action.reason === "cash_savings_pending" &&
        (editingAmount ? (
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              // 0円以下・不正な入力は「実行した」の意味を持たない(0円なら「見送る」の方が状態として明確)。
              disabled={!(Number.isFinite(Number(amountInput)) && Number(amountInput) > 0)}
              onClick={() => {
                onUpdateCashSavings("completed", Number(amountInput));
                setEditingAmount(false);
              }}
              className="shrink-0 rounded-lg gold-border gold-text px-3 py-1.5 font-mono text-xs disabled:opacity-40"
            >
              確定
            </button>
            <button
              type="button"
              onClick={() => setEditingAmount(false)}
              className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground"
            >
              やめる
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateCashSavings("completed", action.cashSavingsSuggestedAmount ?? plannedCashSavings)}
              className="rounded-lg gold-border gold-text px-2 py-1.5 font-mono text-[11px]"
            >
              実行した
            </button>
            <button
              type="button"
              onClick={() => {
                // useStateの初期値はmount時にしか評価されないため、開くたびに最新の提案額を
                // セットし直す(予算編集で提案額が変わった後も、古い金額が入力欄に残らないように)。
                setAmountInput(String(action.cashSavingsSuggestedAmount ?? plannedCashSavings));
                setEditingAmount(true);
              }}
              className="rounded-lg border border-white/15 px-2 py-1.5 font-mono text-[11px] text-muted-foreground hover:bg-white/5"
            >
              金額を変更
            </button>
            <button
              type="button"
              onClick={() => onUpdateCashSavings("skipped", 0)}
              className="rounded-lg border border-white/15 px-2 py-1.5 font-mono text-[11px] text-muted-foreground hover:bg-white/5"
            >
              今月は見送る
            </button>
          </div>
        ))}

      {/* 他のアクション(赤字通知・予算超過)が優先表示されていても、先取り貯金の状態は
          確認・修正できるようにしておく(誤タップ対策、GPT設計相談での指摘)。 */}
      {status !== "pending" && plannedCashSavings > 0 && action.reason !== "cash_savings_pending" && (
        <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[11px] text-muted-foreground">
          <span>
            先取り貯金: {status === "completed" ? `実行済み ${formatYen(cashSavingsAmountYen)}` : "今月は見送り"}
          </span>
          <button type="button" onClick={() => onUpdateCashSavings("pending", 0)} className="underline underline-offset-2">
            修正する
          </button>
        </div>
      )}
    </div>
  );
}
