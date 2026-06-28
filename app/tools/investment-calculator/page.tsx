"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatMan(n: number, decimals = 0) {
  if (!Number.isFinite(n)) return "-";
  const man = n / 10000;
  return `${man.toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}万円`;
}

function formatYearsMonths(totalMonths: number) {
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m}ヶ月`;
  if (m === 0) return `${y}年`;
  return `${y}年${m}ヶ月`;
}

type Mode = "fromGoal" | "fromMonthly" | "coastFire";

export default function InvestmentCalculatorPage() {
  const [mode, setMode] = useState<Mode>("fromGoal");

  // 「目標額から逆算」モード(単位: 万円)
  const [goalMan, setGoalMan] = useState("1000");
  const [years, setYears] = useState("20");
  const [annualRate, setAnnualRate] = useState("4");
  const [currentAssetsMan, setCurrentAssetsMan] = useState("0");

  // 「積立額から将来額を計算」モード(単位: 万円)
  const [monthlyMan, setMonthlyMan] = useState("3");
  const [years2, setYears2] = useState("20");
  const [annualRate2, setAnnualRate2] = useState("4");
  const [currentAssetsMan2, setCurrentAssetsMan2] = useState("0");

  // 「コーストFIRE」モード(単位: 万円)
  const [currentAge, setCurrentAge] = useState("25");
  const [retireAge, setRetireAge] = useState("60");
  const [coastFinalGoalMan, setCoastFinalGoalMan] = useState("10000");
  const [coastCurrentAssetsMan, setCoastCurrentAssetsMan] = useState("1000");
  const [investYears, setInvestYears] = useState("10");
  const [coastAnnualRate, setCoastAnnualRate] = useState("4");

  const resultFromGoal = useMemo(() => {
    const goalNum = Number(goalMan) * 10000;
    const yearsNum = Number(years);
    const rateNum = Number(annualRate);
    const currentAssetsNum = (Number(currentAssetsMan) || 0) * 10000;

    if (!Number.isFinite(goalNum) || goalNum <= 0) return null;
    if (!Number.isFinite(yearsNum) || yearsNum <= 0) return null;
    if (!Number.isFinite(rateNum) || rateNum < 0) return null;
    if (!Number.isFinite(currentAssetsNum) || currentAssetsNum < 0) return null;

    const months = Math.round(yearsNum * 12);
    const monthlyRate = rateNum / 100 / 12;

    const futureValueOfCurrentAssets = currentAssetsNum * Math.pow(1 + monthlyRate, months);
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
      alreadyAchievable: remainingGoal === 0,
    };
  }, [goalMan, years, annualRate, currentAssetsMan]);

  const resultFromMonthly = useMemo(() => {
    const monthlyNum = Number(monthlyMan) * 10000;
    const yearsNum = Number(years2);
    const rateNum = Number(annualRate2);
    const currentAssetsNum = (Number(currentAssetsMan2) || 0) * 10000;

    if (!Number.isFinite(monthlyNum) || monthlyNum < 0) return null;
    if (!Number.isFinite(yearsNum) || yearsNum <= 0) return null;
    if (!Number.isFinite(rateNum) || rateNum < 0) return null;
    if (!Number.isFinite(currentAssetsNum) || currentAssetsNum < 0) return null;

    const months = Math.round(yearsNum * 12);
    const monthlyRate = rateNum / 100 / 12;

    const futureValueOfCurrentAssets = currentAssetsNum * Math.pow(1 + monthlyRate, months);
    const futureValueOfContributions =
      monthlyRate === 0
        ? monthlyNum * months
        : (monthlyNum * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate;

    const totalFutureValue = futureValueOfCurrentAssets + futureValueOfContributions;
    const totalContribution = monthlyNum * months;
    const totalInterest = totalFutureValue - totalContribution - currentAssetsNum;

    return {
      totalFutureValue,
      totalContribution,
      totalInterest,
      months,
    };
  }, [monthlyMan, years2, annualRate2, currentAssetsMan2]);

  const resultCoastFire = useMemo(() => {
    const currentAgeNum = Number(currentAge);
    const retireAgeNum = Number(retireAge);
    const finalGoalNum = Number(coastFinalGoalMan) * 10000;
    const currentAssetsNum = (Number(coastCurrentAssetsMan) || 0) * 10000;
    const investYearsNum = Number(investYears);
    const rateNum = Number(coastAnnualRate);

    if (!Number.isFinite(currentAgeNum) || currentAgeNum <= 0) return null;
    if (!Number.isFinite(retireAgeNum) || retireAgeNum <= currentAgeNum) return null;
    if (!Number.isFinite(finalGoalNum) || finalGoalNum <= 0) return null;
    if (!Number.isFinite(currentAssetsNum) || currentAssetsNum < 0) return null;
    if (!Number.isFinite(investYearsNum) || investYearsNum <= 0) return null;
    if (!Number.isFinite(rateNum) || rateNum < 0) return null;

    const totalYears = retireAgeNum - currentAgeNum;
    if (investYearsNum > totalYears) return null; // 投資期間がリタイアまでの期間を超えている

    const coastYears = totalYears - investYearsNum;
    const investMonths = Math.round(investYearsNum * 12);
    const coastMonths = Math.round(coastYears * 12);
    const monthlyRate = rateNum / 100 / 12;

    // コースト開始時点(投資をやめる年齢)で必要な資産額を、最終目標額から逆算
    const coastTargetAmount =
      monthlyRate === 0 ? finalGoalNum : finalGoalNum / Math.pow(1 + monthlyRate, coastMonths);

    // その必要額に対し、現在資産+今後の積立でどれだけ毎月積み立てればいいか
    const futureValueOfCurrentAssets = currentAssetsNum * Math.pow(1 + monthlyRate, investMonths);
    const remaining = Math.max(0, coastTargetAmount - futureValueOfCurrentAssets);
    const monthlyPayment =
      remaining === 0
        ? 0
        : monthlyRate === 0
          ? remaining / investMonths
          : (remaining * monthlyRate) / (Math.pow(1 + monthlyRate, investMonths) - 1);

    const totalContribution = monthlyPayment * investMonths;

    return {
      coastAge: currentAgeNum + investYearsNum,
      coastTargetAmount,
      monthlyPayment,
      totalContribution,
      coastYears,
      alreadyAchievable: remaining === 0,
    };
  }, [currentAge, retireAge, coastFinalGoalMan, coastCurrentAssetsMan, investYears, coastAnnualRate]);

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
          <p className="text-muted-foreground">複利での積立計算を2つの方法でシミュレーションできます。</p>
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-sm justify-center">
          <button
            type="button"
            onClick={() => setMode("fromGoal")}
            className={`rounded-full px-4 py-2 ${
              mode === "fromGoal"
                ? "neon-border neon-text"
                : "border border-white/15 text-muted-foreground"
            }`}
          >
            目標額から逆算
          </button>
          <button
            type="button"
            onClick={() => setMode("fromMonthly")}
            className={`rounded-full px-4 py-2 ${
              mode === "fromMonthly"
                ? "neon-border neon-text"
                : "border border-white/15 text-muted-foreground"
            }`}
          >
            積立額から将来額を計算
          </button>
          <button
            type="button"
            onClick={() => setMode("coastFire")}
            className={`rounded-full px-4 py-2 ${
              mode === "coastFire"
                ? "neon-border-pink neon-text-pink"
                : "border border-white/15 text-muted-foreground"
            }`}
          >
            コーストFIRE
          </button>
        </div>

        {mode === "fromGoal" && (
          <>
            <p className="text-center text-muted-foreground text-sm">
              目標額・期間・年利を入れると、毎月いくら積み立てればいいかを計算します。
            </p>

            <Card className="neon-border bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-mono text-base">条件を入力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">目標額(万円)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={goalMan}
                    onChange={(e) => setGoalMan(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">
                    現時点での自分の資産(万円)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={currentAssetsMan}
                    onChange={(e) => setCurrentAssetsMan(e.target.value)}
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
                {resultFromGoal ? (
                  <div className="space-y-3 font-mono">
                    {resultFromGoal.alreadyAchievable && (
                      <p className="text-xs neon-text">
                        現在の資産だけで目標額に到達できそうです🎉(追加の積立は0円で計算しています)
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">毎月の積立額</span>
                      <span className="neon-text-pink text-2xl font-bold">
                        {formatMan(resultFromGoal.monthlyPayment, 1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">積立期間</span>
                      <span>{formatYearsMonths(resultFromGoal.months)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">自分で積み立てる総額</span>
                      <span>{formatMan(resultFromGoal.totalContribution)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">運用で増える分(複利の効果)</span>
                      <span className="neon-text">{formatMan(resultFromGoal.totalInterest)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    目標額・年数・年利を正しく入力してください。
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {mode === "fromMonthly" && (
          <>
            <p className="text-center text-muted-foreground text-sm">
              毎月の積立額・年利・期間を入れると、将来いくらになるかを計算します。
            </p>

            <Card className="neon-border bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-mono text-base">条件を入力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">毎月の積立額(万円)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={monthlyMan}
                    onChange={(e) => setMonthlyMan(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">
                    現時点での自分の資産(万円)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={currentAssetsMan2}
                    onChange={(e) => setCurrentAssetsMan2(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">何年間積み立てるか</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={years2}
                    onChange={(e) => setYears2(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">想定年利(%)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={annualRate2}
                    onChange={(e) => setAnnualRate2(e.target.value)}
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
                {resultFromMonthly ? (
                  <div className="space-y-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">将来の資産額</span>
                      <span className="neon-text-pink text-2xl font-bold">
                        {formatMan(resultFromMonthly.totalFutureValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">積立期間</span>
                      <span>{formatYearsMonths(resultFromMonthly.months)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">自分で積み立てる総額</span>
                      <span>{formatMan(resultFromMonthly.totalContribution)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">運用で増える分(複利の効果)</span>
                      <span className="neon-text">{formatMan(resultFromMonthly.totalInterest)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    積立額・年数・年利を正しく入力してください。
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {mode === "coastFire" && (
          <>
            <p className="text-center text-muted-foreground text-sm">
              「あと何年だけ積極的に積み立てて、その後は追加投資せず複利だけで目標に到達する」コーストFIREの計算です。
            </p>

            <Card className="neon-border bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-mono text-base">条件を入力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">現在の年齢</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">
                    最終的に目標額に到達したい年齢
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={retireAge}
                    onChange={(e) => setRetireAge(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">最終的に欲しい金額(万円)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={coastFinalGoalMan}
                    onChange={(e) => setCoastFinalGoalMan(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">
                    現時点での自分の資産(万円)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={coastCurrentAssetsMan}
                    onChange={(e) => setCoastCurrentAssetsMan(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">
                    あと何年間、毎月同じ額を投資するか
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={investYears}
                    onChange={(e) => setInvestYears(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.85_0.22_195)]"
                  />
                  <p className="text-xs text-muted-foreground">
                    この期間が終わったら追加投資はやめて、複利運用だけで目標到達を目指します。
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground font-mono">想定年利(%)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={coastAnnualRate}
                    onChange={(e) => setCoastAnnualRate(e.target.value)}
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
                {resultCoastFire ? (
                  <div className="space-y-3 font-mono">
                    {resultCoastFire.alreadyAchievable && (
                      <p className="text-xs neon-text">
                        現在の資産だけで到達できそうです🎉(追加の積立は0円で計算しています)
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">毎月の積立額</span>
                      <span className="neon-text-pink text-2xl font-bold">
                        {formatMan(resultCoastFire.monthlyPayment, 1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">投資をやめる年齢</span>
                      <span>{resultCoastFire.coastAge}歳</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        その時点で必要な資産額(コースト目標額)
                      </span>
                      <span>{formatMan(resultCoastFire.coastTargetAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">自分で積み立てる総額</span>
                      <span>{formatMan(resultCoastFire.totalContribution)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">その後、追加投資なしで運用する期間</span>
                      <span>{resultCoastFire.coastYears}年</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    年齢・目標額・投資期間を正しく入力してください(投資期間はリタイアまでの年数以下にしてください)。
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ※ 毎月一定額を積み立て、月単位で複利運用した場合の概算です。実際の運用成果は市場の変動により異なります。
        </p>
      </main>
    </div>
  );
}
