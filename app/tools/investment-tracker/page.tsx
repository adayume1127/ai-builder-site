"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AchievementsTab } from "@/components/investment-tracker/AchievementsTab";
import { AssetsTab } from "@/components/investment-tracker/AssetsTab";
import { BottomNav, type TabKey } from "@/components/investment-tracker/BottomNav";
import { BudgetTab } from "@/components/investment-tracker/BudgetTab";
import { BudgetPlanAdopt } from "@/components/investment-tracker/household/BudgetPlanAdopt";
import { DiagnosisResult } from "@/components/investment-tracker/household/DiagnosisResult";
import { HouseholdDashboard } from "@/components/investment-tracker/household/HouseholdDashboard";
import { HouseholdSetup } from "@/components/investment-tracker/household/HouseholdSetup";
import { HomeTab } from "@/components/investment-tracker/HomeTab";
import { QuestTab, type FormMode } from "@/components/investment-tracker/QuestTab";
import {
  createGoal,
  loadGoals,
  playerRank,
  saveGoals,
  type Goal,
  type NewGoalInput,
} from "@/lib/investmentTracker";
import {
  deriveCashCategory,
  emptyBreakdown,
  formatYen,
  latestSnapshot,
  loadPortfolioSettings,
  loadSnapshots,
  savePortfolioSettings,
  saveSnapshots,
  snapshotTotals,
  todayKey,
  upsertSnapshot,
  type CategoryBreakdown,
  type ChartGranularity,
  type PortfolioSnapshot,
} from "@/lib/portfolio";
import {
  addCategory,
  addTransaction,
  loadCategories,
  loadHouseholdSettings,
  loadTransactions,
  monthKey,
  monthlySummaries,
  removeCategory,
  removeTransaction,
  saveCategories,
  saveHouseholdSettings,
  saveTransactions,
  setCategoryBudget,
  setCategoryNature,
  totalNetYen,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
  type ExpenseNature,
} from "@/lib/household";
import {
  loadHouseholdDiagnosisSettings,
  loadHouseholdProfile,
  loadSpecialExpenses,
  saveHouseholdDiagnosisSettings,
  saveHouseholdProfile,
  saveSpecialExpenses,
  type HouseholdProfile,
  type SpecialExpense,
  type SpecialExpenseMode,
} from "@/lib/householdDiagnosis";
import {
  buildHouseholdDashboardSummary,
  createMonthlyBudget,
  getMonthlyBudget,
  latestMonthlyBudget,
  loadMonthlyBudgets,
  recommendMonthlyBudget,
  saveMonthlyBudgets,
  upsertMonthlyBudget,
  type MonthlyBudget,
  type RecommendedMonthlyBudget,
} from "@/lib/monthlyBudget";

