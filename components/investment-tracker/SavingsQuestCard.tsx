"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { levelForProgress } from "@/lib/investmentTracker";
import { goalFeasibilityMessage, type GoalFundingPlan, type HouseholdProfile } from "@/lib/householdDiagnosis";
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
  onUpdateEarmarked,
  onGoToBudgetTab,
}: {
  goal: NonNullable<HouseholdProfile["goal"]>;
  goalFundingPlan: GoalFundingPlan | null;
  onUpdateEarmarked: (amountYen: number) => void;
  onGoToBudgetTab: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amountInput, setAmountInput] = useState(String(goal.alreadyEarmarkedAmount ?? 0));

  const targetAmount = goal.targetAmount ?? 0;
  const earmarked = goal.alreadyEarmarkedAmount ?? 0;
  const ratio = targetAmount > 0 ? Math.min(1, Math.max(0, earmarked / targetAmount)) : 0;
  const level = levelForProgress(ratio);
  const remaining = goalFundingPlan?.goalRemaining ?? Math.max(targetAmount - earmarked, 0);
  const achieved = targetAmount > 0 && earmarked >= targetAmount;

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
            <span className="text-muted-foreground text-xs">確保済み</span>
            <span>{formatYen(earmarked)}</span>
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">残り必要額</span>
            <span>{formatYen(remaining)}</span>
          </div>
        </div>

        {/* 入力後にこの説明が消えると、後から「確保済み=預金残高全体」と誤解しうるため常時表示する(GPT Cycle6)。 */}
        <p className="text-[10px] text-muted-foreground">
          「確保済み」は、この目標のために取り分けた金額です。預金残高全体とは別に計算しています。
        </p>

        {achieved ? (
          <p className="gold-text border-t border-white/10 pt-3 text-xs font-bold">
            🎉 目標額を確保できました！
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
            <p className="text-xs text-muted-foreground">
              期限を設定すると、毎月の目安を計算できます。
            </p>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onGoToBudgetTab}>
              家計簿タブで設定する
            </Button>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
}
