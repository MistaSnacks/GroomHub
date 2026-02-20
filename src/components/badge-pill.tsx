import type { Badge } from "@/lib/types";
import { Trophy, SealCheck, Star, Leaf, Heart, Van } from "@phosphor-icons/react/dist/ssr";

const badgeConfig: Record<
  Badge,
  { label: React.ReactNode; className: string }
> = {
  "best-in-show": {
    label: <><Trophy weight="fill" className="w-3.5 h-3.5 text-[#FBC02D] shrink-0" /> Best in Show</>,
    className: "badge-best font-semibold text-brand-primary flex items-center gap-1",
  },
  "paw-verified": {
    label: <><SealCheck weight="fill" className="w-3.5 h-3.5 text-brand-accent shrink-0" /> Paw-Verified</>,
    className: "badge-verified font-semibold flex items-center gap-1",
  },
  "top-rated": {
    label: <><Star weight="fill" className="w-3.5 h-3.5 text-[#FBC02D] shrink-0" /> Top Rated</>,
    className: "badge-verified font-semibold text-brand-primary flex items-center gap-1",
  },
  // Mapping the old badges to new styles or ignoring
  "eco-friendly": {
    label: <><Leaf weight="fill" className="w-3 h-3 shrink-0" /> Eco-Friendly</>,
    className: "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]",
  },
  "fear-free": {
    label: <><Heart weight="fill" className="w-3 h-3 shrink-0" /> Fear-Free</>,
    className: "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#FCE4EC] text-[#C2185B] border border-[#F48FB1]",
  },
  "mobile-ready": {
    label: <><Van weight="fill" className="w-3 h-3 shrink-0" /> Mobile</>,
    className: "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-brand-accent/20 text-brand-primary border border-brand-accent/30",
  },
};

interface BadgePillProps {
  badge: Badge;
  size?: "sm" | "md";
}

export function BadgePill({ badge }: BadgePillProps) {
  const config = badgeConfig[badge];
  if (!config) return null;

  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
}
