"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AchievementsTab } from "@/components/investment-tracker/AchievementsTab";
import { AssetsTab } from "@/components/investment-tracker/AssetsTab";
import { BottomNav, type TabKey } from "@/components/investment-tracker/BottomNav";
import { BudgetTab } from "@/components/investment-tracker/BudgetTab";
import { DiagnosisResult } from "@/components/investment-tracker/household/DiagnosisResult";
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
  totalNetYen,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
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

  function handleCompleteDiagnosis(profile: HouseholdProfile, items: SpecialExpense[], mode: SpecialExpenseMode) {
    setHouseholdProfile(profile);
    setSpecialExpenses(items);
    setSpecialExpenseMode(mode);
    saveHouseholdProfile(profile);
    saveSpecialExpenses(items);
    saveHouseholdDiagnosisSettings({ specialExpenseMode: mode });
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

  const nowMonth = monthKey(new Date().toISOString().slice(0, 10));
  const transactionMonthCount = new Set(transactions.map((t) => monthKey(t.date))).size;
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
            !householdProfile ? (
              <HouseholdSetup onComplete={handleCompleteDiagnosis} />
            ) : (
              <div className="space-y-6">
                <DiagnosisResult
                  profile={householdProfile}
                  specialExpenses={specialExpenses}
                  specialExpenseMode={specialExpenseMode}
                  transactionMonthCount={transactionMonthCount}
                />
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
