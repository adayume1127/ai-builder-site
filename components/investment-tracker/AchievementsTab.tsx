"use client";

import { ACHIEVEMENTS, unlockedAchievements, type Goal } from "@/lib/investmentTracker";
import {
  MONEY_QUEST_STAGE1,
  moneyQuestCompletion,
  type BudgetCategory,
  type BudgetTransaction,
} from "@/lib/household";

export function AchievementsTab({
  goals,
  portfolioAssetsMan,
  transactions,
  categories,
  hasAdoptedBudget,
  hasInvestmentRecord,
  nowMonth,
}: {
  goals: Goal[];
  portfolioAssetsMan: number | null;
  transactions: BudgetTransaction[];
  categories: BudgetCategory[];
  // 今月、MonthlyBudgetを採用済みか(0円のプランを正しく採用した場合と未採用を区別するため)。
  hasAdoptedBudget: boolean;
  hasInvestmentRecord: boolean;
  nowMonth: string;
}) {
  const completion = moneyQuestCompletion({
    transactions,
    categories,
    hasAdoptedBudget,
    nowMonth,
    hasInvestmentRecord,
  });
  const completedCount = completion.filter(Boolean).length;
  const firstIncomplete = completion.findIndex((c) => !c);
  const currentIndex = firstIncomplete === -1 ? MONEY_QUEST_STAGE1.length : firstIncomplete;
  const stageCleared = firstIncomplete === -1;

  const unlocked = new Set(unlockedAchievements(goals, portfolioAssetsMan).map((a) => a.id));

  return (
    <div className="space-y-8">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">実績</h2>
        <p className="text-sm text-muted-foreground">やることを1つずつクリアして、貯まる家計簿を身につけよう。</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="gold-text font-mono text-sm font-bold">ステージ1: 貯金体質をつくる</h3>
          <span className="font-mono text-xs text-muted-foreground">
            {completedCount}/{MONEY_QUEST_STAGE1.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${
              stageCleared
                ? "bg-gradient-to-r from-[#FFD700] to-[#fff7cc]"
                : "bg-gradient-to-r from-[oklch(0.85_0.22_195)] to-[oklch(0.85_0.22_330)]"
            }`}
            style={{ width: `${Math.round((completedCount / MONEY_QUEST_STAGE1.length) * 100)}%` }}
          />
        </div>

        {stageCleared && (
          <p className="gold-border rounded-xl bg-white/5 px-4 py-3 text-center font-mono text-sm gold-text">
            🎉 ステージ1クリア！貯金体質が身につきました。この調子で投資も育てていきましょう。
          </p>
        )}

        <div>
          {MONEY_QUEST_STAGE1.map((step, i) => {
            const done = completion[i];
            const isCurrent = i === currentIndex;
            const isLast = i === MONEY_QUEST_STAGE1.length - 1;
            return (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      done
                        ? "gold-border gold-text bg-white/5"
                        : isCurrent
                          ? "neon-border neon-text luna-glow-pulse"
                          : "border border-white/15 text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-px flex-1 ${done ? "bg-[#FFD700]/50" : "bg-white/10"}`}
                      style={{ minHeight: 28 }}
                    />
                  )}
                </div>
                <div className={`flex-1 pb-6 ${done || isCurrent ? "" : "opacity-50"}`}>
                  <p
                    className={`font-mono text-sm font-bold ${
                      done ? "gold-text" : isCurrent ? "neon-text" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                    {isCurrent && <span className="neon-text-pink ml-2 text-[10px] font-normal">← 次はこれ!</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-6">
        <div className="space-y-1 text-center">
          <h3 className="font-mono text-sm text-muted-foreground">投資実績</h3>
          <p className="text-xs text-muted-foreground">
            {unlocked.size}/{ACHIEVEMENTS.length} 解放中
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.has(a.id);
            return (
              <div
                key={a.id}
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center ${
                  isUnlocked ? "gold-border bg-white/5" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <img
                  src="/tools/investment-tracker/badge-star.png"
                  alt=""
                  className={`h-12 w-12 object-contain ${
                    isUnlocked ? "luna-glow-pulse" : "opacity-30 grayscale"
                  }`}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span className={`font-mono text-sm font-bold ${isUnlocked ? "gold-text" : "text-muted-foreground"}`}>
                  {a.title}
                </span>
                <span className="text-xs text-muted-foreground">{a.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
