"use client";

import { useState } from "react";

export type TabKey = "home" | "quest" | "achievements";

const TABS: { key: TabKey; label: string; icon: string; emoji: string }[] = [
  { key: "home", label: "ホーム", icon: "/tools/investment-tracker/nav-home.png", emoji: "🏠" },
  { key: "quest", label: "クエスト", icon: "/tools/investment-tracker/nav-quest.png", emoji: "🗺️" },
  { key: "achievements", label: "実績", icon: "/tools/investment-tracker/nav-achievements.png", emoji: "🏆" },
];

function NavButton({
  tab,
  active,
  onClick,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  onClick: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 font-mono text-[11px] transition-transform ${
        active ? "scale-105" : "opacity-60"
      }`}
    >
      {active && (
        <span className="pointer-events-none absolute inset-x-2 top-0 h-full rounded-xl bg-[oklch(0.85_0.22_195_/_10%)]" />
      )}
      {imgOk ? (
        <img
          src={tab.icon}
          alt=""
          className={`relative h-6 w-6 object-contain ${active ? "luna-glow-pulse" : ""}`}
          onError={() => setImgOk(false)}
        />
      ) : (
        <span className="relative text-lg">{tab.emoji}</span>
      )}
      <span className={`relative ${active ? "neon-text font-bold" : "text-muted-foreground"}`}>
        {tab.label}
      </span>
    </button>
  );
}

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <nav className="flex shrink-0 border-t border-white/15 bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => (
        <NavButton key={tab.key} tab={tab} active={active === tab.key} onClick={() => onChange(tab.key)} />
      ))}
    </nav>
  );
}
