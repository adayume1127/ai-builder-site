"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  FIRE_GOAL_TYPE,
  fixedExpenseRate,
  goalDeadlineFallback,
  householdScore,
  housingRate,
  monthlySpecialExpenseReserve,
  recommendationMode,
  savingsRate,
  surplus,
  totalIncome,
  variableExpenseRate,
  type GoalFundingPlan,
  type HouseholdProfile,
  type SavingsPlanTier,
  type SpecialExpense,
  type SpecialExpenseMode,
} from "@/lib/householdDiagnosis";

const TIER_INFO: { tier: SavingsPlanTier; emoji: string; label: string }[] = [
  { tier: "safe", emoji: "🌱", label: "ゆとり重視" },
  { tier: "standard", emoji: "⭐", label: "ルナのおすすめ" },
  { tier: "challenge", emoji: "🔥", label: "しっかり貯める" },
];

export function DiagnosisResult({
  profile,
  specialExpenses,
  specialExpenseMode,
  transactionMonthCount,
  goalFundingPlan,
  onSaveGoalBonusAllocation,
  selectedTier,
  onSelectTier,
  onProceed,
  proceedLabel,
}: {
  profile: HouseholdProfile;
  specialExpenses: SpecialExpense[];
  specialExpenseMode: SpecialExpenseMode;
  transactionMonthCount: number;
  // page.tsx側で一度だけ計算した結果を受け取る(このコンポーネント内で再計算しない)。
  goalFundingPlan: GoalFundingPlan | null;
  onSaveGoalBonusAllocation: (amount: number) => void;
  // 以下4つはCycle3(診断結果からのプラン選択)用のオプトイン機能。指定しなければ従来通り
  // 「安全/標準/チャレンジ」は静的な比較表示のまま、末尾のCTAボタンも出ない
  // (「困ったらここ」経由の既存呼び出しはこれらを渡さないため、表示は変わらない)。
  selectedTier?: SavingsPlanTier;
  onSelectTier?: (tier: SavingsPlanTier) => void;
  onProceed?: () => void;
  proceedLabel?: string;
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

  // スライダーの下書き値。goal.bonusAllocatedへは「確定する」ボタンを押すまで保存しない
  // (おすすめ値と、ユーザーが決めた値を混同しないため)。
  // DiagnosisResultは画面を開いている間ずっとマウントされたままになりうる(例: 特別費プロンプトの
  // 解決などでrecommendedMonthlyBudget/goalFundingPlanが再計算される)。useStateの初期値は
  // マウント時にしか使われないため、確定済み値(goal.bonusAllocated)や上限(bonusInWindowTotal/
  // goalRemaining)が外部要因で変わったときだけ、useEffectでdraftを再同期する
  // (ユーザーがスライダーを操作中の値を毎render上書きしないよう、依存配列を絞る)。
  const [bonusAllocatedDraft, setBonusAllocatedDraft] = useState(goalFundingPlan?.bonusAllocated ?? 0);
  useEffect(() => {
    setBonusAllocatedDraft(goalFundingPlan?.bonusAllocated ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.goal?.bonusAllocated, goalFundingPlan?.bonusInWindowTotal, goalFundingPlan?.goalRemaining]);

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
          <div>
            <h3 className="font-mono text-sm text-muted-foreground">通常月のおすすめ貯金額</h3>
            <p className="text-[10px] text-muted-foreground">家計から見て無理のない月額です(目標から逆算した必要額とは別です)</p>
          </div>
          {onSelectTier ? (
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              {TIER_INFO.map(({ tier, emoji, label }) => {
                const amount = tier === "safe" ? plans.safeSavings : tier === "standard" ? plans.standardSavings : plans.challengeSavings;
                const selected = selectedTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onSelectTier(tier)}
                    className={`rounded-lg p-2 ${selected ? "gold-border bg-white/5" : "border border-white/15 bg-white/5"}`}
                  >
                    <p className={`text-[10px] ${selected ? "gold-text" : "text-muted-foreground"}`}>
                      {emoji} {label}
                    </p>
                    <p className={`text-sm font-bold ${selected ? "gold-text" : ""}`}>{formatYen(amount)}</p>
                  </button>
                );
              })}
            </div>
          ) : (
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
          )}
        </div>
      )}

      {profile.goal && goalFundingPlan && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono text-sm">
          <p className="text-xs text-muted-foreground">目標達成プラン: {profile.goal.type}</p>

          {goalFundingPlan.goalRemaining <= 0 ? (
            <p className="neon-text text-xs">すでに目標を達成しています🎉</p>
          ) : goalFundingPlan.feasibility === "on_track_without_bonus" ? (
            <p className="text-xs text-muted-foreground">
              通常月の貯金額(目安)だけで、期限内に達成できる見込みです。ボーナスを使う必要はありません。
            </p>
          ) : goalFundingPlan.feasibility === "achievable_with_bonus" ? (
            <p className="text-xs text-muted-foreground">
              毎月{formatYen(goalFundingPlan.recommendedMonthlyCashSavings)}を{goalFundingPlan.remainingMonths}か月続けると
              {formatYen(goalFundingPlan.monthlyContributionTotal)}。残り
              {formatYen(Math.max(goalFundingPlan.goalRemaining - goalFundingPlan.monthlyContributionTotal, 0))}
              を期限内のボーナスから確保する計画にすると、達成しやすくなります。
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              毎月の積立予定とボーナス予定を合わせても、期限までに
              {formatYen(
                Math.max(goalFundingPlan.goalRemaining - goalFundingPlan.monthlyContributionTotal - goalFundingPlan.bonusInWindowTotal, 0)
              )}
              ほど不足する見込みです。毎月の貯金額を増やす、目標額を見直す、期限を延ばす、のいずれかをおすすめします。
            </p>
          )}

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <DetailRow label="目標額" value={formatYen(profile.goal.targetAmount ?? 0)} />
            <DetailRow
              label={profile.goal.type === FIRE_GOAL_TYPE ? "現在の資産額" : "既に確保済み"}
              value={
                profile.goal.type === FIRE_GOAL_TYPE && !goalFundingPlan.hasAssetData
                  ? "まだ記録なし"
                  : formatYen(goalFundingPlan.progressAmount)
              }
            />
            <DetailRow label="残り必要額" value={formatYen(goalFundingPlan.goalRemaining)} />
            <DetailRow label="期限まで" value={`${goalFundingPlan.remainingMonths}ヶ月`} />
          </div>

          {goalFundingPlan.bonusInWindowTotal > 0 ? (
            <div className="space-y-1.5 border-t border-white/10 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">この目標にボーナスを使う</span>
                <span className="gold-text font-bold">{formatYen(bonusAllocatedDraft)}</span>
              </div>
              <input
                type="range"
                min={0}
                // computeGoalFundingPlan()側のクランプ(bonusInWindowTotal・goalRemainingの両方が上限)と
                // スライダーのUI上限を一致させる。ここがbonusInWindowTotalだけだと、goalRemainingの方が
                // 小さいケースで「UI上は選べるが確定すると値が切り詰められる」ズレが起きる。
                max={Math.min(goalFundingPlan.bonusInWindowTotal, goalFundingPlan.goalRemaining)}
                value={bonusAllocatedDraft}
                onChange={(e) => setBonusAllocatedDraft(Number(e.target.value))}
                className="w-full"
                aria-label="ボーナスからこの目標に充てる金額"
              />
              <p className="text-[10px] text-muted-foreground">
                期限内に見込まれるボーナス: {formatYen(goalFundingPlan.bonusInWindowTotal)}
              </p>
              <button
                type="button"
                onClick={() => onSaveGoalBonusAllocation(bonusAllocatedDraft)}
                className="w-full rounded-lg gold-border gold-text px-3 py-1.5 text-[11px]"
              >
                この金額で確定する
              </button>
              {(() => {
                const gapAtDraft = Math.max(
                  goalFundingPlan.goalRemaining - goalFundingPlan.monthlyContributionTotal - bonusAllocatedDraft,
                  0
                );
                return gapAtDraft > 0 ? (
                  <p className="text-[11px] text-destructive">現在の計画では、あと{formatYen(gapAtDraft)}不足しています。</p>
                ) : null;
              })()}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground border-t border-white/10 pt-2">
              {profile.income.bonusPayments.length === 0
                ? "ボーナスの支給予定月を入力すると、目標達成プランに活用できます。"
                : "期限内に支給予定のボーナスがないため、目標達成プランには反映していません。"}
            </p>
          )}
        </div>
      )}

      {/* goalFundingPlanがnull(期限未設定/今月/過去/不正な日付)でも、目標そのものは存在するため
          セクション自体を消さない。「設定が消えた」ように見せず、状況をそのまま伝える(GPTとの
          PDCA相談: goalFundingPlan===nullを「未設定」と決め打たない)。 */}
      {profile.goal && !goalFundingPlan && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono text-sm">
          <p className="text-xs text-muted-foreground">目標達成プラン: {profile.goal.type}</p>
          <p className="text-xs text-muted-foreground">{goalDeadlineFallback(profile.goal.targetDate).message}</p>
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

      {onProceed && (
        <Button type="button" className="w-full" onClick={onProceed}>
          {proceedLabel}
        </Button>
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
