"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_EMOJIS, type Goal, type NewGoalInput } from "@/lib/investmentTracker";

function Field({
  label,
  hint,
  ...inputProps
}: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground font-mono">{label}</label>
      <input
        {...inputProps}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function GoalForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Goal;
  onSave: (input: NewGoalInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? DEFAULT_EMOJIS[0]);
  const [goalMan, setGoalMan] = useState(String(initial?.goalMan ?? 1000));
  const [years, setYears] = useState(String(initial?.years ?? 20));
  const [assumedRate, setAssumedRate] = useState(String(initial?.assumedRate ?? 4));
  const [investedMan, setInvestedMan] = useState(String(initial?.investedMan ?? 0));
  const [savingsMan, setSavingsMan] = useState(String(initial?.savingsMan ?? 0));
  const [monthlyContributionMan, setMonthlyContributionMan] = useState(
    String(initial?.monthlyContributionMan ?? 3)
  );

  const canSave = name.trim().length > 0 && Number(goalMan) > 0 && Number(years) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      name: name.trim(),
      emoji,
      goalMan: Number(goalMan),
      years: Number(years),
      assumedRate: Number(assumedRate) || 0,
      investedMan: Number(investedMan) || 0,
      savingsMan: Number(savingsMan) || 0,
      monthlyContributionMan: Number(monthlyContributionMan) || 0,
      actual: initial?.actual,
    });
  }

  return (
    <Card className="neon-border bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-mono text-base">
          {initial ? "目標を編集" : "新しい目標を作成"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground font-mono">アイコン</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg ${
                    emoji === e
                      ? "neon-border bg-white/10"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Field
            label="目標の名前"
            placeholder="例: 老後資金"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="目標額(万円)"
            type="number"
            inputMode="numeric"
            value={goalMan}
            onChange={(e) => setGoalMan(e.target.value)}
          />
          <Field
            label="何年後に到達したいか"
            type="number"
            inputMode="numeric"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
          <Field
            label="想定年利(%)"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={assumedRate}
            onChange={(e) => setAssumedRate(e.target.value)}
            hint="デフォルトは4%。自由に変更できます。将来の運用成績を保証する数値ではありません。"
          />
          <Field
            label="現時点での投資資金(万円)"
            type="number"
            inputMode="numeric"
            value={investedMan}
            onChange={(e) => setInvestedMan(e.target.value)}
            hint="すでに運用に回している分。無ければ0でOK。"
          />
          <Field
            label="貯金・現金(万円)"
            type="number"
            inputMode="numeric"
            value={savingsMan}
            onChange={(e) => setSavingsMan(e.target.value)}
            hint="運用されない(増えない)前提で計算します。"
          />
          <Field
            label="毎月の積立額(万円)"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={monthlyContributionMan}
            onChange={(e) => setMonthlyContributionMan(e.target.value)}
            hint="実際に(または予定として)毎月積み立てている額。"
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={!canSave} className="flex-1">
              {initial ? "保存する" : "この目標を作る"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
