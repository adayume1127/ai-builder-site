"use client";

import { useState } from "react";

type Variant = "watch" | "cheer" | "celebrate";

const IMAGE_BY_VARIANT: Record<Variant, string> = {
  watch: "/tools/investment-tracker/luna-watch.png",
  cheer: "/tools/investment-tracker/luna-cheer.png",
  celebrate: "/tools/investment-tracker/luna-celebrate.png",
};

export function LunaCoach({ variant, message }: { variant: Variant; message: string }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="flex items-center gap-3">
      {imgOk && (
        <img
          src={IMAGE_BY_VARIANT[variant]}
          alt="ルナ"
          className={`h-16 w-16 shrink-0 object-contain ${
            variant === "celebrate" ? "luna-glow-pulse" : "luna-float"
          }`}
          onError={() => setImgOk(false)}
        />
      )}
      <div className="rounded-2xl rounded-bl-none border border-white/15 bg-white/5 px-4 py-2.5 text-sm">
        {message}
      </div>
    </div>
  );
}
