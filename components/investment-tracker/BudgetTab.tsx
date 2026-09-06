"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BudgetCalendar } from "./BudgetCalendar";
import { SavingsTrendChart } from "./SavingsTrendChart";
import { todayKey, formatYen } from "@/lib/portfolio";
import {
  addCategory,
  categoryBudgetStatusForMonth,
  categoryNature,
  cumulativeSavingsTrend,
  monthKey,
  monthlySummaries,
  transactionsByDate,
  type BudgetCategory,
  type BudgetCategoryKind,
  type BudgetTransaction,
  type ExpenseNature,
} from "@/lib/household";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]";

const NATURE_LABELS: Record<ExpenseNature, string> = {
  fixed: "固定費",
  variable: "変動費",
  special: "特別費",
  investment: "投資",
};

// 「記録の履歴」の表示専用ソート。保存データ(lib/household.ts側は常に日付昇順)は変更せず、
// 表示のたびにコピーを並べ替えるだけ(元配列を破壊しない)。createdAt相当のフィールドが
// データ上存在しないため、「新しい順」はあくまで取引日基準であることを文言でも明示する。
type SortOrder = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_OPTIONS: { order: SortOrder; label: string }[] = [
  { order: "date-desc", label: "日付: 新しい順" },
  { order: "date-asc", label: "日付: 古い順" },
  { order: "amount-desc", label: "金額: 高い順" },
  { order: "amount-asc", label: "金額: 低い順" },
];

// 「記録の履歴」を月ごとにグループ化する(新しい月が先頭)。グループ内の並び順は
// sortTransactionsForDisplayに委ねる(月をまたいで並べ替えるわけではない)。
function groupTransactionsByMonth(
  transactions: BudgetTransaction[]
): { month: string; items: BudgetTransaction[] }[] {
  const byMonth = new Map<string, BudgetTransaction[]>();
  for (const t of transactions) {
    const key = monthKey(t.date);
    const list = byMonth.get(key);
    if (list) list.push(t);
    else byMonth.set(key, [t]);
  }
  return [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, items]) => ({ month, items }));
}

function sortTransactionsForDisplay(transactions: BudgetTransaction[], order: SortOrder): BudgetTransaction[] {
  const copy = [...transactions];
  switch (order) {
    case "date-desc":
      return copy.sort((a, b) => b.date.localeCompare(a.date));
    case "date-asc":
      return copy.sort((a, b) => a.date.localeCompare(b.date));
    case "amount-desc":
      return copy.sort((a, b) => b.amount - a.amount);
    case "amount-asc":
      return copy.sort((a, b) => a.amount - b.amount);
  }
}

// タップ領域を最低44×44pxまで拡大しつつ、見た目の「×」自体は変えない(paddingではなく
// min-h/min-w+中央揃えで確保する。負のマージンだと隣接要素との当たり判定が重なりうるため避けた)。
const deleteButtonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-destructive";

