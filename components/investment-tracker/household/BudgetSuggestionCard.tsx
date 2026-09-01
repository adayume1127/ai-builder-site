"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import type { BudgetAdjustmentSuggestion } from "@/lib/budgetSuggestions";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

function SuggestionRow({
  suggestion,
  onAdopt,
}: {
  suggestion: BudgetAdjustmentSuggestion;
  onAdopt: (categoryId: string, budgetYen: number) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [draft, setDraft] = useState(String(suggestion.suggestedBudget));

  if (dismissed) return null;

  if (suggestion.reason === "consistent_under") {
    // 実績が低いだけで積極的に予算を下げる提案はしない。情報提供にとどめる。
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 font-mono text-xs">
        <p className="text-muted-foreground">
          最近は{suggestion.categoryLabel}に余裕があります(直近は月{formatYen(suggestion.typicalActual)}前後)。今の予算(
          {formatYen(suggestion.currentBudget)})を維持するか、他の目的へ回すこともできます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 font-mono text-xs">
      <p className="text-muted-foreground">
        最近は{suggestion.categoryLabel}が月{formatYen(suggestion.typicalActual)}前後。来月は{formatYen(suggestion.suggestedBudget)}
        くらい確保すると無理なく続けられそう。
      </p>
      <p className="text-[11px] text-muted-foreground">
        今の予算 {formatYen(suggestion.currentBudget)} → {formatYen(suggestion.suggestedBudget)}
      </p>

      {adjusting ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={`${inputClass} py-1 text-xs`}
          />
          <button
            type="button"
            onClick={() => {
              onAdopt(suggestion.categoryId, Number(draft) || suggestion.currentBudget);
              setDismissed(true);
            }}
            className="shrink-0 rounded-lg gold-border gold-text px-2 py-1 text-[11px]"
          >
            この額で更新
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              onAdopt(suggestion.categoryId, suggestion.suggestedBudget);
              setDismissed(true);
            }}
            className="flex-1 rounded-lg gold-border gold-text px-2 py-1.5 text-[11px]"
          >
            採用
          </button>
          <button
            type="button"
            onClick={() => setAdjusting(true)}
            className="flex-1 rounded-lg border border-white/15 px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-white/5"
          >
            調整する
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex-1 rounded-lg border border-white/15 px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-white/5"
          >
            今のまま
          </button>
        </div>
      )}
    </div>
  );
}

// 一度に表示する提案の上限。カテゴリ数が多い家計でも情報過多にならないよう、
// 「対応が必要(consistent_over)」を優先して並べ、最大でもこの件数までに絞る。
const MAX_VISIBLE_SUGGESTIONS = 3;

export function BudgetSuggestionCard({
  suggestions,
  onAdopt,
}: {
  suggestions: BudgetAdjustmentSuggestion[];
  onAdopt: (categoryId: string, budgetYen: number) => void;
}) {
  if (suggestions.length === 0) return null;
  const visible = [...suggestions]
    .sort((a, b) => (a.reason === b.reason ? 0 : a.reason === "consistent_over" ? -1 : 1))
    .slice(0, MAX_VISIBLE_SUGGESTIONS);
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <h3 className="font-mono text-sm text-muted-foreground">来月の予算のヒント</h3>
      {visible.map((s) => (
        <SuggestionRow key={s.categoryId} suggestion={s} onAdopt={onAdopt} />
      ))}
    </div>
  );
}
