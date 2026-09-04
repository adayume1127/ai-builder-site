"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { ActualReturnForm } from "./ActualReturnForm";
import {
  actualAnnualRate,
  effectiveCurrentAssetsMan,
  formatMan,
  formatYearsMonths,
  levelForProgress,
  paceStatus,
  progressRatio,
  projectedFutureValue,
  requiredMonthlyPayment,
  type Goal,
} from "@/lib/investmentTracker";

const PACE_LABEL: Record<string, { text: string; className: string }> = {
  ahead: { text: "順調(前倒しペース)", className: "neon-text" },
  onTrack: { text: "順調(予定ペース)", className: "neon-text" },
  behind: { text: "要ペースアップ", className: "neon-text-pink" },
  unknown: { text: "-", className: "text-muted-foreground" },
};

export function GoalCard({
  goal,
  goalCount,
  portfolioAssetsMan = null,
  onUpdate,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  // 目標の総数。資産タブの総資産(portfolioAssetsMan)を現在資産として使ってよいのは
  // 目標が1件だけのときに限る(複数目標での重複計上を防ぐため)。
  goalCount: number;
  portfolioAssetsMan?: number | null;
  onUpdate: (goal: Goal) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showActualForm, setShowActualForm] = useState(false);

  const usesPortfolioTotal = goalCount === 1 && portfolioAssetsMan !== null;
  const currentAssets = effectiveCurrentAssetsMan(goal, goalCount, portfolioAssetsMan);
  const ratio = progressRatio(goal, currentAssets);
  const level = levelForProgress(ratio);
  // ratio(現在の資産ベースの到達度)が既に100%なら、投資元本+貯金だけを見て
  // 計算するrequiredMonthlyPayment側は古い基準のまま「まだ毎月〇円必要」と出ることがあり、
  // 上の進捗バー(達成表示)と矛盾して見える。達成済みならこのカード自体を出さない。
  const achieved = ratio >= 1;
  const required = achieved ? null : requiredMonthlyPayment(goal);
  const projected = projectedFutureValue(goal);
  const pace = paceStatus(goal);
  const rate = actualAnnualRate(goal.actual);
  const paceInfo = PACE_LABEL[pace];

  return (
    <Card className="neon-border bg-card/60 backdrop-blur">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.emoji}</span>
          <span className="font-mono text-base font-bold">{goal.name}</span>
        </div>
        <Badge variant="outline" className="gold-border gold-text font-mono gap-1">
          <img
            src="/tools/investment-tracker/badge-star.png"
            alt=""
            className="h-3.5 w-3.5 object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          Lv.{level.level} {level.title}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar ratio={ratio} />

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">目標額</span>
            <span>{formatMan(goal.goalMan)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">現在の資産</span>
              <span>{formatMan(currentAssets)}</span>
            </div>
            {usesPortfolioTotal ? (
              <span className="text-right text-[9px] text-muted-foreground">資産タブの記録より</span>
            ) : (
              portfolioAssetsMan !== null && (
                <span className="text-right text-[9px] text-muted-foreground">
                  この目標の入力値(他にも目標があるため、資産タブの総資産は使いません)
                </span>
              )
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">目標年数</span>
            <span>{goal.years}年後</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">想定年利</span>
            <span>{goal.assumedRate}%</span>
          </div>
        </div>

        {required && (
          <div className="space-y-1 border-t border-white/10 pt-3">
            {required.alreadyAchievable ? (
              <p className="text-xs neon-text">
                現在の資産だけで目標額に到達できそうです🎉
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between font-mono text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <img
                      src="/tools/investment-tracker/coin-stack.png"
                      alt=""
                      className="h-4 w-4 object-contain"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    達成に必要な毎月積立額
                  </span>
                  <span className="neon-text-pink font-bold">
                    {formatMan(required.monthlyPaymentMan, 1)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-sm">
                  <span className="text-muted-foreground text-xs">
                    実際の積立額({formatMan(goal.monthlyContributionMan, 1)})のペース
                  </span>
                  <span className={`font-bold ${paceInfo.className}`}>{paceInfo.text}</span>
                </div>
                {projected && (
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-muted-foreground text-xs">
                      このペースで{formatYearsMonths(projected.months)}後
                    </span>
                    <span>{formatMan(projected.totalFutureValueMan)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <img
                src="/tools/investment-tracker/shield.png"
                alt=""
                className="h-4 w-4 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              実績年利
            </span>
            {rate !== null ? (
              <span className={rate >= 0 ? "neon-text font-mono font-bold" : "text-destructive font-mono font-bold"}>
                年利 {rate.toFixed(1)}%
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">未記録</span>
            )}
          </div>

          {showActualForm ? (
            <ActualReturnForm
              initial={goal.actual}
              onCancel={() => setShowActualForm(false)}
              onSave={(actual) => {
                onUpdate({ ...goal, actual });
                setShowActualForm(false);
              }}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowActualForm(true)}
            >
              {rate !== null ? "実績を更新する" : "実績を記録する"}
            </Button>
          )}
        </div>

        <div className="flex gap-2 border-t border-white/10 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onEdit} className="flex-1">
            編集
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onDelete} className="flex-1">
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
