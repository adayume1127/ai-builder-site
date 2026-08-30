"use client";

import { ACHIEVEMENTS, unlockedAchievements, type Goal } from "@/lib/investmentTracker";

export function AchievementsTab({ goals }: { goals: Goal[] }) {
  const unlocked = new Set(unlockedAchievements(goals).map((a) => a.id));

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">実績</h2>
        <p className="text-sm text-muted-foreground">
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
  );
}
