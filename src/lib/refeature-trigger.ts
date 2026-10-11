import { createAdminClient } from "@/lib/supabase/admin";
import { isSponsored } from "@/lib/listing-rules";

/**
 * Re-feature trigger for the house listing (the founder-related salon).
 *
 * Rules agreed 2026-09-04 (see grill-me-v1-takeaways/own-listing-restraint.md):
 *  1. The house listing may only take a Sponsored seat on the same terms as any
 *     sponsor: same price, actually recorded, same "Sponsored" label.
 *  2. Trigger: at least CLAIMED_TARGET other claimed listings AND at least
 *     SPONSORS_TARGET paying sponsors elsewhere on the site.
 *  3. Never take a seat in a city where a paying sponsor is waitlisted (manual check).
 *
 * The house listing's slug lives only in the HOUSE_LISTING_SLUG env var so the
 * relationship is not written into the repo or the database schema.
 */
export const CLAIMED_TARGET = 10;
export const SPONSORS_TARGET = 3;

export interface RefeatureTriggerStatus {
  configured: boolean;
  otherClaimed: number;
  claimedTarget: number;
  payingSponsors: number;
  sponsorsTarget: number;
  houseCurrentlySponsored: boolean;
  houseCity: string | null;
  met: boolean;
  checkedAt: string;
  /** Set when a count query failed; the other numbers are then meaningless. */
  error: string | null;
}

export async function getRefeatureTriggerStatus(): Promise<RefeatureTriggerStatus> {
  const slug = process.env.HOUSE_LISTING_SLUG?.trim() || null;
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const [claimedRes, payingRes, houseRes] = await Promise.all([
    admin
      .from("business_listings")
      .select("id", { count: "exact", head: true })
      .not("owner_id", "is", null)
      .neq("slug", slug ?? "__none__"),
    admin
      .from("business_listings")
      .select("id", { count: "exact", head: true })
      .gt("sponsor_paid_until", nowIso)
      // Free promotional spots carry an end date too, but nobody paid for them.
      .eq("sponsor_comp", false)
      .neq("slug", slug ?? "__none__"),
    slug
      ? admin
          .from("business_listings")
          .select("subscription_tier, is_featured, sponsor_paid_until, city, state")
          .eq("slug", slug)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const queryError = claimedRes.error?.message ?? payingRes.error?.message ?? houseRes.error?.message ?? null;
  const otherClaimed = claimedRes.count ?? 0;
  const payingSponsors = payingRes.count ?? 0;
  const house = houseRes.data as
    | { subscription_tier: string | null; is_featured: boolean | null; sponsor_paid_until: string | null; city: string | null; state: string | null }
    | null;

  const houseCurrentlySponsored = !!house && isSponsored(house);
  const configured = !!slug && !!house && !queryError;
  const met =
    configured &&
    !houseCurrentlySponsored &&
    otherClaimed >= CLAIMED_TARGET &&
    payingSponsors >= SPONSORS_TARGET;

  return {
    configured,
    error: queryError,
    otherClaimed,
    claimedTarget: CLAIMED_TARGET,
    payingSponsors,
    sponsorsTarget: SPONSORS_TARGET,
    houseCurrentlySponsored,
    houseCity: house?.city ? `${house.city}, ${house.state ?? ""}`.trim().replace(/,$/, "") : null,
    met,
    checkedAt: nowIso,
  };
}
