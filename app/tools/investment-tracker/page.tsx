"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AchievementsTab } from "@/components/investment-tracker/AchievementsTab";
import { AssetsTab } from "@/components/investment-tracker/AssetsTab";
import { BottomNav, type TabKey } from "@/components/investment-tracker/BottomNav";
import { BudgetTab } from "@/components/investment-tracker/BudgetTab";
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
  loadTransactions,
  removeCategory,
  removeTransaction,
  saveCategories,
  saveTransactions,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
} from "@/lib/household";

export default function InvestmentTrackerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [targetAmountYen, setTargetAmountYen] = useState(0);
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>("month");
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  useEffect(() => {
    setGoals(loadGoals());
    setSnapshots(loadSnapshots());
    const settings = loadPortfolioSettings();
    setTargetAmountYen(settings.targetAmountYen);
    setChartGranularity(settings.chartGranularity);
    setCategories(loadCategories());
    setTransactions(loadTransactions());
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
    savePortfolioSettings({ targetAmountYen: value, chartGranularity });
  }

  function handleChangeGranularity(value: ChartGranularity) {
    setChartGranularity(value);
    savePortfolioSettings({ targetAmountYen, chartGranularity: value });
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

  const latestPortfolio = latestSnapshot(snapshots);
  const totalAssets = latestPortfolio ? snapshotTotals(latestPortfolio).totalYen : 0;
  const portfolioAssetsMan = latestPortfolio ? totalAssets / 10000 : null;
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
              snapshots={snapshots}
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
              onSave={handleSavePortfolio}
              onSaveTarget={handleSaveTarget}
              onChangeGranularity={handleChangeGranularity}
            />
          ) : activeTab === "budget" ? (
            <BudgetTab
              categories={categories}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          ) : (
            <AchievementsTab goals={goals} portfolioAssetsMan={portfolioAssetsMan} />
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
