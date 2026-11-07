import type { PricingTier } from "./types";
import { BETA_MODE, TIER_LIMITS } from "./tiers";

// One public offer since 2026-11-06: the Free listing. Sponsored (DB slug "premium")
// is closed to new businesses; the comped seats keep their label. "basic" remains a
// valid DB tier for compatibility but is not sold.
/** Shown wherever Sponsored used to be sold. Sponsored is closed to new businesses (plan of 2026-11-06). */
export const SPONSORED_CLOSED_LINE = "Sponsored spots are not open to new businesses right now.";

/** Human name for a stored tier slug ("premium" is sold as "Sponsored"). */
export function tierDisplayName(slug: string | null | undefined): string {
  const found = pricingTiers.find((t) => t.slug === slug);
  if (found) return found.name;
  if (slug === "basic") return "Free";
  return "Free";
}

// The Sponsored entry stays for tierDisplayName() and the admin console's revenue math. It is not offered anywhere public.
export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    annualPrice: 0,
    description: "Everything a pet parent needs to find and contact you. Free for as long as you are listed.",
    features: [
      { text: "Full business listing: name, address, phone", included: true },
      { text: "Website link, booking link & business hours", included: true },
      { text: "Services, specialties & pricing on your profile", included: true },
      { text: BETA_MODE ? `Up to ${TIER_LIMITS.free.photos} photos & your logo (${TIER_LIMITS.premium.photos} during beta)` : `Up to ${TIER_LIMITS.free.photos} photos & your logo`, included: true },
      { text: '"Owner Confirmed" badge once you claim', included: true },
      { text: "Contact form inquiries sent to your inbox", included: true },
    ],
    isPopular: true,
    ctaText: "Claim Your Listing - Free",
  },
  {
    name: "Sponsored",
    slug: "premium",
    price: 49,
    annualPrice: 41,
    description: "A clearly labeled spot at the top of your city page. Limited to 3 businesses per city.",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Sponsored spot at the top of your city page (1 of 3)", included: true },
      { text: `Up to ${TIER_LIMITS.premium.photos} photos`, included: true },
      { text: 'Always labeled "Sponsored" so pet parents can trust the list', included: true },
      { text: "Month to month. Cancel anytime, keep your free listing", included: true },
    ],
    isPopular: false,
    ctaText: "Reserve a Sponsored Spot",
  },
];

export const freePlan: PricingTier = pricingTiers.find((t) => t.slug === "free")!;
