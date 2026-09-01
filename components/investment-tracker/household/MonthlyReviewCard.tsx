"use client";

import { useState } from "react";
import { formatYen } from "@/lib/portfolio";
import { reviewNeedsReconciliation, type MonthlyReview } from "@/lib/monthlyReview";

const inputClass =
  "w-28 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

export function MonthlyReviewCard({
  month,
  actualIncome,
  actualFixedExpenses,
  actualVariableExpenses,
  actualSpecialExpenses,
  actualMonthlyInvestment,
  monthlySurplus,
  plannedCashSavings,
  plannedInvestment,
  previousMonthSurplus,
  review,
  onSaveAllocation,
}: {
  month: string;
  actualIncome: number;
  actualFixedExpenses: number;
  actualVariableExpenses: number;
  actualSpecialExpenses: number;
  actualMonthlyInvestment: number;
  monthlySurplus: number;
  plannedCashSavings: number;
  plannedInvestment: number;
  previousMonthSurplus: number | null;
  review: MonthlyReview | null;
  onSaveAllocation: (allocatedToCashSavings: number, allocatedToSpecialReserve: number) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [showInvestmentNote, setShowInvestmentNote] = useState(false);
  const [cashInput, setCashInput] = useState(String(review?.allocatedToCashSavings ?? Math.max(monthlySurplus, 0)));
  const [specialInput, setSpecialInput] = useState(String(review?.allocatedToSpecialReserve ?? 0));
  const [saved, setSaved] = useState(false);

  const allocatedCash = Number(cashInput) || 0;
  const allocatedSpecial = Number(specialInput) || 0;
  const totalAllocated = allocatedCash + allocatedSpecial;
  const unallocated = monthlySurplus - totalAllocated;
  // 赤字/ゼロの月は割り当てられる上限が0円になる(マイナスの余剰金に対して割り当てることはできない)。
  // 再確認が必要な状態でも、ユーザーが0円/0円に修正すれば必ず保存できるようにするため、
  // 比較対象を monthlySurplus ではなく max(monthlySurplus, 0) にする。
  const overAllocated = totalAllocated > Math.max(monthlySurplus, 0);

  // 保存済みレビュー確定後に過去取引が編集され、余剰金が保存済み割当合計を下回った状態。
  // このフラグはreview(保存済みの値)とmonthlySurplus(常に最新の実績から再計算)だけから毎回導出しており、
  // 割当額そのものは一切書き換えない。ユーザーが金額を見直して再保存すると review が更新され自動的に解消する。
  const needsReconciliation = reviewNeedsReconciliation(review, monthlySurplus);
  const showAllocationSection = monthlySurplus > 0 || needsReconciliation;

  return (
    <div className="space-y-3 rounded-xl gold-border bg-white/5 p-4">
      <p className="text-center font-mono text-xs text-muted-foreground">{month}のふりかえり</p>

      <div className="text-center">
        {monthlySurplus > 0 ? (
          <>
            <p className="font-mono text-xs text-muted-foreground">今月は</p>
            <p className="gold-text font-mono text-3xl font-bold">{formatYen(monthlySurplus)}</p>
            <p className="font-mono text-xs text-muted-foreground">残りました</p>
          </>
        ) : monthlySurplus === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">今月の収支はちょうどゼロでした</p>
        ) : (
          <p className="font-mono text-sm text-destructive">今月は{formatYen(Math.abs(monthlySurplus))}の赤字でした</p>
        )}
      </div>

      {showAllocationSection && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          {needsReconciliation && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-center font-mono text-[11px] text-destructive">
              その後の取引変更で今月の余剰金が変わりました。割り当てを見直してください。
            </p>
          )}
          <p className="text-center font-mono text-xs text-muted-foreground">どう使う?</p>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between gap-2">
              <label className="shrink-0 text-muted-foreground">現金貯金へ</label>
              <input
                type="number"
                inputMode="decimal"
                value={cashInput}
                onChange={(e) => {
                  setCashInput(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="shrink-0 text-muted-foreground">特別費として残す</label>
              <input
                type="number"
                inputMode="decimal"
                value={specialInput}
                onChange={(e) => {
                  setSpecialInput(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-muted-foreground">未割当</span>
            <span className={unallocated < 0 ? "font-bold text-destructive" : "text-muted-foreground"}>{formatYen(unallocated)}</span>
          </div>
          {overAllocated && (
            <p className="font-mono text-[11px] text-destructive">割り当て合計が今月の余剰金({formatYen(monthlySurplus)})を超えています</p>
          )}

          <div className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-2">
            <button
              type="button"
              onClick={() => setShowInvestmentNote((v) => !v)}
              className="w-full rounded-lg border border-white/15 px-2 py-1.5 font-mono text-[11px] text-muted-foreground hover:bg-white/5"
            >
              投資へ
            </button>
            {showInvestmentNote && (
              <p className="font-mono text-[10px] text-muted-foreground">
                投資に回す場合は、家計簿の記録で「投資」に分類したカテゴリの支出として登録してください。登録した時点で預金残高から差し引かれます。
                ※投資取引は資産タブの投資評価額には自動反映されません。実際に投資したら資産タブでも金額を更新しましょう。
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={overAllocated}
            onClick={() => {
              onSaveAllocation(allocatedCash, allocatedSpecial);
              setSaved(true);
            }}
            className="w-full rounded-lg gold-border gold-text px-3 py-2 font-mono text-xs disabled:opacity-40"
          >
            {saved ? "保存しました" : "この内容で保存"}
          </button>
          {review?.reviewedAt && (
            <p className="text-center font-mono text-[10px] text-muted-foreground">
              前回保存: {new Date(review.reviewedAt).toLocaleString("ja-JP")}時点の割り当て
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="w-full rounded-lg border border-white/15 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-white/5"
      >
        {showDetail ? "詳細を閉じる ▲" : "詳細な数値を見る ▼"}
      </button>

      {showDetail && (
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <DetailRow label="収入" value={formatYen(actualIncome)} />
          <DetailRow label="固定費" value={formatYen(actualFixedExpenses)} />
          <DetailRow label="変動費" value={formatYen(actualVariableExpenses)} />
          <DetailRow label="特別費" value={formatYen(actualSpecialExpenses)} />
          <DetailRow label="現金貯金 予定" value={formatYen(plannedCashSavings)} />
          <DetailRow label="投資 予定/実績" value={`${formatYen(plannedInvestment)} / ${formatYen(actualMonthlyInvestment)}`} />
          {previousMonthSurplus !== null && (
            <DetailRow
              label="前月との差"
              value={`${monthlySurplus - previousMonthSurplus >= 0 ? "+" : ""}${formatYen(monthlySurplus - previousMonthSurplus)}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
