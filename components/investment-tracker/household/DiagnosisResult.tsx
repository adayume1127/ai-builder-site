"use client";

import { useState } from "react";
import { LunaCoach } from "../LunaCoach";
import { formatYen } from "@/lib/portfolio";
import {
  availableForSavings,
  computeSavingsPlans,
  diagnosisConfidence,
  discretionaryFloor,
  emergencyFundMonthsCovered,
  emergencyFundTarget,
  essentialMonthlyExpenses,
  fixedExpenseRate,
  goalRequiredMonthlySavings,
  householdScore,
  housingRate,
  monthlySpecialExpenseReserve,
  recommendationMode,
  resolveGoalVsCapacity,
  savingsRate,
  surplus,
  totalIncome,
  variableExpenseRate,
  type HouseholdProfile,
  type SpecialExpense,
  type SpecialExpenseMode,
} from "@/lib/householdDiagnosis";

export function DiagnosisResult({
  profile,
  specialExpenses,
  specialExpenseMode,
  transactionMonthCount,
}: {
  profile: HouseholdProfile;
  specialExpenses: SpecialExpense[];
  specialExpenseMode: SpecialExpenseMode;
  transactionMonthCount: number;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const income = totalIncome(profile);
  const specialReserve = monthlySpecialExpenseReserve(profile, specialExpenses, specialExpenseMode);
  const available = availableForSavings(profile, specialReserve);
  const mode = recommendationMode(available);
  const plans = computeSavingsPlans(available, profile.confidence.livingExpenses);
  const essential = essentialMonthlyExpenses(profile);
  const efTarget = emergencyFundTarget(essential, profile.emergencyFundMonths);
  const efCovered = emergencyFundMonthsCovered(profile.savings.cashSavingsBalance, essential);
  const score = householdScore(profile, efCovered, available, plans.standardSavings);
  const confidence = diagnosisConfidence(profile, transactionMonthCount);
  const floor = discretionaryFloor(income);
  const freeToUse = floor + Math.max(available - plans.standardSavings, 0);

  const goalRequired = profile.goal?.targetAmount
    ? goalRequiredMonthlySavings(profile.goal.targetAmount, profile.savings.cashSavingsBalance, profile.goal.targetDate)
    : null;
  const goalComparison = profile.goal?.targetAmount
    ? resolveGoalVsCapacity(goalRequired, plans.standardSavings, profile.goal.targetAmount, profile.savings.cashSavingsBalance)
    : null;

  const lunaMessage = (() => {
    if (mode === "cashflow_recovery") {
      return "今は貯金を増やすより、まず毎月の収支を整える段階だよ。固定費や自由に使えるお金から、見直せそうなところを探してみよう。";
    }
    if (fixedExpenseRate(profile) > 0.5) {
      return "固定費がやや大きめ。見直せる項目があるか確認してみよう。";
    }
    if (efCovered !== null && efCovered < 1) {
      return "まずは生活防衛資金を少しずつ準備していこう。焦らなくて大丈夫だよ。";
    }
    if (score.total >= 80) {
      return "とてもバランスのいい家計だよ！この調子でコツコツ続けていこう。";
    }
    return "無理のないペースで、少しずつ整えていこう。";
  })();
  const lunaVariant = mode === "cashflow_recovery" ? "watch" : score.total >= 80 ? "celebrate" : "cheer";

  return (
    <div className="space-y-4">
      <LunaCoach variant={lunaVariant} message={lunaMessage} />

      {profile.confidence.livingExpenses === "unknown" && (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center text-[11px] text-muted-foreground">
          まずはこの仮予算で始めてみよう。記録が増えると、もっとあなたに合った予算に近づいていくよ。
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="gold-border rounded-xl bg-white/5 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">家計スコア</p>
          <p className="gold-text font-mono text-2xl font-bold">
            {score.total}
            <span className="text-xs">点</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">診断精度</p>
          <p className="neon-text font-mono text-2xl font-bold">{confidence.label}</p>
          <p className="text-[10px] text-muted-foreground">{confidence.total}/100</p>
        </div>
      </div>

      {mode === "cashflow_recovery" ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-center">
          <p className="text-sm font-bold text-destructive">今は貯金額の設定より、収支を整えることが優先です</p>
          <p className="mt-1 text-xs text-muted-foreground">固定費・生活費・自由費全体から、見直せる項目を確認してみましょう。</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-mono text-sm text-muted-foreground">毎月の貯金プラン</h3>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="rounded-lg border border-white/15 bg-white/5 p-2">
              <p className="text-[10px] text-muted-foreground">安全</p>
              <p className="text-sm font-bold">{formatYen(plans.safeSavings)}</p>
            </div>
            <div className="gold-border rounded-lg bg-white/5 p-2">
              <p className="gold-text text-[10px]">標準・おすすめ</p>
              <p className="gold-text text-sm font-bold">{formatYen(plans.standardSavings)}</p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/5 p-2">
              <p className="text-[10px] text-muted-foreground">チャレンジ</p>
              <p className="text-sm font-bold">{formatYen(plans.challengeSavings)}</p>
            </div>
          </div>
        </div>
      )}

      {profile.goal && goalComparison && (
        <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono text-sm">
          <p className="text-xs text-muted-foreground">目標: {profile.goal.type}</p>
          {goalComparison.estimatedMonthsToGoal === 0 ? (
            <p className="neon-text text-xs">すでに目標を達成しています🎉</p>
          ) : goalComparison.realisticMonthlyAmount <= 0 ? (
            <p className="text-xs text-muted-foreground">
              現在の家計では、まず収支改善を優先するのがおすすめです。家計が黒字化した後に目標プランを再計算します。
            </p>
          ) : goalComparison.requiredMonthlySavings !== null && !goalComparison.isRealistic ? (
            <p className="text-xs text-muted-foreground">
              期限通りだと月{formatYen(goalComparison.requiredMonthlySavings)}必要ですが、現在の家計なら月
              {formatYen(goalComparison.realisticMonthlyAmount)}程度が現実的です。
              {goalComparison.estimatedMonthsToGoal !== null &&
                ` このペースなら約${goalComparison.estimatedMonthsToGoal}ヶ月後に達成できそうです。`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              月{formatYen(goalComparison.realisticMonthlyAmount)}のペースで、
              {goalComparison.estimatedMonthsToGoal !== null ? `約${goalComparison.estimatedMonthsToGoal}ヶ月後` : "無理のないペース"}
              に達成予定です。
            </p>
          )}
        </div>
      )}

      <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">生活防衛資金</span>
          <span>
            {formatYen(efTarget)}({profile.emergencyFundMonths}ヶ月分)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[oklch(0.85_0.22_195)] to-[oklch(0.85_0.22_330)]"
            style={{
              width: `${
                efCovered !== null ? Math.min(100, Math.round((efCovered / profile.emergencyFundMonths) * 100)) : 0
              }%`,
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {efCovered !== null ? `現在 約${efCovered.toFixed(1)}ヶ月分を確保しています` : "生活費を記録すると表示されます"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
      >
        {showDetails ? "詳細を閉じる ▲" : "詳細な数値を見る ▼"}
      </button>

      {showDetails && (
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <DetailRow label="毎月収支" value={formatYen(surplus(profile))} />
          <DetailRow label="固定費率" value={`${Math.round(fixedExpenseRate(profile) * 100)}%`} />
          <DetailRow label="住居費率" value={`${Math.round(housingRate(profile) * 100)}%`} />
          <DetailRow label="貯蓄率" value={`${Math.round(savingsRate(profile) * 100)}%`} />
          <DetailRow label="生活費率" value={`${Math.round(variableExpenseRate(profile) * 100)}%`} />
          <DetailRow label="毎月の余剰資金" value={formatYen(Math.max(available, 0))} />
          <DetailRow label="月間特別費" value={formatYen(specialReserve)} />
          <DetailRow label="最低自由費" value={formatYen(floor)} />
          <DetailRow label="今月自由に使える金額" value={formatYen(freeToUse)} />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
