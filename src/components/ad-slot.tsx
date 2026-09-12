interface AdSlotProps {
  /** Slot identifier for ad network targeting */
  slot?: string;
  /** Visual format */
  format?: "inline" | "sidebar" | "leaderboard" | "banner";
  className?: string;
}

const FORMAT_STYLES: Record<string, string> = {
  inline: "w-full min-h-[100px]",
  sidebar: "w-full min-h-[250px]",
  leaderboard: "w-full min-h-[90px] max-w-[728px] mx-auto",
  banner: "w-full min-h-[60px]",
};

/**
 * Display ads are hidden until traffic justifies them (decision: grill-me ad-slots-strategy.md).
 * Set NEXT_PUBLIC_SHOW_ADS=true to render placeholders / ad units again.
 */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_SHOW_ADS === "true";

export function AdSlot({ slot = "default", format = "inline", className = "" }: AdSlotProps) {
  if (!ADS_ENABLED) return null;
  return (
    <div
      data-ad-slot={slot}
      data-ad-format={format}
      className={`rounded-xl border border-dashed border-border/40 bg-surface/30 flex items-center justify-center text-[10px] text-text-muted/30 select-none ${FORMAT_STYLES[format]} ${className}`}
    >
      Sponsored
    </div>
  );
}
