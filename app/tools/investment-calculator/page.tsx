"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatYen(n: number) {
  if (!Number.isFinite(n)) return "-";
  return `¥${Math.round(n).toLocaleString()}`;
}

function formatYearsMonths(totalMonths: number) {
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m}ヶ月`;
  if (m === 0) return `${y}年`;
  return `${y}年${m}ヶ月`;
}

export default function InvestmentCalculatorPage() {
  const [goal, setGoal] = useState("10000000");
  const [years, setYears] = useState("20");
  const [annualRate, setAnnualRate] = useState("4");
  const [currentAssets, setCurrentAssets] = useState("0");

  const result = useMemo(() => {
    const goalNum = Number(goal);
    const yearsNum = Number(years);
    const rateNum = Number(annualRate);
    const currentAssetsNum = Number(currentAssets) || 0;

    if (!Number.isFinite(goalNum) || goalNum <= 0) return null;
    if (!Number.isFinite(yearsNum) || yearsNum <= 0) return null;
    if (!Number.isFinite(rateNum) || rateNum < 0) return null;
    if (!Number.isFinite(currentAssetsNum) || currentAssetsNum < 0) return null;

    const months = Math.round(yearsNum * 12);
    const monthlyRate = rateNum / 100 / 12;

    const futureValueOfCurrentAssets =
      currentAssetsNum * Math.pow(1 + monthlyRate, months);
    const remainingGoal = Math.max(0, goalNum - futureValueOfCurrentAssets);

    const monthlyPayment =
      remainingGoal === 0
        ? 0
        : monthlyRate === 0
          ? remainingGoal / months
          : (remainingGoal * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);

    const totalContribution = monthlyPayment * months;
    const totalInterest = goalNum - totalContribution - currentAssetsNum;

    return {
      monthlyPayment,
      totalContribution,
      totalInterest,
      months,
      futureValueOfCurrentAssets,
      alreadyAchievable: remainingGoal === 0,
    };
  }, [goal, years, annualRate, currentAssets]);

  return (
    <div className="flex flex-col flex-1">
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8">
        <p className="text-sm text-muted-foreground font-mono">
          <Link href="/" className="neon-text-pink underline">
            ← ホームに戻る
          </Link>
        </p>

        <div className="text-center space-y-3">
          <h1 className="neon-text text-3xl font-bold tracking-tight font-mono">
            積立シミュレーター
          </h1>
          <p className="text-muted-foreground">
            目標額・期間・年利を入れると、毎月いくら積み立てればいいかを複利で計算します。
          </p>
        </div>

        <Card className="neon-border bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-mono text-base">条件を入力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground font-mono">目標額(円)</label>
              <input
                type="number"
                inputMode="numeric"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground font-mono">現時点での自分の資産(円)</label>
              <input
                type="number"
                inputMode="numeric"
                value={currentAssets}
                onChange={(e) => setCurrentAssets(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
              />
              <p className="text-xs text-muted-foreground">
                すでに貯蓄・投資している分があれば入力してください(無ければ0でOK)。
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground font-mono">何年後に到達したいか</label>
              <input
                type="number"
                inputMode="numeric"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground font-mono">想定年利(%)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
              />
              <p className="text-xs text-muted-foreground">デフォルトは4%。自由に変更できます。</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-border-pink bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-mono text-base neon-text-pink">計算結果</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-3 font-mono">
                {result.alreadyAchievable && (
                  <p className="text-xs neon-text">
                    現在の資産だけで目標額に到達できそうです🎉(追加の積立は0円で計算しています)
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">毎月の積立額</span>
                  <span className="neon-text-pink text-2xl font-bold">
                    {formatYen(result.monthlyPayment)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">積立期間</span>
                  <span>{formatYearsMonths(result.months)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">自分で積み立てる総額</span>
                  <span>{formatYen(result.totalContribution)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">運用で増える分(複利の効果)</span>
                  <span className="neon-text">{formatYen(result.totalInterest)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                目標額・年数・年利を正しく入力してください。
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ※ 毎月一定額を積み立て、月単位で複利運用した場合の概算です。実際の運用成果は市場の変動により異なります。
        </p>
      </main>
    </div>
  );
}
