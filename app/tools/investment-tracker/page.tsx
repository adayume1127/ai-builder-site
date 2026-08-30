"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GoalCard } from "@/components/investment-tracker/GoalCard";
import { GoalForm } from "@/components/investment-tracker/GoalForm";
import { LunaCoach } from "@/components/investment-tracker/LunaCoach";
import {
  createGoal,
  loadGoals,
  paceStatus,
  progressRatio,
  saveGoals,
  type Goal,
  type NewGoalInput,
} from "@/lib/investmentTracker";

type FormMode = { type: "closed" } | { type: "create" } | { type: "edit"; goalId: string };

export default function InvestmentTrackerPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });

  useEffect(() => {
    setGoals(loadGoals());
    setLoaded(true);
  }, []);

  function persist(next: Goal[]) {
    setGoals(next);
    saveGoals(next);
  }

  function handleCreate(input: NewGoalInput) {
    persist([...goals, createGoal(input)]);
    setFormMode({ type: "closed" });
  }

  function handleEditSave(goalId: string, input: NewGoalInput) {
    persist(
      goals.map((g) =>
        g.id === goalId
          ? { ...g, ...input, actual: input.actual ? { ...g.actual, ...input.actual } : g.actual }
          : g
      )
    );
    setFormMode({ type: "closed" });
  }

  function handleUpdate(goal: Goal) {
    persist(goals.map((g) => (g.id === goal.id ? goal : g)));
  }

  function handleDelete(goalId: string) {
    if (!confirm("この目標を削除しますか？(元に戻せません)")) return;
    persist(goals.filter((g) => g.id !== goalId));
    if (formMode.type === "edit" && formMode.goalId === goalId) {
      setFormMode({ type: "closed" });
    }
  }

  const coach = useMemo(() => {
    if (!loaded) return null;
    if (goals.length === 0) {
      return {
        variant: "watch" as const,
        message: "まだ目標がないみたい。老後資金でも旅行資金でもOK、まずは1つ作ってみよう🌙",
      };
    }
    const achievedCount = goals.filter((g) => progressRatio(g) >= 1).length;
    if (achievedCount > 0) {
      return {
        variant: "celebrate" as const,
        message: `やったね！「${goals.find((g) => progressRatio(g) >= 1)?.name}」が目標達成🎉 他の目標も一緒に育てていこう！`,
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
  }, [goals, loaded]);

  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8 w-full">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>

        <div className="text-center space-y-3">
          <h1 className="neon-text flex items-center justify-center gap-2 text-3xl font-bold tracking-tight font-mono">
            <img
              src="/tools/investment-tracker/crystal.png"
              alt=""
              className="h-8 w-8 object-contain luna-glow-pulse"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            積立クエスト
          </h1>
          <p className="text-muted-foreground">
            複数の目標を保存して育てていく積立トラッカー。実際の運用成績(実績年利)も記録できます。
          </p>
        </div>

        {coach && <LunaCoach variant={coach.variant} message={coach.message} />}

        {formMode.type === "create" && (
          <GoalForm onSave={handleCreate} onCancel={() => setFormMode({ type: "closed" })} />
        )}

        <div className="space-y-4">
          {goals.map((goal) =>
            formMode.type === "edit" && formMode.goalId === goal.id ? (
              <GoalForm
                key={goal.id}
                initial={goal}
                onSave={(input) => handleEditSave(goal.id, input)}
                onCancel={() => setFormMode({ type: "closed" })}
              />
            ) : (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={handleUpdate}
                onEdit={() => setFormMode({ type: "edit", goalId: goal.id })}
                onDelete={() => handleDelete(goal.id)}
              />
            )
          )}
        </div>

        {formMode.type === "closed" && (
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => setFormMode({ type: "create" })}
          >
            <img
              src="/tools/investment-tracker/chest.png"
              alt=""
              className="h-5 w-5 object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            新しい目標を追加
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ※ データはこのブラウザ内(localStorage)にのみ保存されます。別の端末やブラウザからは見られません。
          <br />
          単発で計算したいだけの場合は
          <Link href="/tools/investment-calculator" className="neon-text-pink underline">
            積立シミュレーター
          </Link>
          もどうぞ。
        </p>
      </main>
    </div>
  );
}
