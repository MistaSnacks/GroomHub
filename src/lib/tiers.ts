// Tier-based feature limits. During beta, all claimed owners get premium access.
export const BETA_MODE = true;

export const TIER_LIMITS = {
  free: { photos: 3, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  standard: { photos: 10, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  featured: { photos: 50, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  premium: { photos: 50, logo: true, services: true, specialties: true, hours: true, contactForm: true },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function getLimits(tier: string | null | undefined) {
  if (BETA_MODE) return TIER_LIMITS.premium;
  return TIER_LIMITS[(tier as TierName) ?? "free"] ?? TIER_LIMITS.free;
}
