"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { todayKey, formatYen } from "@/lib/portfolio";
import {
  categoryNature,
  transactionsByDate,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
} from "@/lib/household";
import type { HouseholdDashboardSummary } from "@/lib/monthlyBudget";
import type { CashSavingsActionStatus } from "@/lib/monthlyActionState";
import { computeHouseholdToday } from "@/lib/householdToday";
import { BudgetCalendar } from "../BudgetCalendar";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

// タップ領域を最低44×44pxまで拡大しつつ、見た目の「×」自体は変えない。
const deleteButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-destructive";

// 常時表示領域。「今月あと使えるお金」+「すぐ入力」+ Lunaの短いCTAだけに絞る
// (詳しい状況は「今日」タブへ。GPTとのUI/IA相談で確定した二段階表示)。
export function HouseholdQuickArea({
  summary,
  categories,
  transactions,
  month,
  cashSavingsStatus,
  onGoToToday,
  onAddTransaction,
  onDeleteTransaction,
  investmentEntryRequestId,
  investmentCategoryId,
}: {
  summary: HouseholdDashboardSummary;
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  month: string;
  cashSavingsStatus: CashSavingsActionStatus | null;
  onGoToToday: () => void;
  onAddTransaction: (input: Omit<BudgetTransaction, "id">) => void;
  onDeleteTransaction: (id: string) => void;
  investmentEntryRequestId: number;
  investmentCategoryId: string | null;
}) {
  const { todayAction } = computeHouseholdToday(summary, categories, transactions, month, cashSavingsStatus);

  const [kind, setKind] = useState<BudgetCategoryKind>("expense");
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const kindCategories = kind === "expense" ? expenseCategories : incomeCategories;

  const [categoryId, setCategoryId] = useState(kindCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey());
  const [memo, setMemo] = useState("");
  // 直前に追加した取引が投資(nature=investment)だったか。資産タブの評価額には自動反映されないことを注記するために使う。
  const [lastAddedInvestment, setLastAddedInvestment] = useState(false);
  const byDate = transactionsByDate(transactions);
  const selectedDateTransactions = byDate.get(date) ?? [];
  const categoryLabelById = new Map(categories.map((c) => [c.id, c.label]));

  const entryFormRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  // 月末レビューの「投資の記録を追加する」ボタンから呼ばれたときだけ、支出/投資カテゴリを
  // プリセレクトしてこのフォームまでスクロールする。0(初期値・未リクエスト)では何もしない。
  useEffect(() => {
    if (investmentEntryRequestId === 0) return;
    setKind("expense");
    setCategoryId(investmentCategoryId ?? "");
    entryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    amountInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investmentEntryRequestId]);

  function handleKindChange(next: BudgetCategoryKind) {
    setKind(next);
    const nextCategories = next === "expense" ? expenseCategories : incomeCategories;
    setCategoryId(nextCategories[0]?.id ?? "");
  }

  function handleSubmit() {
    const value = Number(amount);
    if (!categoryId || !Number.isFinite(value) || value <= 0 || !date) return;
    onAddTransaction({ date, categoryId, amount: value, memo });
    const addedCategory = categories.find((c) => c.id === categoryId);
    setLastAddedInvestment(addedCategory ? categoryNature(addedCategory) === "investment" : false);
    setAmount("");
    setMemo("");
  }

  function handleDeleteWithConfirm(id: string) {
    if (!confirm("この記録を削除しますか？削除すると元に戻せません。")) return;
    onDeleteTransaction(id);
  }

  return (
    <div className="space-y-3">
      {/* 今月あと使えるお金(最優先の1数字) */}
      <div className="gold-border space-y-1 rounded-2xl bg-white/5 p-5 text-center">
        <p className="font-mono text-xs text-muted-foreground">今月あと使えるお金</p>
        <p className={`font-mono text-4xl font-bold ${summary.remainingSpendable >= 0 ? "gold-text" : "text-destructive"}`}>
          {formatYen(summary.remainingSpendable)}
        </p>
        {summary.remainingSpendable < 0 && (
          <p className="text-xs text-destructive">
            今月は現在{formatYen(Math.abs(summary.remainingSpendable))}ほど予算を超える見込みです
          </p>
        )}
      </div>

      {/* Lunaの短いCTA。詳しい内容・操作は「今日」タブに集約する(常時領域には要約だけ)。 */}
      <button
        type="button"
        onClick={onGoToToday}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left font-mono text-xs"
      >
        <span className="truncate">🌙 {todayAction.headline}</span>
        <span className="shrink-0 text-muted-foreground">今日 ＞</span>
      </button>

      <div ref={entryFormRef} className="space-y-3 rounded-xl gold-border bg-white/5 p-3">
        <h3 className="font-mono text-sm text-muted-foreground">記録を追加(日付をタッチして選択)</h3>

        <BudgetCalendar transactions={transactions} categories={categories} selectedDate={date} onSelectDate={setDate} />

        <p className="text-center font-mono text-xs">
          <span className="text-muted-foreground">選択中の日付: </span>
          <span className="neon-text font-bold">{date}</span>
        </p>

        {selectedDateTransactions.length > 0 && (
          <div className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-2">
            {selectedDateTransactions.map((t) => {
              const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
              return (
                <div key={t.id} className="space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">{categoryLabelById.get(t.categoryId) ?? "-"}</span>
                    <span className={isIncome ? "neon-text" : "neon-text-pink"}>
                      {isIncome ? "+" : "-"}
                      {formatYen(t.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteWithConfirm(t.id)}
                      className={deleteButtonClass}
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </div>
                  {t.memo && <p className="line-clamp-1 font-mono text-[10px] text-muted-foreground">{t.memo}</p>}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleKindChange("expense")}
            className={`flex-1 rounded-lg px-3 py-1.5 font-mono text-xs ${
              kind === "expense" ? "neon-border-pink neon-text-pink" : "border border-white/15 text-muted-foreground"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => handleKindChange("income")}
            className={`flex-1 rounded-lg px-3 py-1.5 font-mono text-xs ${
              kind === "income" ? "neon-border neon-text" : "border border-white/15 text-muted-foreground"
            }`}
          >
            収入
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {(kindCategories.length === 0 || !kindCategories.some((c) => c.id === categoryId)) && (
              <option value="">{kindCategories.length === 0 ? "カテゴリなし" : "カテゴリを選択してください"}</option>
            )}
            {kindCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            ref={amountInputRef}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額(円)"
            className={inputClass}
          />
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ(任意)"
            className={`${inputClass} col-span-2`}
          />
        </div>

        <Button type="button" className="w-full" onClick={handleSubmit} disabled={!categoryId}>
          追加する
        </Button>
        {lastAddedInvestment && (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-[11px] text-muted-foreground">
            投資の記録は、資産タブの投資評価額には自動反映されません。投資後に資産タブで現在の評価額を更新すると、資産合計にも反映されます。それまでは預金だけが先に減るため、資産合計が一時的に少なく見えることがあります。
          </p>
        )}
      </div>
    </div>
  );
}
