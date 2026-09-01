"use client";

import { formatYen } from "@/lib/portfolio";
import {
  categoryBudgetStatusForMonth,
  categoryNature,
  type BudgetCategory,
  type BudgetTransaction,
} from "@/lib/household";
import type { HouseholdDashboardSummary, SpendingPaceStatus } from "@/lib/monthlyBudget";
import type { MonthlyHistoryEntry } from "@/lib/monthlyReview";
import type { BudgetAdjustmentSuggestion } from "@/lib/budgetSuggestions";
import { LunaCoach } from "../LunaCoach";
import { MonthlyHistoryList } from "./MonthlyHistoryList";
import { BudgetSuggestionCard } from "./BudgetSuggestionCard";
import { SpecialReserveSuggestionCard } from "./SpecialReserveSuggestionCard";

// remainingSpendableが、今月使ってよい総額(monthlySpendableBudget)のこの割合を下回ったら「少なくなってきた」と案内する。
// spec上の明示的な閾値指定は無いため、独自の目安として採用。
const LOW_REMAINING_RATE = 0.15;

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

function lunaDashboardMessage(summary: HouseholdDashboardSummary, overBudgetCategoryCount: number): { variant: "watch" | "cheer" | "celebrate"; message: string } {
  if (summary.remainingSpendable < 0) {
    return {
      variant: "watch",
      message: "このペースだと少し赤字になりそう。大きめの支出がないか確認してみよう。",
    };
  }
  if (summary.monthlySpendableBudget > 0 && summary.remainingSpendable < summary.monthlySpendableBudget * LOW_REMAINING_RATE) {
    return {
      variant: "watch",
      message: "今月あと使える金額が少なくなってきたよ。残りの日数を見ながら調整しよう。",
    };
  }
  if (overBudgetCategoryCount > 0) {
    return {
      variant: "cheer",
      message: "予算をオーバーしているカテゴリがあるけど、家計全体ではまだ予算内だよ。",
    };
  }
  return { variant: "cheer", message: "いいペース。このままなら今月も余裕を残せそう。" };
}

