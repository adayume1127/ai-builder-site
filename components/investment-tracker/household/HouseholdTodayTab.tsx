"use client";

import { formatYen } from "@/lib/portfolio";
import { type BudgetCategory, type BudgetTransaction } from "@/lib/household";
import type { HouseholdDashboardSummary } from "@/lib/monthlyBudget";
import type { HouseholdGuidance } from "@/lib/householdGuidance";
import type { CashSavingsActionStatus } from "@/lib/monthlyActionState";
import { computeHouseholdToday } from "@/lib/householdToday";
import { LunaCoach } from "../LunaCoach";
import { HouseholdGuidanceButton } from "./HouseholdGuidanceButton";
import { TodayActionCard } from "./TodayActionCard";

// 「今日」タブ。「これだけ見れば次に何をすればいいか分かる」を担う場所(常時領域には
// 要約だけを出し、詳しい状況・操作はここに集約する。GPTとのUI/IA相談で確定)。
export function HouseholdTodayTab({
  summary,
  categories,
  transactions,
  month,
  guidance,
  onGuidanceAction,
  cashSavingsStatus,
  cashSavingsAmountYen,
  onUpdateCashSavingsAction,
}: {
  summary: HouseholdDashboardSummary;
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  month: string;
  guidance: HouseholdGuidance;
  onGuidanceAction: () => void;
  cashSavingsStatus: CashSavingsActionStatus | null;
  cashSavingsAmountYen: number;
  onUpdateCashSavingsAction: (status: CashSavingsActionStatus, amountYen: number) => void;
}) {
  const { todayAction, luna } = computeHouseholdToday(summary, categories, transactions, month, cashSavingsStatus);

  return (
    <div className="space-y-4">
      <TodayActionCard
        action={todayAction}
        cashSavingsStatus={cashSavingsStatus}
        cashSavingsAmountYen={cashSavingsAmountYen}
        plannedCashSavings={summary.plannedCashSavings}
        onUpdateCashSavings={onUpdateCashSavingsAction}
      />

      <LunaCoach variant={luna.variant} message={luna.message} />
      <HouseholdGuidanceButton guidance={guidance} onAction={onGuidanceAction} />

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono">
        <span className="text-xs text-muted-foreground">月末予想</span>
        <span className={`text-lg font-bold ${summary.projectedMonthEndBalance >= 0 ? "neon-text" : "text-destructive"}`}>
          {summary.projectedMonthEndBalance >= 0 ? "+" : ""}
          {formatYen(summary.projectedMonthEndBalance)}
        </span>
      </div>

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

      {/* 特別費: 確保額に対する使用状況(確保額の範囲内なら生活費を圧迫しない、超過分だけ影響する) */}
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
    </div>
  );
}