export function BudgetTab({
  categories,
  transactions,
  plannedCashSavingsYen,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddCategory,
  onDeleteCategory,
  onSetCategoryBudget,
  onSetCategoryNature,
  investmentEntryRequestId,
  investmentCategoryId,
}: {
  categories: BudgetCategory[];
  transactions: BudgetTransaction[];
  // 今月採用済みのMonthlyBudget.plannedCashSavings(未採用なら0)。この画面では編集しない
  // (編集は家計簿タブの「今月の予算」経由。ここは実績との比較だけを行う)。
  plannedCashSavingsYen: number;
  onAddTransaction: (input: Omit<BudgetTransaction, "id">) => void;
  onUpdateTransaction: (id: string, patch: Partial<Omit<BudgetTransaction, "id">>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddCategory: (label: string, kind: BudgetCategoryKind) => void;
  onDeleteCategory: (id: string) => void;
  onSetCategoryBudget: (id: string, budgetYen: number) => void;
  onSetCategoryNature: (id: string, nature: ExpenseNature) => void;
  // 月末レビューの「投資の記録を追加する」から呼ばれたときだけ増分される。0(初期値)では何もしない。
  investmentEntryRequestId: number;
  investmentCategoryId: string | null;
}) {
  const [kind, setKind] = useState<BudgetCategoryKind>("expense");
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const kindCategories = kind === "expense" ? expenseCategories : incomeCategories;

  const [categoryId, setCategoryId] = useState(kindCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayKey());
  const [memo, setMemo] = useState("");
  // 直前に追加した取引が投資(nature=investment)だったか。資産タブの評価額には自動反映されないことを注記するために使う。
  const [lastAddedInvestment, setLastAddedInvestment] = useState(false);
  const byDate = transactionsByDate(transactions);
  const selectedDateTransactions = byDate.get(date) ?? [];

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryKind, setNewCategoryKind] = useState<BudgetCategoryKind>("expense");
  // デフォルトは既存の表示順(新しい順、旧実装の[...transactions].reverse()と同じ結果)を踏襲する。
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");
  // 毎日の記録作業とは性質が違う管理操作なので、初期状態では折りたたんでおく(Cycle4)。
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // 記録の履歴を月ごとに折りたたんで表示する。件数が増えるほど1画面の縦の長さが
  // 際限なく伸びていた反省(GPTレビュー後にユーザーから直接指摘)を踏まえ、
  // 直近の月だけ開いた状態にする。「直近の月」は暦上の今月ではなく、記録が
  // 存在する最新月(例: 今月まだ何も記録していなければ先月)を指す。
  const latestMonthWithTransactions =
    transactions.length > 0
      ? transactions.reduce((latest, t) => {
          const m = monthKey(t.date);
          return m > latest ? m : latest;
        }, monthKey(transactions[0].date))
      : monthKey(todayKey());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set([latestMonthWithTransactions]));
  function toggleMonth(month: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  }

  // 記録の履歴からのインライン編集(日付・カテゴリ・金額・メモ)。
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMemo, setEditMemo] = useState("");

  function startEdit(t: BudgetTransaction) {
    setEditingId(t.id);
    setEditDate(t.date);
    setEditCategoryId(t.categoryId);
    setEditAmount(String(t.amount));
    setEditMemo(t.memo ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
  }
  function saveEdit(id: string) {
    const value = Number(editAmount);
    if (!editCategoryId || !Number.isFinite(value) || value <= 0 || !editDate) return;
    onUpdateTransaction(id, { date: editDate, categoryId: editCategoryId, amount: value, memo: editMemo });
    setEditingId(null);
    // 編集で日付の月が変わった場合、保存直後にその取引が今開いている月から消えて
    // 見えなくなる(月をまたいで移動した先が閉じたまま)ことを避けるため、移動先の月を開く。
    setExpandedMonths((prev) => new Set(prev).add(monthKey(editDate)));
  }

  const entryFormRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  // 月末レビューの「投資の記録を追加する」ボタンから呼ばれたときだけ、支出/投資カテゴリを
  // プリセレクトしてこのフォームまでスクロールする。0(初期値・未リクエスト)では何もしない。
  // investmentCategoryIdをdepsに含めないのは意図的: 「カテゴリが変わったら追従する」のではなく
  // 「リクエストが発生した瞬間の最新カテゴリを一度だけ使う」動作にするため。
  useEffect(() => {
    if (investmentEntryRequestId === 0) return;
    setKind("expense");
    // 投資分類のカテゴリが存在しない場合、直前に選択していた無関係なカテゴリ(食費など)を
    // 残さない。空にすると「追加する」ボタンがdisabledになり、ユーザーがカテゴリを
    // 意識的に選び直すまで誤ったカテゴリで記録されるのを防げる。
    setCategoryId(investmentCategoryId ?? "");
    entryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    amountInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investmentEntryRequestId]);

  // ユーザーが今まさに入力中の値だけを保持する(未編集のカテゴリは常にcategories側の最新値を表示する)。
  // これにより、BudgetSuggestionCardの「採用」など他の操作でmonthlyBudgetYenが変わった場合も
  // ここの表示が古いままにならない。
  const [budgetInputOverrides, setBudgetInputOverrides] = useState<Record<string, string>>({});

  const summaries = monthlySummaries(transactions, categories);
  const trend = cumulativeSavingsTrend(summaries);
  const currentMonth = monthKey(todayKey());
  const thisMonth = summaries.find((s) => s.month === currentMonth) ?? {
    month: currentMonth,
    incomeYen: 0,
    expenseYen: 0,
    savingsYen: 0,
  };
  const budgetStatuses = categoryBudgetStatusForMonth(transactions, categories, currentMonth);
  const overBudgetCount = budgetStatuses.filter((b) => b.overBudget).length;

  const categoryLabelById = new Map(categories.map((c) => [c.id, c.label]));

  function handleKindChange(next: BudgetCategoryKind) {
    setKind(next);
    const nextCategories = next === "expense" ? expenseCategories : incomeCategories;
    setCategoryId(nextCategories[0]?.id ?? "");
  }

  function handleSubmit() {
    const value = Number(amount);
    if (!categoryId || !Number.isFinite(value) || value <= 0 || !date) return;
    onAddTransaction({ date, categoryId, amount: value, memo });
    const addedCategory = categories.find((c) => c.id === categoryId);
    setLastAddedInvestment(addedCategory ? categoryNature(addedCategory) === "investment" : false);
    setAmount("");
    setMemo("");
  }

  function handleAddCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    onAddCategory(label, newCategoryKind);
    setNewCategoryLabel("");
  }

  // インライン一覧・履歴テーブルの両方から呼ぶ共通の削除ハンドラ。確認なしの即削除だった
  // 挙動を、目標削除(page.tsx)と同じconfirm()パターンに揃える。2箇所に別々に書くと
  // 片方だけ確認を忘れる等の挙動差が生まれるため、ここに一本化する。
  function handleDeleteWithConfirm(id: string) {
    if (!confirm("この記録を削除しますか？削除すると元に戻せません。")) return;
    onDeleteTransaction(id);
  }

  function handleSaveBudget(categoryId: string, displayedValue: string) {
    onSetCategoryBudget(categoryId, Number(displayedValue) || 0);
    setBudgetInputOverrides((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">家計簿</h2>
        <p className="text-sm text-muted-foreground">収入・支出を記録して、貯金額の推移を確認できます。</p>
      </div>

      <div className="gold-border space-y-3 rounded-2xl bg-white/5 p-4 font-mono">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">今月の収入</p>
            <p className="neon-text text-sm font-bold">{formatYen(thisMonth.incomeYen)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">今月の支出</p>
            <p className="neon-text-pink text-sm font-bold">{formatYen(thisMonth.expenseYen)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">今月の収支</p>
            <p className={`text-sm font-bold ${thisMonth.savingsYen >= 0 ? "gold-text" : "text-destructive"}`}>
              {formatYen(thisMonth.savingsYen)}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">今月の貯金プラン</span>
            <span className="text-muted-foreground">
              {plannedCashSavingsYen > 0 ? (
                <span className="gold-text font-bold">{formatYen(plannedCashSavingsYen)}</span>
              ) : (
                "今月の予算で0円に設定されています"
              )}
            </span>
          </div>
          {/* 「収支」はあくまで記録済み取引の差額であり、この金額を実際に貯金へ回せたかは
              このアプリでは確認できない。そのため計画額を事実として示すだけにとどめ、
              達成率・進捗バー等の「達成した」という演出は付けない。 */}
          <p className="text-[10px] text-muted-foreground">
            金額は上の「今月の予算を編集」から調整できます。
          </p>
        </div>
      </div>

      <div ref={entryFormRef} className="space-y-3 rounded-xl gold-border bg-white/5 p-3">
        <h3 className="font-mono text-sm text-muted-foreground">記録を追加(日付をタッチして選択)</h3>

        <BudgetCalendar transactions={transactions} categories={categories} selectedDate={date} onSelectDate={setDate} />

        <p className="text-center font-mono text-xs">
          <span className="text-muted-foreground">選択中の日付: </span>
          <span className="neon-text font-bold">{date}</span>
        </p>

        {selectedDateTransactions.length > 0 && (
          <div className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-2">
            {selectedDateTransactions.map((t) => {
              const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
              return (
                <div key={t.id} className="space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">{categoryLabelById.get(t.categoryId) ?? "-"}</span>
                    <span className={isIncome ? "neon-text" : "neon-text-pink"}>
                      {isIncome ? "+" : "-"}
                      {formatYen(t.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteWithConfirm(t.id)}
                      className={deleteButtonClass}
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </div>
                  {t.memo && <p className="line-clamp-1 font-mono text-[10px] text-muted-foreground">{t.memo}</p>}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleKindChange("expense")}
            className={`flex-1 rounded-lg px-3 py-1.5 font-mono text-xs ${
              kind === "expense" ? "neon-border-pink neon-text-pink" : "border border-white/15 text-muted-foreground"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => handleKindChange("income")}
            className={`flex-1 rounded-lg px-3 py-1.5 font-mono text-xs ${
              kind === "income" ? "neon-border neon-text" : "border border-white/15 text-muted-foreground"
            }`}
          >
            収入
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {/* categoryIdが現在のkindCategoriesのどれとも一致しない場合(投資カテゴリ未作成時など)、
                空文字のoption自体が無いとブラウザは前回選択されていた選択肢の表示を保持してしまう
                (Reactのstateは""になってもDOM上の見た目が更新されない)。プレースホルダーを出して
                見た目とstateを一致させ、「追加する」がdisabledな理由をユーザーにも分かるようにする。 */}
            {(kindCategories.length === 0 || !kindCategories.some((c) => c.id === categoryId)) && (
              <option value="">{kindCategories.length === 0 ? "カテゴリなし" : "カテゴリを選択してください"}</option>
            )}
            {kindCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            ref={amountInputRef}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額(円)"
            className={inputClass}
          />
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ(任意)"
            className={`${inputClass} col-span-2`}
          />
        </div>

        <Button type="button" className="w-full" onClick={handleSubmit} disabled={!categoryId}>
          追加する
        </Button>
        {lastAddedInvestment && (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-[11px] text-muted-foreground">
            投資の記録は、資産タブの投資評価額には自動反映されません。投資後に資産タブで現在の評価額を更新すると、資産合計にも反映されます。それまでは預金だけが先に減るため、資産合計が一時的に少なく見えることがあります。
          </p>
        )}
      </div>

      {budgetStatuses.length > 0 && (
        <div
          className={`space-y-2 rounded-xl border p-3 ${
            overBudgetCount > 0 ? "border-destructive/50 bg-destructive/10" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <h3 className="font-mono text-sm text-muted-foreground">
            今月の予算{overBudgetCount > 0 && <span className="text-destructive font-bold"> ⚠ {overBudgetCount}件が予算超過</span>}
          </h3>
          {budgetStatuses.map((b) => (
            <div key={b.category.id} className="space-y-1">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">{b.category.label}</span>
                <span className={b.overBudget ? "text-destructive font-bold" : "text-muted-foreground"}>
                  {formatYen(b.spentYen)} / {formatYen(b.budgetYen)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${b.overBudget ? "bg-destructive" : "bg-[oklch(0.85_0.22_195)]"}`}
                  style={{ width: `${Math.min(100, Math.round(b.ratio * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-mono text-sm text-muted-foreground">累計収支の推移</h3>
        <SavingsTrendChart points={trend} />
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <button
          type="button"
          onClick={() => setShowCategoryManagement((v) => !v)}
          className="flex w-full items-center justify-between font-mono text-sm text-muted-foreground"
        >
          <span>カテゴリ管理</span>
          <span className="text-xs">{showCategoryManagement ? "閉じる ▲" : "開く ▼"}</span>
        </button>
        {showCategoryManagement && (
          <>

        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">
            支出(分類は「今月あと使えるお金」の計算に使われます。予算を設定すると超過時に警告表示されます)
          </p>
          <div className="space-y-2">
            {expenseCategories.map((c) => (
              <div key={c.id} className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] whitespace-nowrap">
                    {c.label}
                    {!c.isDefault && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(c.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`${c.label}を削除`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                  <select
                    value={categoryNature(c)}
                    onChange={(e) => onSetCategoryNature(c.id, e.target.value as ExpenseNature)}
                    className="w-24 shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                    aria-label={`${c.label}の分類`}
                  >
                    {(Object.keys(NATURE_LABELS) as ExpenseNature[]).map((n) => (
                      <option key={n} value={n}>
                        {NATURE_LABELS[n]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={budgetInputOverrides[c.id] ?? (c.monthlyBudgetYen ? String(c.monthlyBudgetYen) : "")}
                    onChange={(e) => setBudgetInputOverrides((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="予算(円・任意)"
                    aria-label={`${c.label}の予算`}
                    className={`${inputClass} py-1 text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveBudget(c.id, budgetInputOverrides[c.id] ?? (c.monthlyBudgetYen ? String(c.monthlyBudgetYen) : "0"))
                    }
                    aria-label={`${c.label}の予算を設定`}
                    className="shrink-0 rounded-lg border border-white/15 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-white/5"
                  >
                    設定
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">収入</p>
          <div className="flex flex-wrap gap-1.5">
            {incomeCategories.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px]"
              >
                {c.label}
                {!c.isDefault && (
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`${c.label}を削除`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={newCategoryKind}
            onChange={(e) => setNewCategoryKind(e.target.value as BudgetCategoryKind)}
            className="w-24 shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
          <input
            type="text"
            value={newCategoryLabel}
            onChange={(e) => setNewCategoryLabel(e.target.value)}
            placeholder="新しいカテゴリ名"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="shrink-0 rounded-lg gold-border gold-text px-3 py-1.5 font-mono text-xs"
          >
            追加
          </button>
        </div>
          </>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-sm text-muted-foreground">記録の履歴</h3>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              aria-label="表示順"
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.order} value={opt.order}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {groupTransactionsByMonth(transactions).map(({ month, items }) => {
              const isOpen = expandedMonths.has(month);
              const netYen = items.reduce((sum, t) => {
                const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
                return sum + (isIncome ? t.amount : -t.amount);
              }, 0);
              return (
                <div key={month} className="overflow-hidden rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleMonth(month)}
                    className="flex w-full items-center justify-between bg-white/[0.03] px-3 py-2 font-mono text-xs"
                  >
                    <span className="text-foreground/90">
                      {month} <span className="text-muted-foreground">({items.length}件)</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {/* 家計全体の収支ではなく、この月に記録した取引だけの差額であることを明示する
                          (収入をまだ記録していない月だと大きなマイナスに見え、赤字と誤解されやすいため)。 */}
                      <span className="text-muted-foreground">記録収支</span>
                      <span className={netYen >= 0 ? "gold-text" : "text-destructive"}>{formatYen(netYen)}</span>
                      <span className="text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full font-mono text-xs">
                        <thead>
                          <tr className="border-b border-t border-white/10 text-muted-foreground">
                            <th className="px-3 py-2 text-left font-normal">日付</th>
                            <th className="px-3 py-2 text-left font-normal">カテゴリ</th>
                            <th className="px-3 py-2 text-right font-normal">金額</th>
                            <th className="px-3 py-2 text-left font-normal">メモ</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {sortTransactionsForDisplay(items, sortOrder).map((t) => {
                            const isIncome = categories.find((c) => c.id === t.categoryId)?.kind === "income";
                            if (editingId === t.id) {
                              const editValue = Number(editAmount);
                              const editInvalid =
                                !editCategoryId || !Number.isFinite(editValue) || editValue <= 0 || !editDate;
                              return (
                                <tr key={t.id} className="border-b border-white/5 bg-white/[0.03] last:border-0">
                                  <td colSpan={5} className="space-y-2 px-3 py-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="date"
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        className={inputClass}
                                        aria-label="日付を編集"
                                      />
                                      <select
                                        value={editCategoryId}
                                        onChange={(e) => setEditCategoryId(e.target.value)}
                                        className={inputClass}
                                        aria-label="カテゴリを編集"
                                      >
                                        {/* 収支の分類を間違えて登録していた場合にも編集画面から直せるよう、
                                            支出/収入を問わず全カテゴリを選べるようにする(optgroupで分けて表示)。 */}
                                        <optgroup label="支出">
                                          {expenseCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                              {c.label}
                                            </option>
                                          ))}
                                        </optgroup>
                                        <optgroup label="収入">
                                          {incomeCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                              {c.label}
                                            </option>
                                          ))}
                                        </optgroup>
                                      </select>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        placeholder="金額(円)"
                                        className={inputClass}
                                        aria-label="金額を編集"
                                      />
                                      <input
                                        type="text"
                                        value={editMemo}
                                        onChange={(e) => setEditMemo(e.target.value)}
                                        placeholder="メモ(任意)"
                                        className={inputClass}
                                        aria-label="メモを編集"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        className="flex-1"
                                        onClick={() => saveEdit(t.id)}
                                        disabled={editInvalid}
                                      >
                                        保存
                                      </Button>
                                      <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="flex-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/5"
                                      >
                                        キャンセル
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            return (
                              <tr key={t.id} className="border-b border-white/5 last:border-0">
                                <td className="px-3 py-2">{t.date}</td>
                                <td className="px-3 py-2">{categoryLabelById.get(t.categoryId) ?? "-"}</td>
                                <td className={`px-3 py-2 text-right ${isIncome ? "neon-text" : "neon-text-pink"}`}>
                                  {isIncome ? "+" : "-"}
                                  {formatYen(t.amount)}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{t.memo || "-"}</td>
                                <td className="px-3 py-2 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(t)}
                                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                                    aria-label="編集"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWithConfirm(t.id)}
                                    className={deleteButtonClass}
                                    aria-label="削除"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
