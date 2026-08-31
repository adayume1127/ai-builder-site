"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BudgetCalendar } from "./BudgetCalendar";
import { SavingsTrendChart } from "./SavingsTrendChart";
import { todayKey, formatYen } from "@/lib/portfolio";
import {
  addCategory,
  categoryBudgetStatusForMonth,
  cumulativeSavingsTrend,
  monthKey,
  monthlySummaries,
  transactionsByDate,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
} from "@/lib/household";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

export function BudgetTab({
  categories,
  transactions,
  savingsGoalYen,
  onAddTransaction,
  onDeleteTransaction,
  onAddCategory,
  onDeleteCategory,
  onSaveSavingsGoal,
  onSetCategoryBudget,
}: {
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  savingsGoalYen: number;
  onAddTransaction: (input: Omit<BudgetTransaction, "id">) => void;
  onDeleteTransaction: (id: string) => void;
  onAddCategory: (label: string, kind: BudgetCategoryKind) => void;
  onDeleteCategory: (id: string) => void;
  onSaveSavingsGoal: (value: number) => void;
  onSetCategoryBudget: (id: string, budgetYen: number) => void;
}) {
  const [kind, setKind] = useState<BudgetCategoryKind>("expense");
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const kindCategories = kind === "expense" ? expenseCategories : incomeCategories;

  const [categoryId, setCategoryId] = useState(kindCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey());
  const [memo, setMemo] = useState("");
  const byDate = transactionsByDate(transactions);
  const selectedDateTransactions = byDate.get(date) ?? [];

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryKind, setNewCategoryKind] = useState<BudgetCategoryKind>("expense");

  const [savingsGoalInput, setSavingsGoalInput] = useState(savingsGoalYen ? String(savingsGoalYen) : "");
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      categories.filter((c) => c.kind === "expense").map((c) => [c.id, c.monthlyBudgetYen ? String(c.monthlyBudgetYen) : ""])
    )
  );

  const summaries = monthlySummaries(transactions, categories);
  const trend = cumulativeSavingsTrend(summaries);
  const currentMonth = monthKey(todayKey());
  const thisMonth = summaries.find((s) => s.month === currentMonth) ?? {
    month: currentMonth,
    incomeYen: 0,
    expenseYen: 0,
    savingsYen: 0,
  };
  const savingsGoalRatio = savingsGoalYen > 0 ? thisMonth.savingsYen / savingsGoalYen : null;
  const budgetStatuses = categoryBudgetStatusForMonth(transactions, categories, currentMonth);
  const overBudgetCount = budgetStatuses.filter((b) => b.overBudget).length;

  const categoryLabelById = new Map(categories.map((c) => [c.id, c.label]));

  function handleKindChange(next: BudgetCategoryKind) {
    setKind(next);
    const nextCategories = next === "expense" ? expenseCategories : incomeCategories;
    setCategoryId(nextCategories[0]?.id ?? "");
  }

  function handleSubmit() {
    const value = Number(amount);
    if (!categoryId || !Number.isFinite(value) || value <= 0 || !date) return;
    onAddTransaction({ date, categoryId, amount: value, memo });
    setAmount("");
    setMemo("");
  }

  function handleAddCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    onAddCategory(label, newCategoryKind);
    setNewCategoryLabel("");
  }

  function handleSaveGoal() {
    onSaveSavingsGoal(Number(savingsGoalInput) || 0);
  }

  function handleSaveBudget(categoryId: string) {
    onSetCategoryBudget(categoryId, Number(budgetInputs[categoryId]) || 0);
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">家計簿</h2>
        <p className="text-sm text-muted-foreground">収入・支出を記録して、貯金額の推移を確認できます。</p>
      </div>

      <div className="gold-border space-y-3 rounded-2xl bg-white/5 p-4 font-mono">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">今月の収入</p>
            <p className="neon-text text-sm font-bold">{formatYen(thisMonth.incomeYen)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">今月の支出</p>
            <p className="neon-text-pink text-sm font-bold">{formatYen(thisMonth.expenseYen)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">今月の貯金</p>
            <p className={`text-sm font-bold ${thisMonth.savingsYen >= 0 ? "gold-text" : "text-destructive"}`}>
              {formatYen(thisMonth.savingsYen)}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">貯金目標</span>
            <span className="text-muted-foreground">
              {savingsGoalYen > 0 ? (
                <>
                  達成率{" "}
                  <span className={savingsGoalRatio! >= 1 ? "gold-text font-bold" : "neon-text font-bold"}>
                    {Math.round((savingsGoalRatio ?? 0) * 100)}%
                  </span>
                </>
              ) : (
                "未設定"
              )}
            </span>
          </div>
          {savingsGoalYen > 0 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${
                  savingsGoalRatio! >= 1
                    ? "bg-gradient-to-r from-[#FFD700] to-[#fff7cc]"
                    : "bg-gradient-to-r from-[oklch(0.85_0.22_195)] to-[oklch(0.85_0.22_330)]"
                }`}
                style={{ width: `${Math.max(0, Math.min(100, Math.round((savingsGoalRatio ?? 0) * 100)))}%` }}
              />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <input
              type="number"
              inputMode="decimal"
              value={savingsGoalInput}
              onChange={(e) => setSavingsGoalInput(e.target.value)}
              placeholder="毎月の貯金目標(円)"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleSaveGoal}
              className="shrink-0 rounded-lg gold-border gold-text px-3 py-1.5 font-mono text-xs"
            >
              設定
            </button>
          </div>
        </div>
      </div>

      {budgetStatuses.length > 0 && (
        <div
          className={`space-y-2 rounded-xl border p-3 ${
            overBudgetCount > 0 ? "border-destructive/50 bg-destructive/10" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <h3 className="font-mono text-sm text-muted-foreground">
            今月の予算{overBudgetCount > 0 && <span className="text-destructive font-bold"> ⚠ {overBudgetCount}件が予算超過</span>}
          </h3>
          {budgetStatuses.map((b) => (
            <div key={b.category.id} className="space-y-1">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">{b.category.label}</span>
                <span className={b.overBudget ? "text-destructive font-bold" : "text-muted-foreground"}>
                  {formatYen(b.spentYen)} / {formatYen(b.budgetYen)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${b.overBudget ? "bg-destructive" : "bg-[oklch(0.85_0.22_195)]"}`}
                  style={{ width: `${Math.min(100, Math.round(b.ratio * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-mono text-sm text-muted-foreground">貯金額推移</h3>
        <SavingsTrendChart points={trend} />
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
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
                <div key={t.id} className="flex items-center justify-between font-mono text-xs">
                  <span className="text-muted-foreground">{categoryLabelById.get(t.categoryId) ?? "-"}</span>
                  <span className={isIncome ? "neon-text" : "neon-text-pink"}>
                    {isIncome ? "+" : "-"}
                    {formatYen(t.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteTransaction(t.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="削除"
                  >
                    ×
                  </button>
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
            {kindCategories.length === 0 && <option value="">カテゴリなし</option>}
            {kindCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input
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
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <h3 className="font-mono text-sm text-muted-foreground">カテゴリ管理</h3>

        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">支出(月間予算を設定すると超過時に警告表示されます)</p>
          <div className="space-y-1.5">
            {expenseCategories.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] whitespace-nowrap">
                  {c.label}
                  {!c.isDefault && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`${c.label}を削除`}
                    >
                      ×
                    </button>
                  )}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={budgetInputs[c.id] ?? ""}
                  onChange={(e) => setBudgetInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="予算(円・任意)"
                  className={`${inputClass} py-1 text-xs`}
                />
                <button
                  type="button"
                  onClick={() => handleSaveBudget(c.id)}
                  className="shrink-0 rounded-lg border border-white/15 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-white/5"
                >
                  設定
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">収入</p>
          <div className="flex flex-wrap gap-1.5">
            {incomeCategories.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px]"
              >
                {c.label}
                {!c.isDefault && (
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`${c.label}を削除`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={newCategoryKind}
            onChange={(e) => setNewCategoryKind(e.target.value as BudgetCategoryKind)}
            className={`${inputClass} w-24 shrink-0`}
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
          <input
            type="text"
            value={newCategoryLabel}
            onChange={(e) => setNewCategoryLabel(e.target.value)}
            placeholder="新しいカテゴリ名"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="shrink-0 rounded-lg gold-border gold-text px-3 py-1.5 font-mono text-xs"
          >
            追加
          </button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-sm text-muted-foreground">記録の履歴</h3>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="px-3 py-2 text-left font-normal">日付</th>
                  <th className="px-3 py-2 text-left font-normal">カテゴリ</th>
                  <th className="px-3 py-2 text-right font-normal">金額</th>
                  <th className="px-3 py-2 text-left font-normal">メモ</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {[...transactions].reverse().map((t) => {
                  const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
                  return (
                    <tr key={t.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-2">{t.date}</td>
                      <td className="px-3 py-2">{categoryLabelById.get(t.categoryId) ?? "-"}</td>
                      <td className={`px-3 py-2 text-right ${isIncome ? "neon-text" : "neon-text-pink"}`}>
                        {isIncome ? "+" : "-"}
                        {formatYen(t.amount)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{t.memo || "-"}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(t.id)}
                          className="text-muted-foreground hover:text-destructive"
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
        </div>
      )}
    </div>
  );
}
