"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { levelForProgress } from "@/lib/investmentTracker";
import {
  FIRE_GOAL_TYPE,
  goalDeadlineFallback,
  goalFeasibilityMessage,
  type GoalFundingPlan,
  type HouseholdProfile,
} from "@/lib/householdDiagnosis";
import { formatYen } from "@/lib/portfolio";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

// goal.type(GoalStepの選択肢)をクエストのタイトルにそのまま出すと、「特に決まっていない」だけが
// 未設定項目のように見えてしまう。保存値(goal.type)は書き換えず、表示だけ変換する。
function questTitle(type: string): string {
  return type === "特に決まっていない" ? "貯金目標" : type;
}

// HouseholdProfile.goalを唯一の真実源として、それを「クエスト」として見せるだけの投影カード。
// 新しいデータストレージは持たない(目標額・期限・確保済み額はすべてgoal/goalFundingPlanから来る)。
export function SavingsQuestCard({
  goal,
  goalFundingPlan,
  totalAssetsYen,
  onUpdateEarmarked,
  onEditGoalDeadline,
}: {
  goal: NonNullable<HouseholdProfile["goal"]>;
  goalFundingPlan: GoalFundingPlan | null;
  // 資産タブの実際の総資産額(円)。FIRE/資産形成タイプの進捗表示に使う(goalFundingPlanが
  // 期限未設定でnullのときのフォールバックとしても使う。lib/householdDiagnosis.ts参照)。
  totalAssetsYen: number;
  onUpdateEarmarked: (amountYen: number) => void;
  // goalFundingPlanがnull(期限未設定/今月/過去/不正な日付)のときのCTA。単に家計簿タブへ
  // 切り替えるだけでなく、再診断ウィザードを目標編集ステップ(STEP5)から開始する
  // (GPTとのPDCA相談: 「期限を見直す」という具体的なCTAである以上、実際に編集箇所まで
  // 誘導する)。
  onEditGoalDeadline: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amountInput, setAmountInput] = useState(String(goal.alreadyEarmarkedAmount ?? 0));

  const isFireGoal = goal.type === FIRE_GOAL_TYPE;
  const targetAmount = goal.targetAmount ?? 0;
  const earmarked = goal.alreadyEarmarkedAmount ?? 0;
  // goalFundingPlanが計算済みならそこから(単一の真実源)、未計算(期限未設定)なら同じ規則で
  // ここでも算出する: FIRE型は資産タブの総資産、それ以外は確保済み額。
  const progressAmount = goalFundingPlan?.progressAmount ?? (isFireGoal ? Math.max(totalAssetsYen, 0) : earmarked);
  const ratio =
    goalFundingPlan?.progressRatio ?? (targetAmount > 0 ? Math.min(1, Math.max(0, progressAmount / targetAmount)) : 0);
  const level = levelForProgress(ratio);
  const remaining = goalFundingPlan?.goalRemaining ?? Math.max(targetAmount - progressAmount, 0);
  const achieved = targetAmount > 0 && progressAmount >= targetAmount;
  // FIREタイプで資産タブにまだ何も記録がない場合、「0円」と断定表示せず「未記録」だと分かるようにする。
  const noAssetDataYet = isFireGoal && goalFundingPlan !== null && !goalFundingPlan.hasAssetData;
  const fallback = goalDeadlineFallback(goal.targetDate);

  return (
    <Card className="neon-border bg-card/60 backdrop-blur">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <span className="font-mono text-base font-bold">{questTitle(goal.type)}</span>
        </div>
        <Badge variant="outline" className="gold-border gold-text font-mono gap-1">
          Lv.{level.level} {level.title}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar ratio={ratio} />

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">目標額</span>
            <span>{formatYen(targetAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">{isFireGoal ? "現在の資産額" : "確保済み"}</span>
            <span>{noAssetDataYet ? "まだ記録なし" : formatYen(progressAmount)}</span>
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">残り必要額</span>
            <span>{formatYen(remaining)}</span>
          </div>
        </div>

        {/* 入力後にこの説明が消えると、後から「確保済み=預金残高全体」と誤解しうるため常時表示する(GPT Cycle6)。
            FIREタイプは資産タブの総資産をそのまま使うため、説明の内容自体を分ける(GPTとのPDCA相談)。 */}
        <p className="text-[10px] text-muted-foreground">
          {isFireGoal
            ? noAssetDataYet
              ? "資産タブでまだ資産が記録されていません。記録すると、この目標の進捗に自動で反映されます。"
              : "資産タブの現在の総資産額を、そのままこの目標の進捗として自動反映しています。"
            : "「確保済み」は、この目標のために取り分けた金額です。預金残高全体とは別に計算しています。"}
        </p>

        {achieved ? (
          <p className="gold-text border-t border-white/10 pt-3 text-xs font-bold">
            {isFireGoal ? "🎉 目標額に到達しました！" : "🎉 目標額を確保できました！"}
          </p>
        ) : goalFundingPlan ? (
          <div className="space-y-1 border-t border-white/10 pt-3 font-mono text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">期限まで</span>
              <span>{goalFundingPlan.remainingMonths}ヶ月</span>
            </div>
            <p className="text-xs text-muted-foreground">{goalFeasibilityMessage(goalFundingPlan.feasibility)}</p>
          </div>
        ) : (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-xs text-muted-foreground">{fallback.message}</p>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onEditGoalDeadline}>
              {fallback.cta}
            </Button>
          </div>
        )}

        {/* FIREタイプは資産タブの値を自動で使うため、手動入力の余地(確保済み額の更新)自体を出さない。
            入力しても計算に使われない操作を見せると、かえって「何を入力すればいいのか」を迷わせるため(GPTとのPDCA相談)。 */}
        {!isFireGoal && (
        <div className="space-y-2 border-t border-white/10 pt-3">
          {editing ? (
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                step={1}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className={inputClass}
              />
              <Button
                type="button"
                size="sm"
                disabled={!(Number.isInteger(Number(amountInput)) && Number(amountInput) >= 0)}
                onClick={() => {
                  onUpdateEarmarked(Number(amountInput));
                  setEditing(false);
                }}
              >
                確定
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                やめる
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // useStateの初期値はmount時にしか評価されないため、開くたびに最新の確保済み額を
                // セットし直す(TodayActionCardの「金額を変更」と同じパターン)。
                setAmountInput(String(goal.alreadyEarmarkedAmount ?? 0));
                setEditing(true);
              }}
            >
              確保済み額を更新する
            </Button>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
