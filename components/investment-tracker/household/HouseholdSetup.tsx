"use client";

import { useState } from "react";
import { LunaCoach } from "../LunaCoach";
import { IncomeStep } from "./IncomeStep";
import { FixedExpenseStep } from "./FixedExpenseStep";
import { LivingExpenseStep } from "./LivingExpenseStep";
import { SavingsStep } from "./SavingsStep";
import { GoalStep } from "./GoalStep";
import { SpecialExpenseSetup } from "./SpecialExpenseSetup";
import {
  createEmptyHouseholdProfile,
  totalIncome,
  type HouseholdProfile,
  type SpecialExpense,
  type SpecialExpenseMode,
} from "@/lib/householdDiagnosis";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "収入",
  2: "固定費",
  3: "生活費",
  4: "貯金・投資",
  5: "貯金目標",
  6: "年間特別費",
};

export function HouseholdSetup({
  mode = "create",
  initialStep = 1,
  initialProfile,
  initialSpecialExpenses,
  initialSpecialExpenseMode,
  currentCashBalanceYen,
  onComplete,
  onCancel,
}: {
  mode?: "create" | "edit";
  // ウィザードの表示開始ステップ(既定1)。「診断を見直す」からの通常導線は1のまま、
  // 「目標だけ編集したい」といった特定ステップへのショートカット導線から使う。
  // STEP1〜4を無効化するわけではなく、あくまで表示開始位置を変えるだけ(「戻る」で
  // それ以前のステップにも移動できる)。profile全体は下のuseState初期化時に一括ロード
  // されるため、未訪問のステップがあってもその項目の値が消えたり空になったりしない。
  // 想定用途はmode="edit"(再診断)のショートカットのみ。mode="create"(初回診断)は
  // profileが空のため、途中ステップから始めると前のステップの項目が未入力のまま
  // 進んでしまう。1以外を渡すのはedit時に限ること。
  initialStep?: WizardStep;
  initialProfile?: HouseholdProfile;
  initialSpecialExpenses?: SpecialExpense[];
  initialSpecialExpenseMode?: SpecialExpenseMode;
  // edit時のみ使用。「現在の現金貯金」欄の初期値を資産タブの預金残高(実績ベース)で上書きする。
  // ユーザーは表示された値を手動で上書きできる。
  currentCashBalanceYen?: number;
  onComplete: (profile: HouseholdProfile, specialExpenses: SpecialExpense[], specialExpenseMode: SpecialExpenseMode) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [profile, setProfile] = useState<HouseholdProfile>(() => {
    if (mode === "edit" && initialProfile) {
      const savings =
        currentCashBalanceYen !== undefined
          ? { ...initialProfile.savings, cashSavingsBalance: Math.max(0, currentCashBalanceYen) }
          : initialProfile.savings;
      return { ...initialProfile, savings };
    }
    return createEmptyHouseholdProfile();
  });
  const [specialExpenses, setSpecialExpenses] = useState<SpecialExpense[]>(
    mode === "edit" ? (initialSpecialExpenses ?? []) : []
  );
  const [specialExpenseMode, setSpecialExpenseMode] = useState<SpecialExpenseMode>(
    mode === "edit" ? (initialSpecialExpenseMode ?? "unknown") : "unknown"
  );

  const coachMessage: Record<WizardStep, string> = {
    1:
      mode === "edit"
        ? "収入に変わったところがあれば教えてね。前回と同じなら、そのまま次へ進んでOKだよ。"
        : "はじめまして！まずはあなたの収入を教えてね。難しく考えなくて大丈夫だよ。",
    2: "次は毎月かかる固定費を教えてね。分からない項目は0円のままでOK。",
    3: "生活費はどのくらい把握してる？分からなくても診断は進められるから安心してね。",
    4: "今の貯金や投資の状況を教えてね。",
    5: "目指したい目標があれば教えてね。なければ「特に決まっていない」でOK。",
    6: "最後に、旅行や車検などたまに出ていく特別費について教えてね。",
  };

  function handleFinish(mode: SpecialExpenseMode, items: SpecialExpense[]) {
    const now = new Date().toISOString();
    const finalProfile: HouseholdProfile = {
      ...profile,
      confidence: {
        ...profile.confidence,
        specialExpenses: mode === "known" ? "confirmed" : mode === "partial" ? "estimated" : "unknown",
      },
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };
    onComplete(finalProfile, items, mode);
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="neon-text text-xl font-bold font-mono">{mode === "edit" ? "家計診断を見直す" : "家計診断"}</h2>
        <p className="font-mono text-xs text-muted-foreground">
          STEP {step}/6 — {STEP_LABELS[step]}
        </p>
        {mode === "edit" && onCancel && (
          <button type="button" onClick={onCancel} className="font-mono text-xs text-muted-foreground underline">
            見直しをやめる
          </button>
        )}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[oklch(0.85_0.22_195)] to-[oklch(0.85_0.22_330)] transition-[width] duration-500"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      <LunaCoach variant="watch" message={coachMessage[step]} />

      {step === 1 && (
        <IncomeStep
          value={profile.income}
          mode={mode}
          onNext={(income) => {
            setProfile((p) => ({
              ...p,
              income,
              confidence: { ...p.confidence, income: income.monthlyTakeHome > 0 ? "confirmed" : "unknown" },
            }));
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <FixedExpenseStep
          value={profile.fixedExpenses}
          income={totalIncome(profile)}
          onBack={() => setStep(1)}
          onNext={(fixedExpenses) => {
            setProfile((p) => ({ ...p, fixedExpenses, confidence: { ...p.confidence, fixedExpenses: "confirmed" } }));
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <LivingExpenseStep
          mode={profile.livingExpenseMode}
          value={profile.baselineVariableExpenses}
          income={totalIncome(profile)}
          onBack={() => setStep(2)}
          onNext={(mode, expenses, confidence) => {
            setProfile((p) => ({
              ...p,
              livingExpenseMode: mode,
              baselineVariableExpenses: expenses,
              confidence: { ...p.confidence, livingExpenses: confidence },
            }));
            setStep(4);
          }}
        />
      )}

      {step === 4 && (
        <SavingsStep
          value={profile.savings}
          emergencyFundMonths={profile.emergencyFundMonths}
          onBack={() => setStep(3)}
          onNext={(savings, emergencyFundMonths) => {
            setProfile((p) => ({ ...p, savings, emergencyFundMonths }));
            setStep(5);
          }}
        />
      )}

      {step === 5 && (
        <GoalStep
          value={profile.goal}
          currentCashSavingsYen={profile.savings.cashSavingsBalance}
          onBack={() => setStep(4)}
          onNext={(goal) => {
            setProfile((p) => ({ ...p, goal }));
            setStep(6);
          }}
        />
      )}

      {step === 6 && (
        <SpecialExpenseSetup
          mode={specialExpenseMode}
          items={specialExpenses}
          onBack={() => setStep(5)}
          onFinish={(mode, items) => {
            setSpecialExpenseMode(mode);
            setSpecialExpenses(items);
            handleFinish(mode, items);
          }}
        />
      )}
    </div>
  );
}
