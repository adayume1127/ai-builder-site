"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/portfolio";
import type { SpecialExpense, SpecialExpenseMode } from "@/lib/householdDiagnosis";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const MODE_LABELS: Record<SpecialExpenseMode, string> = {
  known: "分かる",
  partial: "一部だけ分かる",
  unknown: "分からない",
};

const EXAMPLES = ["旅行", "帰省", "車検", "自動車税", "家電", "冠婚葬祭", "プレゼント", "年払いサービス"];

export function SpecialExpenseSetup({
  mode,
  items,
  onBack,
  onFinish,
}: {
  mode: SpecialExpenseMode;
  items: SpecialExpense[];
  onBack: () => void;
  onFinish: (mode: SpecialExpenseMode, items: SpecialExpense[]) => void;
}) {
  const [localMode, setLocalMode] = useState<SpecialExpenseMode>(mode);
  const [localItems, setLocalItems] = useState<SpecialExpense[]>(items);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const total = localItems.reduce((sum, e) => sum + e.amount, 0);

  function handleAdd() {
    const label = category.trim();
    const value = Number(amount) || 0;
    if (!label || value <= 0) return;
    setLocalItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: label,
        amount: value,
        recurrence: "annual",
        source: "manual",
      },
    ]);
    setCategory("");
    setAmount("");
  }

  function handleRemove(id: string) {
    setLocalItems((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        毎月ではない、たまに出ていく大きな出費(旅行・帰省・車検・冠婚葬祭など)は、どのくらい把握できていますか?
      </p>

      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(MODE_LABELS) as SpecialExpenseMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setLocalMode(m)}
            className={`rounded-xl border px-4 py-3 text-left font-mono text-sm transition-colors ${
              localMode === m ? "neon-border neon-text bg-white/5" : "border-white/15 text-muted-foreground"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {localMode !== "unknown" && (
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground">例: {EXAMPLES.join(" / ")}</p>

          {localItems.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-2">
              {localItems.map((e) => (
                <div key={e.id} className="flex items-center justify-between font-mono text-xs">
                  <span className="text-muted-foreground">{e.category}</span>
                  <span>{formatYen(e.amount)}/年</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(e.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/10 pt-1.5 font-mono text-xs font-bold">
                <span className="text-muted-foreground">年間合計</span>
                <span className="gold-text">{formatYen(total)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="項目名(例: 旅行)"
              className={inputClass}
            />
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="年間の金額"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="shrink-0 rounded-lg gold-border gold-text px-3 py-2 font-mono text-xs"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {localMode === "unknown" && (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-muted-foreground">
          入力は不要です。手取り収入をもとに、仮の予備費を自動で計算します。家計簿を使っていく中で、大きな支出があれば特別費として整理する提案をします。
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          戻る
        </Button>
        <Button type="button" className="flex-1" onClick={() => onFinish(localMode, localItems)}>
          診断結果を見る
        </Button>
      </div>
    </div>
  );
}
