"use client";

import { useMemo, useState } from "react";
import { monthKey, transactionsByDate, type BudgetCategory, type BudgetTransaction } from "@/lib/household";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

export function BudgetCalendar({
  transactions,
  categories,
  selectedDate,
  onSelectDate,
}: {
  transactions: BudgetTransaction[];
  categories: BudgetCategory[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [viewMonth, setViewMonth] = useState(monthKey(selectedDate));
  const kindById = new Map(categories.map((c) => [c.id, c.kind]));
  const byDate = useMemo(() => transactionsByDate(transactions), [transactions]);

  const [viewYear, viewMonthNum] = viewMonth.split("-").map(Number);
  const firstWeekday = new Date(viewYear, viewMonthNum - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonthNum, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function changeMonth(delta: number) {
    const d = new Date(viewYear, viewMonthNum - 1 + delta, 1);
    setViewMonth(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between font-mono text-sm">
        <button type="button" onClick={() => changeMonth(-1)} className="px-2 text-muted-foreground" aria-label="前の月">
          ‹
        </button>
        <span className="font-bold">
          {viewYear}年{viewMonthNum}月
        </span>
        <button type="button" onClick={() => changeMonth(1)} className="px-2 text-muted-foreground" aria-label="次の月">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`empty-${i}`} />;
          const d = dateKey(viewYear, viewMonthNum - 1, day);
          const dayTransactions = byDate.get(d) ?? [];
          const hasIncome = dayTransactions.some((t) => kindById.get(t.categoryId) === "income");
          const hasExpense = dayTransactions.some((t) => kindById.get(t.categoryId) === "expense");
          const isSelected = d === selectedDate;
          const isToday = d === todayStr;

          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg font-mono text-xs transition-colors ${
                isSelected
                  ? "neon-border neon-text"
                  : isToday
                    ? "border border-white/25 text-foreground"
                    : "border border-transparent text-muted-foreground hover:bg-white/5"
              }`}
            >
              {day}
              <span className="flex h-1.5 gap-0.5">
                {hasIncome && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "oklch(0.85 0.22 195)" }} />}
                {hasExpense && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "oklch(0.75 0.2 340)" }} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
