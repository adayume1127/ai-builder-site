"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/portfolio";
import { FIRE_GOAL_TYPE, type HouseholdProfile } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const GOAL_TYPES = ["生活防衛資金", "100万円", "旅行", "車", "住宅", "結婚", "教育", FIRE_GOAL_TYPE, "その他", "特に決まっていない"];

export function GoalStep({
  value,
  currentCashSavingsYen,
  onBack,
  onNext,
}: {
  value: HouseholdProfile["goal"];
  // 参考表示にのみ使う(自動入力はしない)。現在の現金貯金の全額と、この目標のために確保した額は別概念。
  currentCashSavingsYen: number;
  onBack: () => void;
  onNext: (goal: HouseholdProfile["goal"]) => void;
}) {
  const [type, setType] = useState(value?.type ?? "");
  const [targetAmount, setTargetAmount] = useState(value?.targetAmount ? String(value.targetAmount) : "");
  const [targetDate, setTargetDate] = useState(value?.targetDate ?? "");
  const [alreadyEarmarkedAmount, setAlreadyEarmarkedAmount] = useState(
    value?.alreadyEarmarkedAmount ? String(value.alreadyEarmarkedAmount) : ""
  );

  const noGoal = type === "特に決まっていない";
  const isFireGoal = type === FIRE_GOAL_TYPE;
  const earmarkedExceedsBalance = Number(alreadyEarmarkedAmount) > currentCashSavingsYen;

  function handleNext() {
    if (!type || noGoal) {
      onNext(undefined);
      return;
    }
    onNext({
      type,
      targetAmount: targetAmount ? Math.max(0, Number(targetAmount) || 0) : undefined,
      targetDate: targetDate || undefined,
      alreadyEarmarkedAmount: alreadyEarmarkedAmount ? Math.max(0, Number(alreadyEarmarkedAmount) || 0) : undefined,
      bonusAllocated: value?.bonusAllocated,
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">今、目指したい貯金の目標はありますか?(任意)</p>

      <div className="grid grid-cols-2 gap-2">
        {GOAL_TYPES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setType(g)}
            className={`rounded-lg border px-3 py-2 text-left font-mono text-xs ${
              type === g ? "neon-border neon-text bg-white/5" : "border-white/15 text-muted-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {type && !noGoal && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[10px] text-muted-foreground">分かるところだけで大丈夫。あとから変更できます。</p>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">目標金額(円・任意)</label>
            <input
              type="number"
              inputMode="decimal"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="例: 1000000"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">いつまでに貯めたい？(年月・任意)</label>
            <input
              type="month"
              // <input type="month">はYYYY-MM形式のみ表示できる。旧仕様(<input type="date">)で
              // 保存されたYYYY-MM-DD値をそのまま渡すと表示が空になってしまう(保存値自体は消えない)ため、
              // 表示用にYYYY-MM部分だけ切り出す。編集して保存し直すと自然にYYYY-MM形式へ揃う。
              value={targetDate ? targetDate.slice(0, 7) : ""}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputClass}
            />
          </div>
          {isFireGoal ? (
            <p className="text-[10px] text-muted-foreground">
              FIRE / 資産形成の進捗は、資産タブに記録した総資産額をそのまま使います。ここで金額を入力する必要はありません。
            </p>
          ) : (
            <div className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground">
                この目標のために、すでに確保しているお金はありますか？(任意)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={alreadyEarmarkedAmount}
                onChange={(e) => setAlreadyEarmarkedAmount(e.target.value)}
                placeholder="なければ空欄のままでOK"
                className={inputClass}
              />
              <p className="text-[10px] text-muted-foreground">参考: 現在の現金貯金は{formatYen(currentCashSavingsYen)}です(自動入力はしません)。</p>
              {earmarkedExceedsBalance && (
                <p className="text-[10px] text-destructive">
                  現在の現金貯金より多い金額です。目標専用の別口座などであれば問題ありません。
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          戻る
        </Button>
        <Button type="button" className="flex-1" onClick={handleNext}>
          次へ
        </Button>
      </div>
    </div>
  );
}