export default function InvestmentTrackerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [targetAmountYen, setTargetAmountYen] = useState(0);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>("month");
  const [openingCashBalanceYen, setOpeningCashBalanceYen] = useState(0);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [savingsGoalYen, setSavingsGoalYen] = useState(0);
  const [householdProfile, setHouseholdProfile] = useState<HouseholdProfile | null>(null);
  const [specialExpenses, setSpecialExpenses] = useState<SpecialExpense[]>([]);
  const [specialExpenseMode, setSpecialExpenseMode] = useState<SpecialExpenseMode>("unknown");
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([]);
  const [editingBudget, setEditingBudget] = useState(false);
  const [showDiagnosisDetail, setShowDiagnosisDetail] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  useEffect(() => {
    setGoals(loadGoals());
    setSnapshots(loadSnapshots());
    const settings = loadPortfolioSettings();
    setTargetAmountYen(settings.targetAmountYen);
    setChartGranularity(settings.chartGranularity);
    setOpeningCashBalanceYen(settings.openingCashBalanceYen);
    setCategories(loadCategories());
    setTransactions(loadTransactions());
    setSavingsGoalYen(loadHouseholdSettings().monthlySavingsGoalYen);
    setHouseholdProfile(loadHouseholdProfile());
    setSpecialExpenses(loadSpecialExpenses());
    setSpecialExpenseMode(loadHouseholdDiagnosisSettings().specialExpenseMode);
    setMonthlyBudgets(loadMonthlyBudgets());
    setLoaded(true);
  }, []);

  function persist(next: Goal[]) {
    setGoals(next);
    saveGoals(next);
  }

  function handleSavePortfolio(breakdown: CategoryBreakdown) {
    const next = upsertSnapshot(snapshots, breakdown);
    setSnapshots(next);
    saveSnapshots(next);
  }

  function handleSaveTarget(value: number) {
    setTargetAmountYen(value);
    savePortfolioSettings({ targetAmountYen: value, chartGranularity, openingCashBalanceYen });
  }

  function handleChangeGranularity(value: ChartGranularity) {
    setChartGranularity(value);
    savePortfolioSettings({ targetAmountYen, chartGranularity: value, openingCashBalanceYen });
  }

  function handleSaveOpeningCashBalance(value: number) {
    setOpeningCashBalanceYen(value);
    savePortfolioSettings({ targetAmountYen, chartGranularity, openingCashBalanceYen: value });
  }

  function handleAddTransaction(input: Omit<BudgetTransaction, "id">) {
    const next = addTransaction(transactions, input);
    setTransactions(next);
    saveTransactions(next);
  }

  function handleDeleteTransaction(id: string) {
    const next = removeTransaction(transactions, id);
    setTransactions(next);
    saveTransactions(next);
  }

  function handleAddCategory(label: string, kind: BudgetCategoryKind) {
    const next = addCategory(categories, label, kind);
    setCategories(next);
    saveCategories(next);
  }

  function handleDeleteCategory(id: string) {
    const next = removeCategory(categories, id);
    setCategories(next);
    saveCategories(next);
  }

  function handleSaveSavingsGoal(value: number) {
    setSavingsGoalYen(value);
    saveHouseholdSettings({ monthlySavingsGoalYen: value });
  }

  function handleSetCategoryBudget(id: string, budgetYen: number) {
    const next = setCategoryBudget(categories, id, budgetYen);
    setCategories(next);
    saveCategories(next);
  }

  function handleSetCategoryNature(id: string, nature: ExpenseNature) {
    const next = setCategoryNature(categories, id, nature);
    setCategories(next);
    saveCategories(next);
  }

  function handleCompleteDiagnosis(profile: HouseholdProfile, items: SpecialExpense[], mode: SpecialExpenseMode) {
    setHouseholdProfile(profile);
    setSpecialExpenses(items);
    setSpecialExpenseMode(mode);
    saveHouseholdProfile(profile);
    saveSpecialExpenses(items);
    saveHouseholdDiagnosisSettings({ specialExpenseMode: mode });
  }

  function handleAdoptMonthlyBudget(values: RecommendedMonthlyBudget) {
    const month = monthKey(todayKey());
    const isFirstAdoption = monthlyBudgets.length === 0;
    const next = upsertMonthlyBudget(monthlyBudgets, createMonthlyBudget(values, month));
    setMonthlyBudgets(next);
    saveMonthlyBudgets(next);
    setEditingBudget(false);
    // 初回採用時のみ、既存の「毎月の貯金目標」(マネークエスト・BudgetTabの進捗バーが参照)にも同期する。
    // 以降は今月の予算(MonthlyBudget)と貯金目標を独立して編集できる。
    if (isFirstAdoption) {
      handleSaveSavingsGoal(values.plannedCashSavings);
    }
  }

  function handleCreate(input: NewGoalInput) {
    persist([...goals, createGoal(input)]);
    setFormMode({ type: "closed" });
  }

  function handleEditSave(goalId: string, input: NewGoalInput) {
    persist(
      goals.map((g) =>
        g.id === goalId
          ? { ...g, ...input, actual: input.actual ? { ...g.actual, ...input.actual } : g.actual }
          : g
      )
    );
    setFormMode({ type: "closed" });
  }

  function handleUpdate(goal: Goal) {
    persist(goals.map((g) => (g.id === goal.id ? goal : g)));
  }

  function handleDelete(goalId: string) {
    if (!confirm("この目標を削除しますか？(元に戻せません)")) return;
    persist(goals.filter((g) => g.id !== goalId));
    if (formMode.type === "edit" && formMode.goalId === goalId) {
      setFormMode({ type: "closed" });
    }
  }

  const nowMonth = monthKey(todayKey());
  const transactionMonthCount = new Set(transactions.map((t) => monthKey(t.date))).size;
  const recommendedMonthlyBudget = householdProfile
    ? recommendMonthlyBudget(householdProfile, specialExpenses, specialExpenseMode)
    : null;
  const currentMonthlyBudget = getMonthlyBudget(monthlyBudgets, nowMonth);
  const previousMonthlyBudget = latestMonthlyBudget(monthlyBudgets);
  const householdNetYen = totalNetYen(transactions, categories);
  const thisMonthSummary = monthlySummaries(transactions, categories).find((s) => s.month === nowMonth);
  const cashCategory = deriveCashCategory(openingCashBalanceYen, householdNetYen, thisMonthSummary?.savingsYen ?? 0);

  const latestPortfolio = latestSnapshot(snapshots);
  const liveBreakdown: CategoryBreakdown = {
    ...(latestPortfolio?.categories ?? emptyBreakdown()),
    cashSavings: cashCategory,
  };
  const manualAssetsTotal = latestPortfolio
    ? snapshotTotals(latestPortfolio).totalYen - latestPortfolio.categories.cashSavings.currentValueYen
    : 0;
  const totalAssets = manualAssetsTotal + cashCategory.currentValueYen;
  const hasAssetData = latestPortfolio !== null || openingCashBalanceYen !== 0 || transactions.length > 0;
  const portfolioAssetsMan = hasAssetData ? totalAssets / 10000 : null;
  const rank = playerRank(goals, portfolioAssetsMan);

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-xs">
        <Link href="/" className="neon-text-pink underline shrink-0">
          ← ホーム
        </Link>
        <span className="truncate text-muted-foreground">
          🌙 Lv.{rank.level} 総資産 <span className="gold-text font-bold">{formatYen(totalAssets)}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-6">
          {!loaded ? null : activeTab === "home" ? (
            <HomeTab
              goals={goals}
              portfolioBreakdown={liveBreakdown}
              portfolioTotal={totalAssets}
              portfolioAssetsMan={portfolioAssetsMan}
              onGoToQuest={() => {
                setActiveTab("quest");
                if (goals.length === 0) setFormMode({ type: "create" });
              }}
              onGoToAchievements={() => setActiveTab("achievements")}
              onGoToAssets={() => setActiveTab("assets")}
            />
          ) : activeTab === "quest" ? (
            <QuestTab
              goals={goals}
              totalAssetsYen={totalAssets}
              portfolioAssetsMan={portfolioAssetsMan}
              formMode={formMode}
              onOpenCreate={() => setFormMode({ type: "create" })}
              onCloseForm={() => setFormMode({ type: "closed" })}
              onCreate={handleCreate}
              onEditSave={handleEditSave}
              onEditOpen={(goalId) => setFormMode({ type: "edit", goalId })}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ) : activeTab === "assets" ? (
            <AssetsTab
              snapshots={snapshots}
              targetAmountYen={targetAmountYen}
              granularity={chartGranularity}
              cashCategory={cashCategory}
              openingCashBalanceYen={openingCashBalanceYen}
              onSave={handleSavePortfolio}
              onSaveTarget={handleSaveTarget}
              onChangeGranularity={handleChangeGranularity}
              onSaveOpeningCashBalance={handleSaveOpeningCashBalance}
            />
          ) : activeTab === "budget" ? (
            !householdProfile || !recommendedMonthlyBudget ? (
              <HouseholdSetup onComplete={handleCompleteDiagnosis} />
            ) : !currentMonthlyBudget || editingBudget ? (
              <BudgetPlanAdopt
                variant={editingBudget ? "edit" : monthlyBudgets.length === 0 ? "initial" : "rollover"}
                diagnosisRecommendation={recommendedMonthlyBudget}
                previousBudget={editingBudget ? currentMonthlyBudget : previousMonthlyBudget}
                onAdopt={handleAdoptMonthlyBudget}
              />
            ) : (
              <div className="space-y-6">
                <HouseholdDashboard
                  summary={buildHouseholdDashboardSummary(currentMonthlyBudget, transactions, categories)}
                  categories={categories}
                  transactions={transactions}
                  month={nowMonth}
                  onEditBudget={() => setEditingBudget(true)}
                  onGoToDiagnosis={() => setShowDiagnosisDetail((v) => !v)}
                />
                {showDiagnosisDetail && (
                  <div className="space-y-2 border-t border-white/10 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowDiagnosisDetail(false)}
                      className="font-mono text-xs text-muted-foreground underline"
                    >
                      閉じる ▲
                    </button>
                    <DiagnosisResult
                      profile={householdProfile}
                      specialExpenses={specialExpenses}
                      specialExpenseMode={specialExpenseMode}
                      transactionMonthCount={transactionMonthCount}
                    />
                  </div>
                )}
                <div className="border-t border-white/10 pt-6">
                  <BudgetTab
                    categories={categories}
                    transactions={transactions}
                    savingsGoalYen={savingsGoalYen}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onAddCategory={handleAddCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onSaveSavingsGoal={handleSaveSavingsGoal}
                    onSetCategoryBudget={handleSetCategoryBudget}
                    onSetCategoryNature={handleSetCategoryNature}
                  />
                </div>
              </div>
            )
          ) : (
            <AchievementsTab
              goals={goals}
              portfolioAssetsMan={portfolioAssetsMan}
              transactions={transactions}
              categories={categories}
              savingsGoalYen={savingsGoalYen}
              hasInvestmentRecord={latestPortfolio !== null}
              nowMonth={nowMonth}
            />
          )}

          <p className="text-center text-xs text-muted-foreground">
            ※ データはこのブラウザ内(localStorage)にのみ保存されます。別の端末やブラウザからは見られません。
            <br />
            単発で計算したいだけの場合は
            <Link href="/tools/investment-calculator" className="neon-text-pink underline">
              積立シミュレーター
            </Link>
            もどうぞ。
          </p>
        </div>
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