export function HouseholdDashboard({
  summary,
  categories,
  transactions,
  month,
  monthlyHistoryEntries,
  budgetSuggestions,
  specialReserveSuggestion,
  onEditBudget,
  onGoToDiagnosis,
  onAdoptBudgetSuggestion,
  onAdoptSpecialReserve,
}: {
  summary: HouseholdDashboardSummary;
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  month: string;
  monthlyHistoryEntries: MonthlyHistoryEntry[];
  budgetSuggestions: BudgetAdjustmentSuggestion[];
  specialReserveSuggestion: { estimatedMonthlyReserve: number; annualTotal: number } | null;
  onEditBudget: () => void;
  onGoToDiagnosis: () => void;
  onAdoptBudgetSuggestion: (categoryId: string, budgetYen: number) => void;
  onAdoptSpecialReserve: (newReserve: number) => void;
}) {
  const variableBudgetStatuses = categoryBudgetStatusForMonth(transactions, categories, month).filter(
    (b) => categoryNature(b.category) === "variable"
  );
  const overBudgetCount = variableBudgetStatuses.filter((b) => b.overBudget).length;
  const luna = lunaDashboardMessage(summary, overBudgetCount);

  const categoryLabelById = new Map(categories.map((c) => [c.id, c.label]));
  const recentTransactions = [...transactions]
    .filter((t) => t.date.slice(0, 7) === month)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* 1. 今月あと使えるお金(最重要) */}
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

      <LunaCoach variant={luna.variant} message={luna.message} />

      {/* 2. 月末予想 */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono">
        <span className="text-xs text-muted-foreground">月末予想</span>
        <span className={`text-lg font-bold ${summary.projectedMonthEndBalance >= 0 ? "neon-text" : "text-destructive"}`}>
          {summary.projectedMonthEndBalance >= 0 ? "+" : ""}
          {formatYen(summary.projectedMonthEndBalance)}
        </span>
      </div>

      {/* 3. 貯金予定・投資予定 */}
      <div className="grid grid-cols-2 gap-2 text-center font-mono">
        <div className="rounded-lg border border-white/15 bg-white/5 p-2">
          <p className="text-[10px] text-muted-foreground">現金貯金の予定</p>
          <p className="neon-text text-sm font-bold">{formatYen(summary.plannedCashSavings)}</p>
        </div>
        <div className="rounded-lg border border-white/15 bg-white/5 p-2">
          <p className="text-[10px] text-muted-foreground">投資の予定</p>
          <p className="neon-text text-sm font-bold">{formatYen(summary.plannedInvestment)}</p>
        </div>
      </div>

      {/* 3-2. 特別費: 確保額に対する使用状況(確保額の範囲内なら生活費を圧迫しない、超過分だけ影響する) */}
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs">
          <span className="shrink-0 text-muted-foreground">特別費(旅行・帰省など)</span>
          <span className="shrink-0 text-muted-foreground">
            使用済み {formatYen(summary.actualSpecialExpenses)} / 確保額 {formatYen(summary.specialExpenseReserve)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${summary.specialExpenseOverage > 0 ? "bg-destructive" : "bg-[oklch(0.85_0.22_195)]"}`}
            style={{
              width: `${
                summary.specialExpenseReserve > 0
                  ? Math.min(100, Math.round((summary.actualSpecialExpenses / summary.specialExpenseReserve) * 100))
                  : summary.actualSpecialExpenses > 0
                    ? 100
                    : 0
              }%`,
            }}
          />
        </div>
        <p className={`text-[11px] ${summary.specialExpenseOverage > 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
          {summary.specialExpenseOverage > 0
            ? `確保額を${formatYen(summary.specialExpenseOverage)}超過(超過分だけ生活費から差し引いています)`
            : `残り${formatYen(summary.remainingSpecialExpenseReserve)}`}
        </p>
      </div>

      {/* 4. カテゴリ予算(変動費のみ) */}
      {variableBudgetStatuses.length > 0 && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <h3 className="font-mono text-sm text-muted-foreground">カテゴリ予算</h3>
          {variableBudgetStatuses.map((b) => (
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

      {/* 5. 最近の支出 */}
      {recentTransactions.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <h3 className="font-mono text-sm text-muted-foreground">最近の支出</h3>
          {recentTransactions.map((t) => {
            const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
            return (
              <div key={t.id} className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">
                  {t.date.slice(5)} {categoryLabelById.get(t.categoryId) ?? "未分類"}
                </span>
                <span className={isIncome ? "neon-text" : "neon-text-pink"}>
                  {isIncome ? "+" : "-"}
                  {formatYen(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 5-2. 今月の予算ペース */}
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

      {/* 5-3. 過去の実績 */}
      <MonthlyHistoryList entries={monthlyHistoryEntries} />

      {/* 5-4. 来月の予算のヒント(標準生活費学習・カテゴリ予算提案) */}
      <BudgetSuggestionCard suggestions={budgetSuggestions} onAdopt={onAdoptBudgetSuggestion} />

      {/* 5-5. 特別費積立の見直し提案(特別費候補から学習した年間見込み) */}
      {specialReserveSuggestion && (
        <SpecialReserveSuggestionCard
          estimatedMonthlyReserve={specialReserveSuggestion.estimatedMonthlyReserve}
          annualTotal={specialReserveSuggestion.annualTotal}
          currentReserve={summary.specialExpenseReserve}
          onAdopt={onAdoptSpecialReserve}
        />
      )}

      {/* 6. 補助情報・導線 */}
      <div className="flex gap-2 font-mono text-xs">
        <button
          type="button"
          onClick={onEditBudget}
          className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-muted-foreground hover:bg-white/5"
        >
          今月の予算を編集
        </button>
        <button
          type="button"
          onClick={onGoToDiagnosis}
          className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-muted-foreground hover:bg-white/5"
        >
          家計診断を見る
        </button>
      </div>
    </div>
  );
}
