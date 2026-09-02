"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { AchievementsTab } from "@/components/investment-tracker/AchievementsTab";
import { AssetsTab } from "@/components/investment-tracker/AssetsTab";
import { BottomNav, type TabKey } from "@/components/investment-tracker/BottomNav";
import { BudgetTab } from "@/components/investment-tracker/BudgetTab";
import { BudgetPlanAdopt } from "@/components/investment-tracker/household/BudgetPlanAdopt";
import { DiagnosisResult } from "@/components/investment-tracker/household/DiagnosisResult";
import { HouseholdDashboard } from "@/components/investment-tracker/household/HouseholdDashboard";
import { HouseholdSetup } from "@/components/investment-tracker/household/HouseholdSetup";
import { MonthlyReviewCard } from "@/components/investment-tracker/household/MonthlyReviewCard";
import { ReDiagnosisReflectChoice } from "@/components/investment-tracker/household/ReDiagnosisReflectChoice";
import { SpecialExpensePrompt } from "@/components/investment-tracker/household/SpecialExpensePrompt";
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
  categoryNature,
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
  updateTransactionCategory,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
  type ExpenseNature,
} from "@/lib/household";
import {
  computeGoalFundingPlan,
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
import {
  actualFixedExpenses,
  actualIncome,
  actualMonthlyInvestment,
  actualSpecialExpenses,
  actualVariableExpenses,
  completedMonths,
  getMonthlyReview,
  loadMonthlyReviews,
  monthlyHistory,
  monthlySurplus,
  saveMonthlyReviews,
  upsertMonthlyReview,
  type MonthlyReview,
} from "@/lib/monthlyReview";
import { suggestBudgetAdjustments } from "@/lib/budgetSuggestions";
import {
  addSpecialExpenseCandidate,
  estimatedAnnualSpecialExpenses,
  estimatedMonthlySpecialExpenseReserve,
  findUnresolvedLargeExpenseCandidate,
  loadResolvedSpecialExpensePromptIds,
  loadSpecialExpenseCandidates,
  removeSpecialExpenseCandidatesForTransaction,
  saveResolvedSpecialExpensePromptIds,
  saveSpecialExpenseCandidates,
  type SpecialExpenseCandidate,
  type SpecialExpenseCandidateRecurrence,
} from "@/lib/specialExpenseDetection";

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
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>([]);
  const [specialExpenseCandidates, setSpecialExpenseCandidates] = useState<SpecialExpenseCandidate[]>([]);
  const [resolvedPromptIds, setResolvedPromptIds] = useState<string[]>([]);
  const [editingBudget, setEditingBudget] = useState(false);
  const [showDiagnosisDetail, setShowDiagnosisDetail] = useState(false);
  const [reDiagnosing, setReDiagnosing] = useState(false);
  const [pendingReDiagnosis, setPendingReDiagnosis] = useState<{
    profile: HouseholdProfile;
    items: SpecialExpense[];
    mode: SpecialExpenseMode;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [reloading, setReloading] = useState(false);
  const [selectedReviewMonth, setSelectedReviewMonth] = useState<string | null>(null);
  const [investmentEntryRequestId, setInvestmentEntryRequestId] = useState(0);

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
    setMonthlyReviews(loadMonthlyReviews());
    setSpecialExpenseCandidates(loadSpecialExpenseCandidates());
    setResolvedPromptIds(loadResolvedSpecialExpensePromptIds());
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

    // 削除した取引を元にした特別費候補が残ると、実在しない取引の金額が
    // 年間特別費の見積もりに残り続けてしまうため、合わせて取り除く。
    const nextCandidates = removeSpecialExpenseCandidatesForTransaction(specialExpenseCandidates, id);
    if (nextCandidates.length !== specialExpenseCandidates.length) {
      setSpecialExpenseCandidates(nextCandidates);
      saveSpecialExpenseCandidates(nextCandidates);
    }
    // resolvedPromptIdsに残っていても実害はないが(存在しない取引idは二度とマッチしない)、
    // ストレージを肥大化させないため合わせて掃除する。
    if (resolvedPromptIds.includes(id)) {
      const nextResolved = resolvedPromptIds.filter((rid) => rid !== id);
      setResolvedPromptIds(nextResolved);
      saveResolvedSpecialExpensePromptIds(nextResolved);
    }
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

  // 再診断ウィザードが完了した直後。ここではまだ何も保存しない — 今月の予算に反映するかどうかを
  // ユーザーに選ばせてから(handleReflectReDiagnosis)保存する。
  function handleFinishReDiagnosisWizard(profile: HouseholdProfile, items: SpecialExpense[], mode: SpecialExpenseMode) {
    setPendingReDiagnosis({ profile, items, mode });
  }

  // 「今月にも反映する/来月から反映する」の選択結果。いずれの場合もHouseholdProfileは保存するが、
  // 今月のMonthlyBudgetは reflectThisMonth を選んだ場合のみ新しい診断内容で作り直す(spec: 月替わり処理と同様、
  // ユーザーが選ばない限り進行中のMonthlyBudgetを自動変更しない)。
  function handleReflectReDiagnosis(reflectThisMonth: boolean) {
    if (!pendingReDiagnosis) return;
    const { profile, items, mode } = pendingReDiagnosis;
    handleCompleteDiagnosis(profile, items, mode);
    if (reflectThisMonth) {
      const recommended = recommendMonthlyBudget(profile, items, mode);
      const month = monthKey(todayKey());
      const next = upsertMonthlyBudget(monthlyBudgets, createMonthlyBudget(recommended, month));
      setMonthlyBudgets(next);
      saveMonthlyBudgets(next);
    }
    setPendingReDiagnosis(null);
    setReDiagnosing(false);
    setShowDiagnosisDetail(false);
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

  // 目標達成プランの「ボーナスをこの目標に使う」金額をユーザーが確定したときだけ保存する。
  // suggestedBonusAllocated(おすすめ値)は表示にのみ使い、ここを経由するまでprofileへは書き込まない。
  function handleSaveGoalBonusAllocation(amount: number) {
    if (!householdProfile?.goal) return;
    const updated: HouseholdProfile = {
      ...householdProfile,
      goal: { ...householdProfile.goal, bonusAllocated: amount },
      updatedAt: new Date().toISOString(),
    };
    setHouseholdProfile(updated);
    saveHouseholdProfile(updated);
  }

  function handleAdoptSpecialReserve(newReserve: number) {
    const month = monthKey(todayKey());
    const current = getMonthlyBudget(monthlyBudgets, month);
    if (!current) return;
    const updated = { ...current, specialExpenseReserve: newReserve, updatedAt: new Date().toISOString() };
    const next = upsertMonthlyBudget(monthlyBudgets, updated);
    setMonthlyBudgets(next);
    saveMonthlyBudgets(next);
  }

  // 大口支出プロンプトへの回答。「特別費にする」を選んだ場合のみ、
  // (1)既存取引のカテゴリを特別費カテゴリへ変更(新規取引は作らない=二重計上防止)
  // (2)将来の特別費見込みとしてSpecialExpenseCandidateを保存する。
  // どちらの回答でも、年間特別費・MonthlyBudget・HouseholdProfileは自動変更しない。
  function handleResolveSpecialExpensePrompt(
    transaction: BudgetTransaction,
    decision: "special" | "normal",
    recurrence?: SpecialExpenseCandidateRecurrence
  ) {
    const nextResolved = [...resolvedPromptIds, transaction.id];
    setResolvedPromptIds(nextResolved);
    saveResolvedSpecialExpensePromptIds(nextResolved);

    if (decision !== "special" || !recurrence) return;

    const specialCategoryId = categories.find((c) => categoryNature(c) === "special")?.id ?? "special-expense";
    const nextTransactions = updateTransactionCategory(transactions, transaction.id, specialCategoryId);
    setTransactions(nextTransactions);
    saveTransactions(nextTransactions);

    const nextCandidates = addSpecialExpenseCandidate(specialExpenseCandidates, {
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      sourceTransactionId: transaction.id,
      recurrence,
      expectedMonth: Number(transaction.date.slice(5, 7)),
    });
    setSpecialExpenseCandidates(nextCandidates);
    saveSpecialExpenseCandidates(nextCandidates);
  }

  // 月末レビューの割り当て保存。allocatedToCashSavings/allocatedToSpecialReserveは「用途ラベル」であり、
  // 預金残高(資産タブの「預金」)はここでは一切変更しない。monthlySurplusはすでに家計簿の実績取引から
  // 自動計算され、既に預金残高に反映済みのため、ここで残高へ再度加算すると二重計上になる。
  function handleSaveMonthlyReviewAllocation(month: string, allocatedToCashSavings: number, allocatedToSpecialReserve: number) {
    const next = upsertMonthlyReview(monthlyReviews, {
      month,
      allocatedToCashSavings,
      allocatedToSpecialReserve,
      reviewedAt: new Date().toISOString(),
    });
    setMonthlyReviews(next);
    saveMonthlyReviews(next);
  }

  function handleNavigateReviewMonth(direction: "older" | "newer") {
    // 今月は completedMonths() 上「実績十分」と判定され得ても、レビュー対象の候補には含めない
    // (下の reviewableMonthsDesc 算出は render本体側と同じ考え方に揃える)。
    const reviewableMonthsDesc = completedMonths(transactions, categories).filter((m) => m !== nowMonth);
    const currentMonth =
      selectedReviewMonth && reviewableMonthsDesc.includes(selectedReviewMonth) ? selectedReviewMonth : reviewableMonthsDesc[0] ?? null;
    if (!currentMonth) return;
    const index = reviewableMonthsDesc.indexOf(currentMonth);
    const nextMonth = direction === "older" ? reviewableMonthsDesc[index + 1] : reviewableMonthsDesc[index - 1];
    if (nextMonth) setSelectedReviewMonth(nextMonth);
  }

  function handleRequestInvestmentEntry() {
    setInvestmentEntryRequestId((n) => n + 1);
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
  // 目標達成プラン。DiagnosisResult・HouseholdDashboardの両方でこの1箇所の計算結果を共有する
  // (コンポーネント側で再計算しない。単一の真実源を維持する)。
  const goalFundingPlan =
    householdProfile?.goal && recommendedMonthlyBudget
      ? computeGoalFundingPlan(
          householdProfile.goal,
          householdProfile.income.bonusPayments,
          recommendedMonthlyBudget.plannedCashSavings,
          householdProfile.goal.bonusAllocated
        )
      : null;
  const currentMonthlyBudget = getMonthlyBudget(monthlyBudgets, nowMonth);
  const previousMonthlyBudget = latestMonthlyBudget(monthlyBudgets);
  const pendingSpecialExpenseCandidate = findUnresolvedLargeExpenseCandidate(
    transactions,
    categories,
    new Set(resolvedPromptIds),
    nowMonth
  );
  const estimatedAnnualSpecial = estimatedAnnualSpecialExpenses(specialExpenseCandidates, specialExpenses);
  const estimatedMonthlySpecial = estimatedMonthlySpecialExpenseReserve(estimatedAnnualSpecial);
  const hasAnnualSpecialCandidate = specialExpenseCandidates.some((c) => c.recurrence === "annual");

  // 月末レビューの対象月: デフォルトは今月より前で実績が十分にある直近の月(=先月)。
  // ユーザーが月次履歴から別の完了月を選ぶと selectedReviewMonth が優先される
  // (データ変更でその月が完了月リストから外れた場合は自動でデフォルトへ戻す)。
  // 今月も取引が5件以上あれば completedMonths() の判定上は「実績十分」になり得るが、
  // 今月はまだ終わっていないため、レビュー対象の候補からは常に除外する
  // (除外し忘れると◀/▶ナビゲーションで今月へ入り込めてしまうバグになる)。
  const completedMonthsDesc = completedMonths(transactions, categories);
  const reviewableMonthsDesc = completedMonthsDesc.filter((m) => m !== nowMonth);
  const latestReviewMonth = reviewableMonthsDesc[0] ?? null;
  const reviewTargetMonth =
    selectedReviewMonth && reviewableMonthsDesc.includes(selectedReviewMonth) ? selectedReviewMonth : latestReviewMonth;
  const reviewTargetIndex = reviewTargetMonth ? reviewableMonthsDesc.indexOf(reviewTargetMonth) : -1;
  const previousReviewMonth = reviewTargetIndex >= 0 ? reviewableMonthsDesc[reviewTargetIndex + 1] ?? null : null;
  const reviewTargetBudget = reviewTargetMonth ? getMonthlyBudget(monthlyBudgets, reviewTargetMonth) : null;
  const isLatestReviewMonth = reviewTargetMonth === latestReviewMonth;
  const hasOlderReviewMonth = reviewTargetIndex >= 0 && reviewTargetIndex < reviewableMonthsDesc.length - 1;
  const hasNewerReviewMonth = reviewTargetIndex > 0;
  const investmentCategoryId = categories.find((c) => c.kind === "expense" && categoryNature(c) === "investment")?.id ?? null;
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
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-2 font-mono text-xs">
        <Link href="/" className="neon-text-pink underline shrink-0">
          ← ホーム
        </Link>
        <span className="min-w-0 flex-1 truncate text-right text-muted-foreground">
          🌙 Lv.{rank.level} 総資産 <span className="gold-text font-bold">{formatYen(totalAssets)}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setReloading(true);
            window.location.reload();
          }}
          aria-label="ページを再読み込み"
          className="shrink-0 rounded-full border border-white/15 p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${reloading ? "animate-spin" : ""}`} />
        </button>
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
            ) : reDiagnosing || pendingReDiagnosis ? (
              pendingReDiagnosis ? (
                <ReDiagnosisReflectChoice
                  onReflectThisMonth={() => handleReflectReDiagnosis(true)}
                  onReflectNextMonthOnly={() => handleReflectReDiagnosis(false)}
                />
              ) : (
                <HouseholdSetup
                  mode="edit"
                  initialProfile={householdProfile}
                  initialSpecialExpenses={specialExpenses}
                  initialSpecialExpenseMode={specialExpenseMode}
                  currentCashBalanceYen={cashCategory.currentValueYen}
                  onComplete={handleFinishReDiagnosisWizard}
                  onCancel={() => setReDiagnosing(false)}
                />
              )
            ) : !currentMonthlyBudget || editingBudget ? (
              <BudgetPlanAdopt
                variant={editingBudget ? "edit" : monthlyBudgets.length === 0 ? "initial" : "rollover"}
                diagnosisRecommendation={recommendedMonthlyBudget}
                previousBudget={editingBudget ? currentMonthlyBudget : previousMonthlyBudget}
                onAdopt={handleAdoptMonthlyBudget}
              />
            ) : (
              <div className="space-y-6">
                {pendingSpecialExpenseCandidate && (
                  <SpecialExpensePrompt
                    transaction={pendingSpecialExpenseCandidate}
                    categoryLabel={
                      categories.find((c) => c.id === pendingSpecialExpenseCandidate.categoryId)?.label ?? "支出"
                    }
                    onResolve={(decision, recurrence) =>
                      handleResolveSpecialExpensePrompt(pendingSpecialExpenseCandidate, decision, recurrence)
                    }
                  />
                )}
                <HouseholdDashboard
                  summary={buildHouseholdDashboardSummary(currentMonthlyBudget, transactions, categories)}
                  categories={categories}
                  transactions={transactions}
                  month={nowMonth}
                  monthlyHistoryEntries={monthlyHistory(transactions, categories, monthlyReviews).filter((e) => e.month !== nowMonth)}
                  selectedReviewMonth={reviewTargetMonth}
                  onSelectReviewMonth={(m) => setSelectedReviewMonth(m)}
                  budgetSuggestions={suggestBudgetAdjustments(transactions, categories, completedMonths(transactions, categories))}
                  specialReserveSuggestion={
                    hasAnnualSpecialCandidate ? { estimatedMonthlyReserve: estimatedMonthlySpecial, annualTotal: estimatedAnnualSpecial } : null
                  }
                  goalType={householdProfile?.goal?.type ?? null}
                  goalFundingPlan={goalFundingPlan}
                  onEditBudget={() => setEditingBudget(true)}
                  onGoToDiagnosis={() => setShowDiagnosisDetail((v) => !v)}
                  onAdoptBudgetSuggestion={handleSetCategoryBudget}
                  onAdoptSpecialReserve={handleAdoptSpecialReserve}
                />
                {reviewTargetMonth && (
                  <MonthlyReviewCard
                    month={reviewTargetMonth}
                    actualIncome={actualIncome(transactions, categories, reviewTargetMonth)}
                    actualFixedExpenses={actualFixedExpenses(transactions, categories, reviewTargetMonth)}
                    actualVariableExpenses={actualVariableExpenses(transactions, categories, reviewTargetMonth)}
                    actualSpecialExpenses={actualSpecialExpenses(transactions, categories, reviewTargetMonth)}
                    actualMonthlyInvestment={actualMonthlyInvestment(transactions, categories, reviewTargetMonth)}
                    monthlySurplus={monthlySurplus(transactions, categories, reviewTargetMonth)}
                    plannedCashSavings={reviewTargetBudget?.plannedCashSavings ?? 0}
                    plannedInvestment={reviewTargetBudget?.plannedInvestment ?? 0}
                    previousMonthSurplus={previousReviewMonth ? monthlySurplus(transactions, categories, previousReviewMonth) : null}
                    review={getMonthlyReview(monthlyReviews, reviewTargetMonth)}
                    onSaveAllocation={(cash, special) => handleSaveMonthlyReviewAllocation(reviewTargetMonth, cash, special)}
                    isLatest={isLatestReviewMonth}
                    hasOlder={hasOlderReviewMonth}
                    hasNewer={hasNewerReviewMonth}
                    onNavigate={handleNavigateReviewMonth}
                    onJumpToLatest={() => setSelectedReviewMonth(null)}
                    onRequestInvestmentEntry={handleRequestInvestmentEntry}
                    hasInvestmentCategory={investmentCategoryId !== null}
                  />
                )}
                {showDiagnosisDetail && (
                  <div className="space-y-2 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowDiagnosisDetail(false)}
                        className="font-mono text-xs text-muted-foreground underline"
                      >
                        閉じる ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => setReDiagnosing(true)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
                      >
                        診断を見直す
                      </button>
                    </div>
                    <DiagnosisResult
                      profile={householdProfile}
                      specialExpenses={specialExpenses}
                      specialExpenseMode={specialExpenseMode}
                      transactionMonthCount={transactionMonthCount}
                      goalFundingPlan={goalFundingPlan}
                      onSaveGoalBonusAllocation={handleSaveGoalBonusAllocation}
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
                    investmentEntryRequestId={investmentEntryRequestId}
                    investmentCategoryId={investmentCategoryId}
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
