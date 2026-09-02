"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import type { MonthlyHistoryEntry } from "@/lib/monthlyReview";

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}年${Number(m)}月`;
}

function HistoryRow({
  entry,
  selected,
  onSelectMonth,
}: {
  entry: MonthlyHistoryEntry;
  selected: boolean;
  onSelectMonth: (month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border p-2.5 ${selected ? "gold-border bg-white/5" : "border-white/10 bg-white/[0.02]"}`}>
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
        <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
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
          <button
            type="button"
            disabled={selected}
            onClick={() => onSelectMonth(entry.month)}
            className="w-full rounded-lg border border-white/15 px-2 py-1.5 font-mono text-[11px] text-muted-foreground hover:bg-white/5 disabled:opacity-40"
          >
            {selected ? "この月をレビュー中" : "この月をレビューする"}
          </button>
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 6;

export function MonthlyHistoryList({
  entries,
  selectedMonth,
  onSelectMonth,
}: {
  entries: MonthlyHistoryEntry[];
  selectedMonth: string | null;
  onSelectMonth: (month: string) => void;
}) {
  // 履歴の表示件数と、月末レビューの対象月(selectedMonth)は独立したstateとして扱う。
  // ◀/▶でselectedMonthが表示範囲外の月に移動しても、この一覧は自動で展開しない
  // (「さらに表示」で追える。逆に、一覧側の操作でレビュー対象が勝手に変わることもない)。
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  if (entries.length === 0) return null;
  const visibleEntries = entries.slice(0, visibleCount);
  const remaining = entries.length - visibleEntries.length;
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <h3 className="font-mono text-sm text-muted-foreground">過去の実績</h3>
      <div className="space-y-1.5">
        {visibleEntries.map((entry) => (
          <HistoryRow key={entry.month} entry={entry} selected={entry.month === selectedMonth} onSelectMonth={onSelectMonth} />
        ))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className="w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
        >
          さらに過去を表示(残り{remaining}件)
        </button>
      )}
    </div>
  );
}
