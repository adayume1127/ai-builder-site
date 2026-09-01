"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import type { MonthlyHistoryEntry } from "@/lib/monthlyReview";

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

function HistoryRow({ entry }: { entry: MonthlyHistoryEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between font-mono text-xs"
      >
        <span className="text-foreground">{formatMonthLabel(entry.month)}</span>
        <span className="flex items-center gap-2">
          <span className={entry.monthlySurplus >= 0 ? "neon-text" : "text-destructive"}>
            {entry.monthlySurplus >= 0 ? "+" : ""}
            {formatYen(entry.monthlySurplus)}
          </span>
          <span className="text-muted-foreground">{open ? "▲" : "▼"}</span>
        </span>
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-white/10 pt-2 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">収入</span>
            <span>{formatYen(entry.actualIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">固定費</span>
            <span>{formatYen(entry.actualFixedExpenses)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">変動費</span>
            <span>{formatYen(entry.actualVariableExpenses)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">特別費</span>
            <span>{formatYen(entry.actualSpecialExpenses)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">投資実績</span>
            <span>{formatYen(entry.actualMonthlyInvestment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">貯金へ割り当て</span>
            <span>{entry.review ? formatYen(entry.review.allocatedToCashSavings) : "未レビュー"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthlyHistoryList({ entries }: { entries: MonthlyHistoryEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <h3 className="font-mono text-sm text-muted-foreground">過去の実績</h3>
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <HistoryRow key={entry.month} entry={entry} />
        ))}
      </div>
    </div>
  );
}
