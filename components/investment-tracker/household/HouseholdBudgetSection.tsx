"use client";

import {
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
  type ExpenseNature,
} from "@/lib/household";
import type { HouseholdDashboardSummary } from "@/lib/monthlyBudget";
import type { MonthlyHistoryEntry, MonthlyReview } from "@/lib/monthlyReview";
import type { BudgetAdjustmentSuggestion } from "@/lib/budgetSuggestions";
import type { GoalFundingPlan, HouseholdProfile, SpecialExpense, SpecialExpenseMode } from "@/lib/householdDiagnosis";
import type { HouseholdGuidance } from "@/lib/householdGuidance";
import type { CashSavingsActionStatus } from "@/lib/monthlyActionState";
import type { SpecialExpenseCandidateRecurrence } from "@/lib/specialExpenseDetection";
import { SpecialExpensePrompt } from "./SpecialExpensePrompt";
import { HouseholdQuickArea } from "./HouseholdQuickArea";
import { HouseholdTodayTab } from "./HouseholdTodayTab";
import { HouseholdBudgetTab } from "./HouseholdBudgetTab";
import { HouseholdHistoryTab } from "./HouseholdHistoryTab";
import { HouseholdSettingsTab } from "./HouseholdSettingsTab";

type SubTab = "today" | "budget" | "history" | "settings";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "budget", label: "予算" },
  { key: "history", label: "履歴" },
  { key: "settings", label: "設定" },
];

