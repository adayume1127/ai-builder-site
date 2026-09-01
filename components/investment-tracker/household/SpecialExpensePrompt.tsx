"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import type { BudgetTransaction } from "@/lib/household";
import type { SpecialExpenseCandidateRecurrence } from "@/lib/specialExpenseDetection";
import { LunaCoach } from "../LunaCoach";

const RECURRENCE_OPTIONS: { value: SpecialExpenseCandidateRecurrence; label: string }[] = [
  { value: "annual", label: "毎年ありそう" },
  { value: "occasional", label: "ときどきある" },
  { value: "one_time", label: "今回だけ" },
];

export function SpecialExpensePrompt({
  transaction,
  categoryLabel,
  onResolve,
}: {
  transaction: BudgetTransaction;
  categoryLabel: string;
  onResolve: (decision: "special" | "normal", recurrence?: SpecialExpenseCandidateRecurrence) => void;
}) {
  const [step, setStep] = useState<"confirm" | "recurrence">("confirm");

  if (step === "confirm") {
    return (
      <div className="space-y-3 rounded-xl gold-border bg-white/5 p-3">
        <LunaCoach
          variant="watch"
          message={`${formatYen(transaction.amount)}の支出です(${categoryLabel})。普段の生活費ではなく特別費として記録しますか?`}
        />
        <div className="flex gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setStep("recurrence")}
            className="flex-1 rounded-lg gold-border gold-text px-3 py-2"
          >
            特別費にする
          </button>
          <button
            type="button"
            onClick={() => onResolve("normal")}
            className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-muted-foreground hover:bg-white/5"
          >
            通常支出のまま
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl gold-border bg-white/5 p-3">
      <LunaCoach variant="watch" message="今後も発生する可能性がありますか?" />
      <div className="grid grid-cols-1 gap-2 font-mono text-xs">
        {RECURRENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onResolve("special", opt.value)}
            className="rounded-lg border border-white/15 px-3 py-2 text-left text-muted-foreground hover:bg-white/5"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
