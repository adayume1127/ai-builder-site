"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { todayKey, formatYen } from "@/lib/portfolio";
import {
  cumulativeSavingsTrend,
  monthKey,
  monthlySummaries,
  type BudgetCategory,
  type BudgetTransaction,
} from "@/lib/household";
import type { MonthlyHistoryEntry, MonthlyReview } from "@/lib/monthlyReview";
import { SavingsTrendChart } from "../SavingsTrendChart";
import { MonthlyHistoryList } from "./MonthlyHistoryList";
import { MonthlyReviewCard } from "./MonthlyReviewCard";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

type SortOrder = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { order: SortOrder; label: string }[] = [
  { order: "date-desc", label: "日付: 新しい順" },
  { order: "date-asc", label: "日付: 古い順" },
  { order: "amount-desc", label: "金額: 高い順" },
  { order: "amount-asc", label: "金額: 低い順" },
];

function groupTransactionsByMonth(
  transactions: BudgetTransaction[]
): { month: string; items: BudgetTransaction[] }[] {
  const byMonth = new Map<string, BudgetTransaction[]>();
  for (const t of transactions) {
    const key = monthKey(t.date);
    const list = byMonth.get(key);
    if (list) list.push(t);
    else byMonth.set(key, [t]);
  }
  return [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, items]) => ({ month, items }));
}

function sortTransactionsForDisplay(transactions: BudgetTransaction[], order: SortOrder): BudgetTransaction[] {
  const copy = [...transactions];
  switch (order) {
    case "date-desc":
      return copy.sort((a, b) => b.date.localeCompare(a.date));
    case "date-asc":
      return copy.sort((a, b) => a.date.localeCompare(b.date));
    case "amount-desc":
      return copy.sort((a, b) => b.amount - a.amount);
    case "amount-asc":
      return copy.sort((a, b) => a.amount - b.amount);
  }
}

const deleteButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-destructive";

