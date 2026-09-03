"use client";

import { Button } from "@/components/ui/button";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import { SavingsQuestCard } from "./SavingsQuestCard";
import type { Goal, NewGoalInput } from "@/lib/investmentTracker";
import type { GoalFundingPlan, HouseholdProfile } from "@/lib/householdDiagnosis";
import { formatYen } from "@/lib/portfolio";

export type FormMode = { type: "closed" } | { type: "create" } | { type: "edit"; goalId: string };

export function QuestTab({
  goals,
  totalAssetsYen,
  portfolioAssetsMan,
  formMode,
  householdGoal,
  goalFundingPlan,
  onUpdateGoalEarmarked,
  onGoToBudgetTab,
  onOpenCreate,
  onCloseForm,
  onCreate,
  onEditSave,
  onEditOpen,
  onUpdate,
  onDelete,
}: {
  goals: Goal[];
  totalAssetsYen: number;
  portfolioAssetsMan: number | null;
  formMode: FormMode;
  householdGoal: HouseholdProfile["goal"] | null | undefined;
  goalFundingPlan: GoalFundingPlan | null;
  onUpdateGoalEarmarked: (amountYen: number) => void;
  onGoToBudgetTab: () => void;
  onOpenCreate: () => void;
  onCloseForm: () => void;
  onCreate: (input: NewGoalInput) => void;
  onEditSave: (goalId: string, input: NewGoalInput) => void;
  onEditOpen: (goalId: string) => void;
  onUpdate: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">クエスト一覧</h2>
        <p className="text-sm text-muted-foreground">目標を育てて、積立クエストをクリアしよう。</p>
      </div>

      <div className="space-y-3">
        <h3 className="font-mono text-sm font-bold text-muted-foreground">🌙 貯金クエスト</h3>
        {householdGoal?.targetAmount ? (
          <SavingsQuestCard
            goal={householdGoal}
            goalFundingPlan={goalFundingPlan}
            onUpdateEarmarked={onUpdateGoalEarmarked}
            onGoToBudgetTab={onGoToBudgetTab}
          />
        ) : (
          <div className="space-y-2 rounded-xl border border-white/15 bg-white/5 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              家計簿タブの家計診断で貯金目標を設定すると、ここにクエストが出ます。
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onGoToBudgetTab}>
              家計簿タブで設定する
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-mono text-sm font-bold text-muted-foreground">⭐ 資産形成クエスト</h3>
        <p className="font-mono text-xs text-muted-foreground">
          現在の総資産(資産タブより) <span className="gold-text font-bold">{formatYen(totalAssetsYen)}</span>
        </p>

        {formMode.type === "create" && <GoalForm onSave={onCreate} onCancel={onCloseForm} />}

        {goals.length === 0 && formMode.type === "closed" && (
          <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-muted-foreground">
            まだクエストがありません。「＋新しい目標を追加」から最初の目標を作ってみましょう。
          </p>
        )}

        {goals.map((goal) =>
          formMode.type === "edit" && formMode.goalId === goal.id ? (
            <GoalForm
              key={goal.id}
              initial={goal}
              onSave={(input) => onEditSave(goal.id, input)}
              onCancel={onCloseForm}
            />
          ) : (
            <GoalCard
              key={goal.id}
              goal={goal}
              portfolioAssetsMan={portfolioAssetsMan}
              onUpdate={onUpdate}
              onEdit={() => onEditOpen(goal.id)}
              onDelete={() => onDelete(goal.id)}
            />
          )
        )}

        {formMode.type === "closed" && (
          <Button type="button" className="w-full gap-2" onClick={onOpenCreate}>
            <img
              src="/tools/investment-tracker/chest.png"
              alt=""
              className="h-5 w-5 object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            新しい目標を追加
          </Button>
        )}
      </div>
    </div>
  );
}
