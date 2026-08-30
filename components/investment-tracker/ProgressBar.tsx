"use client";

import { useState } from "react";

export function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100);
  const achieved = ratio >= 1;
  const [trophyOk, setTrophyOk] = useState(true);

  return (
    <div className="space-y-1.5">
      <div className="relative h-4 w-full overflow-hidden rounded-full border border-white/15 bg-white/5">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
            achieved
              ? "bg-gradient-to-r from-[#FFD700] via-[#fff7cc] to-[#FFD700]"
              : "bg-gradient-to-r from-[oklch(0.85_0.22_195)] to-[oklch(0.85_0.22_330)]"
          }`}
          style={{
            width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`,
            boxShadow: achieved
              ? "0 0 12px rgba(255,215,0,0.7)"
              : "0 0 10px oklch(0.85 0.22 195 / 60%)",
          }}
        />
      </div>
      <div className="flex items-center justify-between font-mono text-xs">
        <span className={achieved ? "gold-text font-bold" : "text-muted-foreground"}>
          {achieved ? "🏆 目標達成！" : `達成率 ${pct}%`}
        </span>
        {achieved && trophyOk && (
          <img
            src="/tools/investment-tracker/trophy.png"
            alt=""
            className="h-6 w-6 luna-glow-pulse"
            onError={() => setTrophyOk(false)}
          />
        )}
      </div>
    </div>
  );
}
