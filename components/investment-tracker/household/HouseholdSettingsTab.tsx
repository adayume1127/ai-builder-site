"use client";

import { formatYen } from "@/lib/portfolio";
import type { GoalFundingPlan, HouseholdProfile, SpecialExpense, SpecialExpenseMode } from "@/lib/householdDiagnosis";
import { DiagnosisResult } from "./DiagnosisResult";

// 「設定」タブ。家計診断の詳細・診断の見直し・目標達成プランの参照をここに集約する
// (以前は「家計診断を見る」ボタン+ページ直下の折りたたみだったものを、常設のタブへ)。
export function HouseholdSettingsTab({
  profile,
  specialExpenses,
  specialExpenseMode,
  transactionMonthCount,
  goalType,
  goalFundingPlan,
  onSaveGoalBonusAllocation,
  onEditGoalDeadline,
  onStartReDiagnosis,
}: {
  profile: HouseholdProfile;
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
      {goalFundingPlan && goalFundingPlan.goalRemaining > 0 && (
        <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono text-xs">
          <p className="text-muted-foreground">🎯 目標「{goalType}」まであと{formatYen(goalFundingPlan.goalRemaining)}</p>
          <p className="text-[11px] text-muted-foreground">
            月{formatYen(goalFundingPlan.recommendedMonthlyCashSavings)}
            {goalFundingPlan.bonusAllocated > 0 && ` + 期限内ボーナス${formatYen(goalFundingPlan.bonusAllocated)}`}
            の計画です(「今月あと使えるお金」には含みません)。
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-muted-foreground">家計診断</h3>
        <button
          type="button"
          onClick={onStartReDiagnosis}
          className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
        >
          診断を見直す
        </button>
      </div>
      <DiagnosisResult
        profile={profile}
        specialExpenses={specialExpenses}
        specialExpenseMode={specialExpenseMode}
        transactionMonthCount={transactionMonthCount}
        goalFundingPlan={goalFundingPlan}
        onSaveGoalBonusAllocation={onSaveGoalBonusAllocation}
        onEditGoalDeadline={onEditGoalDeadline}
      />
    </div>
  );
}
