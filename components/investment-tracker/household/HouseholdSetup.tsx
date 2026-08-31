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

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "収入",
  2: "固定費",
  3: "生活費",
  4: "貯金・投資",
  5: "貯金目標",
  6: "年間特別費",
};

export function HouseholdSetup({
  onComplete,
}: {
  onComplete: (profile: HouseholdProfile, specialExpenses: SpecialExpense[], specialExpenseMode: SpecialExpenseMode) => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [profile, setProfile] = useState<HouseholdProfile>(createEmptyHouseholdProfile());
  const [specialExpenses, setSpecialExpenses] = useState<SpecialExpense[]>([]);
  const [specialExpenseMode, setSpecialExpenseMode] = useState<SpecialExpenseMode>("unknown");

  const coachMessage: Record<WizardStep, string> = {
    1: "はじめまして！まずはあなたの収入を教えてね。難しく考えなくて大丈夫だよ。",
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
        <h2 className="neon-text text-xl font-bold font-mono">家計診断</h2>
        <p className="font-mono text-xs text-muted-foreground">
          STEP {step}/6 — {STEP_LABELS[step]}
        </p>
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
