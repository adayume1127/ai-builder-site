"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LunaCoach } from "./LunaCoach";
import { PortfolioPieChart } from "./PortfolioPieChart";
import {
  formatMan,
  levelForProgress,
  paceStatus,
  playerRank,
  progressRatio,
  totalAssetsMan,
  unlockedAchievements,
  ACHIEVEMENTS,
  type Goal,
} from "@/lib/investmentTracker";
import { emptyBreakdown, latestSnapshot, snapshotTotals, type PortfolioSnapshot } from "@/lib/portfolio";

export function HomeTab({
  goals,
  snapshots,
  onGoToQuest,
  onGoToAchievements,
  onGoToAssets,
}: {
  goals: Goal[];
  snapshots: PortfolioSnapshot[];
  onGoToQuest: () => void;
  onGoToAchievements: () => void;
  onGoToAssets: () => void;
}) {
  const [avatarOk, setAvatarOk] = useState(true);
  const rank = playerRank(goals);
  const totalAssets = totalAssetsMan(goals);
  const unlockedCount = unlockedAchievements(goals).length;

  const latest = latestSnapshot(snapshots);
  const portfolioBreakdown = latest?.categories ?? emptyBreakdown();
  const portfolioTotal = latest ? snapshotTotals(latest).totalYen : 0;

  const coach = (() => {
    if (goals.length === 0) {
      return {
        variant: "watch" as const,
        message: "まだ目標がないみたい。老後資金でも旅行資金でもOK、まずは1つ作ってみよう🌙",
      };
    }
    const achievedGoal = goals.find((g) => progressRatio(g) >= 1);
    if (achievedGoal) {
      return {
        variant: "celebrate" as const,
        message: `やったね！「${achievedGoal.name}」が目標達成🎉 他の目標も一緒に育てていこう！`,
      };
    }
    const behindGoal = goals.find((g) => paceStatus(g) === "behind");
    if (behindGoal) {
      return {
        variant: "cheer" as const,
        message: `「${behindGoal.name}」は今のペースだと少し届かないかも。積立額を見直してみる？私が応援してるよ！`,
      };
    }
    return {
      variant: "watch" as const,
      message: "どの目標もいいペースで育ってるよ。この調子でコツコツいこう！",
    };
  })();

  return (
    <div className="space-y-6">
      <div className="gold-border relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] p-4">
        <div className="flex items-center gap-4">
          {avatarOk && (
            <img
              src="/luna-avatar.png"
              alt="ルナ"
              className="h-16 w-16 shrink-0 rounded-full object-cover luna-glow-pulse"
              onError={() => setAvatarOk(false)}
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="gold-border gold-text rounded-full px-2 py-0.5 font-bold">
                Lv.{rank.level}
              </span>
              <span className="truncate text-muted-foreground">{rank.title}</span>
            </div>
            <div className="font-mono text-2xl font-bold">
              <span className="text-muted-foreground text-sm mr-1">総資産</span>
              <span className="gold-text">{formatMan(totalAssets)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>クエスト {goals.length}件</span>
          <button
            type="button"
            onClick={onGoToAchievements}
            className="neon-text-pink underline underline-offset-2"
          >
            実績 {unlockedCount}/{ACHIEVEMENTS.length} 解放中 →
          </button>
        </div>
      </div>

      <LunaCoach variant={coach.variant} message={coach.message} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm text-muted-foreground">資産ポートフォリオ</h2>
          <button
            type="button"
            onClick={onGoToAssets}
            className="neon-text-pink font-mono text-xs underline underline-offset-2"
          >
            {latest ? "記録・詳細を見る →" : "内訳を記録する →"}
          </button>
        </div>
        <button
          type="button"
          onClick={onGoToAssets}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
        >
          <PortfolioPieChart breakdown={portfolioBreakdown} totalYen={portfolioTotal} />
        </button>
      </div>

      {goals.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-mono text-sm text-muted-foreground">クエスト進捗</h2>
          {goals.map((goal) => {
            const ratio = progressRatio(goal);
            const level = levelForProgress(ratio);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={onGoToQuest}
                className="flex w-full items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/10"
              >
                <span className="text-xl">{goal.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm font-bold">{goal.name}</span>
                  <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <span
                      className={`block h-full rounded-full ${
                        ratio >= 1
                          ? "bg-gradient-to-r from-[#FFD700] to-[#fff7cc]"
                          : "bg-gradient-to-r from-[oklch(0.85_0.22_195)] to-[oklch(0.85_0.22_330)]"
                      }`}
                      style={{ width: `${Math.max(Math.round(ratio * 100), ratio > 0 ? 4 : 0)}%` }}
                    />
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  Lv.{level.level}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Button type="button" className="w-full" onClick={onGoToQuest}>
        {goals.length === 0 ? "最初の目標を作る" : "クエスト一覧を見る"}
      </Button>
    </div>
  );
}
