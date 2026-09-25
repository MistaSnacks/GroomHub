/**
 * Business rules about paid placement, kept in one place so ordering, labeling,
 * the featured block, the admin toggle and the re-feature cron all agree.
 *
 * Product promise (pricing page): "Sponsored businesses pay for a labeled spot at
 * the top of their city page, limited to three per city. The Sponsored label is
 * always visible. Payment never changes your badge or where you appear in the
 * regular list."
 */

export interface SponsorshipFields {
  is_featured?: boolean | null;
  sponsor_paid_until?: string | null;
}

/**
 * A listing is sponsored when the admin has placed it (`is_featured`) and any
 * recorded paid-through date has not passed. This is the only definition; the
 * legacy `subscription_tier === "premium"` check must not be used for placement
 * or labeling.
 */
export function isSponsored(listing: SponsorshipFields, now: number = Date.now()): boolean {
  if (listing.is_featured !== true) return false;
  if (!listing.sponsor_paid_until) return true;
  const paidUntil = Date.parse(listing.sponsor_paid_until);
  return Number.isNaN(paidUntil) ? true : paidUntil > now;
}

/**
 * PostgREST filter fragment for "sponsorship has not lapsed", to pair with
 * `.eq("is_featured", true)` in featured-listing queries.
 */
export function activeSponsorshipFilter(now: Date = new Date()): string {
  return `sponsor_paid_until.is.null,sponsor_paid_until.gt.${now.toISOString()}`;
}

/**
 * Order for the regular (unpaid) list: rating first, then a stable id tiebreak.
 * Deliberately ignores every payment signal.
 */
export function sortRegularList<T extends { rating?: number | null; id: string }>(listings: T[]): T[] {
  return [...listings].sort((a, b) => {
    const diff = (b.rating ?? 0) - (a.rating ?? 0);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}
