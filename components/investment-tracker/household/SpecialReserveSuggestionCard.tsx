"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";

export function SpecialReserveSuggestionCard({
  estimatedMonthlyReserve,
  annualTotal,
  currentReserve,
  onAdopt,
}: {
  estimatedMonthlyReserve: number;
  annualTotal: number;
  currentReserve: number;
  onAdopt: (newReserve: number) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || estimatedMonthlyReserve === currentReserve) return null;

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono text-xs">
      <h3 className="text-muted-foreground">特別費の積立を見直しませんか?</h3>
      <p className="text-muted-foreground">
        最近の記録から見ると、年間{formatYen(annualTotal)}ほど特別費がかかりそうです。毎月
        {formatYen(estimatedMonthlyReserve)}ほど確保しておくと安心です。
      </p>
      <p className="text-[11px] text-muted-foreground">
        今の確保額 {formatYen(currentReserve)} → {formatYen(estimatedMonthlyReserve)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            onAdopt(estimatedMonthlyReserve);
            setDismissed(true);
          }}
          className="flex-1 rounded-lg gold-border gold-text px-3 py-1.5"
        >
          採用
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-1 rounded-lg border border-white/15 px-3 py-1.5 text-muted-foreground hover:bg-white/5"
        >
          今のまま
        </button>
      </div>
    </div>
  );
}
