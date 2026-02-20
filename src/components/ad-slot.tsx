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

export function AdSlot({ slot = "default", format = "inline", className = "" }: AdSlotProps) {
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
