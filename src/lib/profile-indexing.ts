import keepList from "@/data/search-keep-list.json";
import { listingShowsPrices, type HarvestedPriceSet } from "@/lib/harvested-prices";
import { usableListingImages } from "@/lib/images";
import { isSponsored, type SponsorshipFields } from "@/lib/listing-rules";
import { ABOUT_FALLBACK, sanitizeProfileText } from "@/lib/profile-description";

/** Fewer characters than this is a stub, not a description. */
export const REAL_DESCRIPTION_MIN_CHARS = 80;

export type IndexReason = "has-data" | "claimed" | "sponsored" | "search-visible" | "thin";

export interface ProfileIndexing {
  index: boolean;
  reason: IndexReason;
}

export interface IndexingListing extends SponsorshipFields {
  slug: string;
  price_min?: number | null;
  description?: string | null;
  images?: string[] | null;
  owner_id?: string | null;
}

/** Profile slugs that had Google impressions in the keep list's window. See scripts/build-search-keep-list.ts. */
export const SEARCH_KEEP_SLUGS: ReadonlySet<string> = new Set(keepList.slugs);

export function hasRealDescription(description: string | null | undefined): boolean {
  const text = sanitizeProfileText(description ?? "");
  return text !== ABOUT_FALLBACK && text.length >= REAL_DESCRIPTION_MIN_CHARS;
}

/** True when the page shows a price, a real description or a usable photo. */
export function hasProfileData(listing: IndexingListing, harvested: HarvestedPriceSet | null): boolean {
  return listingShowsPrices(listing, harvested) || hasRealDescription(listing.description) || usableListingImages(listing.images).length > 0;
}

/** Whether a groomer profile belongs in Google's index and the sitemap. The one source of truth for both. */
export function profileIndexing(listing: IndexingListing, harvested: HarvestedPriceSet | null, keepSlugs: ReadonlySet<string>): ProfileIndexing {
  if (hasProfileData(listing, harvested)) return { index: true, reason: "has-data" };
  if (listing.owner_id) return { index: true, reason: "claimed" };
  if (isSponsored(listing)) return { index: true, reason: "sponsored" };
  if (keepSlugs.has(listing.slug)) return { index: true, reason: "search-visible" };
  return { index: false, reason: "thin" };
}