// 「履歴」タブ。取引履歴(月ごと折りたたみ・編集可能)・累計収支グラフ・過去の実績・
// 月末レビューをここに集約する(以前は家計簿タブとダッシュボードに分散していた)。
export function HouseholdHistoryTab({
  categories,
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  monthlyHistoryEntries,
  selectedReviewMonth,
  onSelectReviewMonth,
  reviewTargetMonth,
  actualIncome,
  actualFixedExpenses,
  actualVariableExpenses,
  actualSpecialExpenses,
  actualMonthlyInvestment,
  monthlySurplus,
  plannedCashSavings,
  plannedInvestment,
  previousMonthSurplus,
  review,
  onSaveAllocation,
  isLatestReviewMonth,
  hasOlderReviewMonth,
  hasNewerReviewMonth,
  onNavigateReviewMonth,
  onJumpToLatestReviewMonth,
  onRequestInvestmentEntry,
  hasInvestmentCategory,
}: {
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  onUpdateTransaction: (id: string, patch: Partial<Omit<BudgetTransaction, "id">>) => void;
  onDeleteTransaction: (id: string) => void;
  monthlyHistoryEntries: MonthlyHistoryEntry[];
  selectedReviewMonth: string | null;
  onSelectReviewMonth: (month: string) => void;
  reviewTargetMonth: string | null;
  actualIncome: number;
  actualFixedExpenses: number;
  actualVariableExpenses: number;
  actualSpecialExpenses: number;
  actualMonthlyInvestment: number;
  monthlySurplus: number;
  plannedCashSavings: number;
  plannedInvestment: number;
  previousMonthSurplus: number | null;
  review: MonthlyReview | null;
  onSaveAllocation: (cash: number, special: number) => void;
  isLatestReviewMonth: boolean;
  hasOlderReviewMonth: boolean;
  hasNewerReviewMonth: boolean;
  onNavigateReviewMonth: (direction: "older" | "newer") => void;
  onJumpToLatestReviewMonth: () => void;
  onRequestInvestmentEntry: () => void;
  hasInvestmentCategory: boolean;
}) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");

  const latestMonthWithTransactions =
    transactions.length > 0
      ? transactions.reduce((latest, t) => {
          const m = monthKey(t.date);
          return m > latest ? m : latest;
        }, monthKey(transactions[0].date))
      : monthKey(todayKey());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set([latestMonthWithTransactions]));
  function toggleMonth(month: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMemo, setEditMemo] = useState("");

  function startEdit(t: BudgetTransaction) {
    setEditingId(t.id);
    setEditDate(t.date);
    setEditCategoryId(t.categoryId);
    setEditAmount(String(t.amount));
    setEditMemo(t.memo ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
  }
  function saveEdit(id: string) {
    const value = Number(editAmount);
    if (!editCategoryId || !Number.isFinite(value) || value <= 0 || !editDate) return;
    onUpdateTransaction(id, { date: editDate, categoryId: editCategoryId, amount: value, memo: editMemo });
    setEditingId(null);
    setExpandedMonths((prev) => new Set(prev).add(monthKey(editDate)));
  }

  function handleDeleteWithConfirm(id: string) {
    if (!confirm("この記録を削除しますか？削除すると元に戻せません。")) return;
    onDeleteTransaction(id);
  }

  const categoryLabelById = new Map(categories.map((c) => [c.id, c.label]));
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const summaries = monthlySummaries(transactions, categories);
  const trend = cumulativeSavingsTrend(summaries);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-mono text-sm text-muted-foreground">累計収支の推移</h3>
        <SavingsTrendChart points={trend} />
      </div>

      <MonthlyHistoryList entries={monthlyHistoryEntries} selectedMonth={selectedReviewMonth} onSelectMonth={onSelectReviewMonth} />

      {reviewTargetMonth && (
        <MonthlyReviewCard
          month={reviewTargetMonth}
          actualIncome={actualIncome}
          actualFixedExpenses={actualFixedExpenses}
          actualVariableExpenses={actualVariableExpenses}
          actualSpecialExpenses={actualSpecialExpenses}
          actualMonthlyInvestment={actualMonthlyInvestment}
          monthlySurplus={monthlySurplus}
          plannedCashSavings={plannedCashSavings}
          plannedInvestment={plannedInvestment}
          previousMonthSurplus={previousMonthSurplus}
          review={review}
          onSaveAllocation={onSaveAllocation}
          isLatest={isLatestReviewMonth}
          hasOlder={hasOlderReviewMonth}
          hasNewer={hasNewerReviewMonth}
          onNavigate={onNavigateReviewMonth}
          onJumpToLatest={onJumpToLatestReviewMonth}
          onRequestInvestmentEntry={onRequestInvestmentEntry}
          hasInvestmentCategory={hasInvestmentCategory}
        />
      )}

      {transactions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-sm text-muted-foreground">記録の履歴</h3>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              aria-label="表示順"
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.order} value={opt.order}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {groupTransactionsByMonth(transactions).map(({ month, items }) => {
              const isOpen = expandedMonths.has(month);
              const netYen = items.reduce((sum, t) => {
                const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
                return sum + (isIncome ? t.amount : -t.amount);
              }, 0);
              return (
                <div key={month} className="overflow-hidden rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleMonth(month)}
                    className="flex w-full items-center justify-between bg-white/[0.03] px-3 py-2 font-mono text-xs"
                  >
                    <span className="text-foreground/90">
                      {month} <span className="text-muted-foreground">({items.length}件)</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground">記録収支</span>
                      <span className={netYen >= 0 ? "gold-text" : "text-destructive"}>{formatYen(netYen)}</span>
                      <span className="text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full font-mono text-xs">
                        <thead>
                          <tr className="border-b border-t border-white/10 text-muted-foreground">
                            <th className="px-3 py-2 text-left font-normal">日付</th>
                            <th className="px-3 py-2 text-left font-normal">カテゴリ</th>
                            <th className="px-3 py-2 text-right font-normal">金額</th>
                            <th className="px-3 py-2 text-left font-normal">メモ</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {sortTransactionsForDisplay(items, sortOrder).map((t) => {
                            const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
                            if (editingId === t.id) {
                              const editValue = Number(editAmount);
                              const editInvalid =
                                !editCategoryId || !Number.isFinite(editValue) || editValue <= 0 || !editDate;
                              return (
                                <tr key={t.id} className="border-b border-white/5 bg-white/[0.03] last:border-0">
                                  <td colSpan={5} className="space-y-2 px-3 py-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="date"
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        className={inputClass}
                                        aria-label="日付を編集"
                                      />
                                      <select
                                        value={editCategoryId}
                                        onChange={(e) => setEditCategoryId(e.target.value)}
                                        className={inputClass}
                                        aria-label="カテゴリを編集"
                                      >
                                        <optgroup label="支出">
                                          {expenseCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                              {c.label}
                                            </option>
                                          ))}
                                        </optgroup>
                                        <optgroup label="収入">
                                          {incomeCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                              {c.label}
                                            </option>
                                          ))}
                                        </optgroup>
                                      </select>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        placeholder="金額(円)"
                                        className={inputClass}
                                        aria-label="金額を編集"
                                      />
                                      <input
                                        type="text"
                                        value={editMemo}
                                        onChange={(e) => setEditMemo(e.target.value)}
                                        placeholder="メモ(任意)"
                                        className={inputClass}
                                        aria-label="メモを編集"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        className="flex-1"
                                        onClick={() => saveEdit(t.id)}
                                        disabled={editInvalid}
                                      >
                                        保存
                                      </Button>
                                      <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="flex-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/5"
                                      >
                                        キャンセル
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return (
                              <tr key={t.id} className="border-b border-white/5 last:border-0">
                                <td className="px-3 py-2">{t.date}</td>
                                <td className="px-3 py-2">{categoryLabelById.get(t.categoryId) ?? "-"}</td>
                                <td className={`px-3 py-2 text-right ${isIncome ? "neon-text" : "neon-text-pink"}`}>
                                  {isIncome ? "+" : "-"}
                                  {formatYen(t.amount)}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{t.memo || "-"}</td>
                                <td className="px-3 py-2 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(t)}
                                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                                    aria-label="編集"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWithConfirm(t.id)}
                                    className={deleteButtonClass}
                                    aria-label="削除"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