// 「家計簿」タブ本体。常時領域(今月あと使えるお金+クイック入力+Lunaの短いCTA)の下に
// 今日/予算/履歴/設定の4サブタブを置く(GPTとのUI/IA相談で確定した構成)。
// 状態・ハンドラの大半はpage.tsx(オーケストレーター)側に残し、ここでは表示の
// 出し分けだけを行う。activeSubTabはハンドラから直接遷移させたい箇所(「困ったらここ」等)
// があるため、呼び出し元(page.tsx)から制御された値として受け取る。
export function HouseholdBudgetSection({
  activeSubTab,
  onChangeSubTab,
  showAdoptionCelebration,
  onCloseAdoptionCelebration,
  pendingSpecialExpenseCandidate,
  specialExpenseCategoryLabel,
  onResolveSpecialExpensePrompt,
  summary,
  categories,
  transactions,
  month,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  investmentEntryRequestId,
  investmentCategoryId,
  guidance,
  onGuidanceAction,
  cashSavingsStatus,
  cashSavingsAmountYen,
  onUpdateCashSavingsAction,
  budgetSuggestions,
  specialReserveSuggestion,
  onEditBudget,
  onAdoptBudgetSuggestion,
  onAdoptSpecialReserve,
  onAddCategory,
  onDeleteCategory,
  onSetCategoryBudget,
  onSetCategoryNature,
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
  onSaveMonthlyReviewAllocation,
  isLatestReviewMonth,
  hasOlderReviewMonth,
  hasNewerReviewMonth,
  onNavigateReviewMonth,
  onJumpToLatestReviewMonth,
  onRequestInvestmentEntry,
  hasInvestmentCategory,
  householdProfile,
  specialExpenses,
  specialExpenseMode,
  transactionMonthCount,
  goalType,
  goalFundingPlan,
  onSaveGoalBonusAllocation,
  onEditGoalDeadline,
  onStartReDiagnosis,
}: {
  activeSubTab: SubTab;
  onChangeSubTab: (tab: SubTab) => void;
  showAdoptionCelebration: boolean;
  onCloseAdoptionCelebration: () => void;
  pendingSpecialExpenseCandidate: BudgetTransaction | null;
  specialExpenseCategoryLabel: string;
  onResolveSpecialExpensePrompt: (decision: "special" | "normal", recurrence?: SpecialExpenseCandidateRecurrence) => void;
  summary: HouseholdDashboardSummary;
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  month: string;
  onAddTransaction: (input: Omit<BudgetTransaction, "id">) => void;
  onUpdateTransaction: (id: string, patch: Partial<Omit<BudgetTransaction, "id">>) => void;
  onDeleteTransaction: (id: string) => void;
  investmentEntryRequestId: number;
  investmentCategoryId: string | null;
  guidance: HouseholdGuidance;
  onGuidanceAction: () => void;
  cashSavingsStatus: CashSavingsActionStatus | null;
  cashSavingsAmountYen: number;
  onUpdateCashSavingsAction: (status: CashSavingsActionStatus, amountYen: number) => void;
  budgetSuggestions: BudgetAdjustmentSuggestion[];
  specialReserveSuggestion: { estimatedMonthlyReserve: number; annualTotal: number } | null;
  onEditBudget: () => void;
  onAdoptBudgetSuggestion: (categoryId: string, budgetYen: number) => void;
  onAdoptSpecialReserve: (newReserve: number) => void;
  onAddCategory: (label: string, kind: BudgetCategoryKind) => void;
  onDeleteCategory: (id: string) => void;
  onSetCategoryBudget: (id: string, budgetYen: number) => void;
  onSetCategoryNature: (id: string, nature: ExpenseNature) => void;
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
  onSaveMonthlyReviewAllocation: (cash: number, special: number) => void;
  isLatestReviewMonth: boolean;
  hasOlderReviewMonth: boolean;
  hasNewerReviewMonth: boolean;
  onNavigateReviewMonth: (direction: "older" | "newer") => void;
  onJumpToLatestReviewMonth: () => void;
  onRequestInvestmentEntry: () => void;
  hasInvestmentCategory: boolean;
  householdProfile: HouseholdProfile;
  specialExpenses: SpecialExpense[];
  specialExpenseMode: SpecialExpenseMode;
  transactionMonthCount: number;
  goalType: string | null;
  goalFundingPlan: GoalFundingPlan | null;
  onSaveGoalBonusAllocation: (amount: number) => void;
  onEditGoalDeadline: () => void;
  onStartReDiagnosis: () => void;
}) {
  return (
    <div className="space-y-4">
      {showAdoptionCelebration && (
        <div className="flex items-center justify-between gap-2 rounded-xl gold-border bg-white/5 px-4 py-3">
          <p className="text-sm">🎉 今月のプランができたよ。次は下の「今日やること」を1つ進めてみよう。</p>
          <button
            type="button"
            onClick={onCloseAdoptionCelebration}
            className="shrink-0 font-mono text-xs text-muted-foreground underline"
          >
            とじる
          </button>
        </div>
      )}

      {pendingSpecialExpenseCandidate && (
        <SpecialExpensePrompt
          transaction={pendingSpecialExpenseCandidate}
          categoryLabel={specialExpenseCategoryLabel}
          onResolve={onResolveSpecialExpensePrompt}
        />
      )}

      <HouseholdQuickArea
        summary={summary}
        categories={categories}
        transactions={transactions}
        month={month}
        cashSavingsStatus={cashSavingsStatus}
        onGoToToday={() => onChangeSubTab("today")}
        onAddTransaction={onAddTransaction}
        onDeleteTransaction={onDeleteTransaction}
        investmentEntryRequestId={investmentEntryRequestId}
        investmentCategoryId={investmentCategoryId}
      />

      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 font-mono text-xs">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onChangeSubTab(t.key)}
            className={`flex-1 rounded-lg px-2 py-1.5 ${
              activeSubTab === t.key ? "neon-border neon-text" : "text-muted-foreground hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === "today" ? (
        <HouseholdTodayTab
          summary={summary}
          categories={categories}
          transactions={transactions}
          month={month}
          guidance={guidance}
          onGuidanceAction={onGuidanceAction}
          cashSavingsStatus={cashSavingsStatus}
          cashSavingsAmountYen={cashSavingsAmountYen}
          onUpdateCashSavingsAction={onUpdateCashSavingsAction}
        />
      ) : activeSubTab === "budget" ? (
        <HouseholdBudgetTab
          categories={categories}
          transactions={transactions}
          summary={summary}
          month={month}
          budgetSuggestions={budgetSuggestions}
          specialReserveSuggestion={specialReserveSuggestion}
          onEditBudget={onEditBudget}
          onAdoptBudgetSuggestion={onAdoptBudgetSuggestion}
          onAdoptSpecialReserve={onAdoptSpecialReserve}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
          onSetCategoryBudget={onSetCategoryBudget}
          onSetCategoryNature={onSetCategoryNature}
        />
      ) : activeSubTab === "history" ? (
        <HouseholdHistoryTab
          categories={categories}
          transactions={transactions}
          onUpdateTransaction={onUpdateTransaction}
          onDeleteTransaction={onDeleteTransaction}
          monthlyHistoryEntries={monthlyHistoryEntries}
          selectedReviewMonth={selectedReviewMonth}
          onSelectReviewMonth={onSelectReviewMonth}
          reviewTargetMonth={reviewTargetMonth}
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
          onSaveAllocation={onSaveMonthlyReviewAllocation}
          isLatestReviewMonth={isLatestReviewMonth}
          hasOlderReviewMonth={hasOlderReviewMonth}
          hasNewerReviewMonth={hasNewerReviewMonth}
          onNavigateReviewMonth={onNavigateReviewMonth}
          onJumpToLatestReviewMonth={onJumpToLatestReviewMonth}
          onRequestInvestmentEntry={onRequestInvestmentEntry}
          hasInvestmentCategory={hasInvestmentCategory}
        />
      ) : (
        <HouseholdSettingsTab
          profile={householdProfile}
          transactions={transactions}
          categories={categories}
          currentMonth={month}
          specialExpenses={specialExpenses}
          specialExpenseMode={specialExpenseMode}
          transactionMonthCount={transactionMonthCount}
          goalType={goalType}
          goalFundingPlan={goalFundingPlan}
          onSaveGoalBonusAllocation={onSaveGoalBonusAllocation}
          onEditGoalDeadline={onEditGoalDeadline}
          onStartReDiagnosis={onStartReDiagnosis}
        />
      )}
    </div>
  );
}

export type { SubTab as HouseholdBudgetSubTab };
