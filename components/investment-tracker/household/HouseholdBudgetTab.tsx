"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import {
  categoryBudgetStatusForMonth,
  categoryNature,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
  type ExpenseNature,
} from "@/lib/household";
import type { HouseholdDashboardSummary, SpendingPaceStatus } from "@/lib/monthlyBudget";
import type { BudgetAdjustmentSuggestion } from "@/lib/budgetSuggestions";
import { BudgetSuggestionCard } from "./BudgetSuggestionCard";
import { SpecialReserveSuggestionCard } from "./SpecialReserveSuggestionCard";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const NATURE_LABELS: Record<ExpenseNature, string> = {
  fixed: "固定費",
  variable: "変動費",
  special: "特別費",
  investment: "投資",
};

const PACE_LABEL: Record<SpendingPaceStatus, string> = {
  early_month: "月初はまだ様子見",
  under_pace: "余裕のあるペース",
  on_pace: "標準的なペース",
  over_pace: "やや速いペース",
};

const PACE_MESSAGE: Record<SpendingPaceStatus, string> = {
  early_month: "月初はペースが安定しないよ。数日たったらまた見てみよう。",
  under_pace: "月の進みに対して支出は控えめ。今月は余裕を残せそう。",
  on_pace: "月の進みと支出のペースはだいたい同じくらいだよ。",
  over_pace: "月の進みより支出のペースが少し速いよ。残りの日数を意識してみよう。",
};

// 「予算」タブ。カテゴリ予算・予算ペース・予算編集・来月の提案・特別費積立見直し・
// カテゴリ管理をここに一本化する(以前はダッシュボードと家計簿タブに分散・一部重複していた)。
export function HouseholdBudgetTab({
  categories,
  transactions,
  summary,
  month,
  budgetSuggestions,
  specialReserveSuggestion,
  onEditBudget,
  onAdoptBudgetSuggestion,
  onAdoptSpecialReserve,
  onAddCategory,
  onDeleteCategory,
  onSetCategoryBudget,
  onSetCategoryNature,
}: {
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  summary: HouseholdDashboardSummary;
  month: string;
  budgetSuggestions: BudgetAdjustmentSuggestion[];
  specialReserveSuggestion: { estimatedMonthlyReserve: number; annualTotal: number } | null;
  onEditBudget: () => void;
  onAdoptBudgetSuggestion: (categoryId: string, budgetYen: number) => void;
  onAdoptSpecialReserve: (newReserve: number) => void;
  onAddCategory: (label: string, kind: BudgetCategoryKind) => void;
  onDeleteCategory: (id: string) => void;
  onSetCategoryBudget: (id: string, budgetYen: number) => void;
  onSetCategoryNature: (id: string, nature: ExpenseNature) => void;
}) {
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryKind, setNewCategoryKind] = useState<BudgetCategoryKind>("expense");
  // 毎日の記録作業とは性質が違う管理操作なので、初期状態では折りたたんでおく。
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  // ユーザーが今まさに入力中の値だけを保持する(未編集のカテゴリは常にcategories側の最新値を表示する)。
  const [budgetInputOverrides, setBudgetInputOverrides] = useState<Record<string, string>>({});

  const budgetStatuses = categoryBudgetStatusForMonth(transactions, categories, month);
  const overBudgetCount = budgetStatuses.filter((b) => b.overBudget).length;

  function handleAddCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    onAddCategory(label, newCategoryKind);
    setNewCategoryLabel("");
  }

  function handleSaveBudget(categoryId: string, displayedValue: string) {
    onSetCategoryBudget(categoryId, Number(displayedValue) || 0);
    setBudgetInputOverrides((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onEditBudget}
        className="w-full rounded-lg border border-white/15 px-3 py-2 font-mono text-xs text-muted-foreground hover:bg-white/5"
      >
        今月の予算を編集
      </button>

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
                  {b.overBudget && ` (残り${formatYen(Math.max(b.budgetYen - b.spentYen, 0))})`}
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

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono">
        <div className="flex items-center justify-between text-xs">
          <h3 className="text-muted-foreground">今月の予算ペース</h3>
          <span className="text-muted-foreground">{PACE_LABEL[summary.spendingPace]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">予算使用率</p>
            <p className="text-base font-bold">{Math.round(summary.budgetUsageRate * 100)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">月の進行</p>
            <p className="text-base font-bold">{Math.round(summary.monthProgressRate * 100)}%</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">{PACE_MESSAGE[summary.spendingPace]}</p>
      </div>

      <BudgetSuggestionCard suggestions={budgetSuggestions} onAdopt={onAdoptBudgetSuggestion} />

      {specialReserveSuggestion && (
        <SpecialReserveSuggestionCard
          estimatedMonthlyReserve={specialReserveSuggestion.estimatedMonthlyReserve}
          annualTotal={specialReserveSuggestion.annualTotal}
          currentReserve={summary.specialExpenseReserve}
          onAdopt={onAdoptSpecialReserve}
        />
      )}

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <button
          type="button"
          onClick={() => setShowCategoryManagement((v) => !v)}
          className="flex w-full items-center justify-between font-mono text-sm text-muted-foreground"
        >
          <span>カテゴリ管理</span>
          <span className="text-xs">{showCategoryManagement ? "閉じる ▲" : "開く ▼"}</span>
        </button>
        {showCategoryManagement && (
          <>
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">
                支出(分類は「今月あと使えるお金」の計算に使われます。予算を設定すると超過時に警告表示されます)
              </p>
              <div className="space-y-2">
                {expenseCategories.map((c) => (
                  <div key={c.id} className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-1.5">
                    <div className="flex items-center justify-between gap-1.5">
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
                      <select
                        value={categoryNature(c)}
                        onChange={(e) => onSetCategoryNature(c.id, e.target.value as ExpenseNature)}
                        className="w-24 shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                        aria-label={`${c.label}の分類`}
                      >
                        {(Object.keys(NATURE_LABELS) as ExpenseNature[]).map((n) => (
                          <option key={n} value={n}>
                            {NATURE_LABELS[n]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={budgetInputOverrides[c.id] ?? (c.monthlyBudgetYen ? String(c.monthlyBudgetYen) : "")}
                        onChange={(e) => setBudgetInputOverrides((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="予算(円・任意)"
                        aria-label={`${c.label}の予算`}
                        className={`${inputClass} py-1 text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveBudget(c.id, budgetInputOverrides[c.id] ?? (c.monthlyBudgetYen ? String(c.monthlyBudgetYen) : "0"))
                        }
                        aria-label={`${c.label}の予算を設定`}
                        className="shrink-0 rounded-lg border border-white/15 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-white/5"
                      >
                        設定
                      </button>
                    </div>
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
                className="w-24 shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
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
          </>
        )}
      </div>
    </div>
  );
}
