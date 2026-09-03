"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";

interface StatusBannerProps {
  variant: "error" | "success";
  message: string;
}

export function StatusBanner({ variant, message }: StatusBannerProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const styles =
    variant === "error"
      ? "text-[#C2185B] bg-[#FCE4EC] border-[#F48FB1]"
      : "text-brand-primary bg-brand-secondary/10 border-brand-secondary/30";

  return (
    <div className={`flex items-start justify-between gap-3 p-3 text-sm rounded-xl border ${styles}`}>
      <p>{message}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
      >
        <X weight="bold" className="w-4 h-4" />
      </button>
    </div>
  );
}
