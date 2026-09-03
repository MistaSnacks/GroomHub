import { unstable_cache } from "next/cache";
import { supabase } from "./client";
import { normalizeTags } from "../tags";
import type { BusinessListing, NormalizedListing, CityWithCount } from "../types";
import { getMetroNeighbors, FEATURED_SPOTS_PER_CITY } from "../metro-clusters";

/**
 * Cache tag for the full-table reads that back search + city browse.
 * These caches are time-revalidated every 5 min (see getCachedListingRows /
 * getCities). The tag is attached so a future server action can call
 * revalidateTag(LISTINGS_CACHE_TAG) for immediate, on-demand invalidation.
 */
export const LISTINGS_CACHE_TAG = "listings";

// ─── Tag Normalization at Query Time ────────────────────
function withTags(listing: BusinessListing): NormalizedListing {
  const tags = normalizeTags({
    services: listing.services,
    specialties: listing.specialties,
    price_range: listing.price_range,
    is_paw_verified: listing.is_paw_verified,
    transparent_pricing: listing.transparent_pricing,
    walk_ins_accepted: listing.walk_ins_accepted,
    vaccination_required: listing.vaccination_required,
  });
  return { ...listing, ...tags };
}

function withTagsAll(listings: BusinessListing[]): NormalizedListing[] {
  return listings.map(withTags);
}

function hasKnownCity(listing: { city?: string | null }): boolean {
  return Boolean(listing.city && listing.city.trim() && listing.city !== "Unknown");
}

// ─── Slug Helpers ───────────────────────────────────────
// Some listings have suffixed slugs (e.g. "seattle-wa") while others
// have plain slugs ("seattle"). These helpers normalize both formats.

const STATE_SUFFIXES = ["-wa", "-or"];

/** Strip -wa / -or suffix if present: "seattle-wa" → "seattle" */
function plainSlug(slug: string): string {
  for (const suffix of STATE_SUFFIXES) {
    if (slug.endsWith(suffix)) return slug.slice(0, -suffix.length);
  }
  return slug;
}

/** Canonical city slug for URLs: strips legacy -wa / -or suffixes. */
export function canonicalCitySlug(slug: string): string {
  return plainSlug(slug);
}

/** Return both plain and suffixed variants so we catch all listings */
function slugVariants(slug: string): string[] {
  const plain = plainSlug(slug);
  return [plain, `${plain}-wa`, `${plain}-or`];
}

function citySlugVariants(slug: string, stateAbbr?: string): string[] {
  const plain = plainSlug(slug);
  if (!stateAbbr) return slugVariants(slug);
  return [plain, `${plain}-${stateAbbr.toLowerCase()}`];
}

/** Deduplicate listings that appear under multiple city_slug variants */
function dedupeBySlug(listings: NormalizedListing[]): NormalizedListing[] {
  const seen = new Set<string>();
  return listings.filter((l) => {
    if (seen.has(l.slug)) return false;
    seen.add(l.slug);
    return true;
  });
}

// ─── Hierarchy Sorting Guarantee ─────────────────────────
// This guarantees that paying users get the visibility value they paid for.
const TIER_WEIGHT = { premium: 4, featured: 3, standard: 2, free: 1 } as const;

function applyHierarchy(listings: NormalizedListing[]): NormalizedListing[] {
  return listings.sort((a, b) => {
    // 1. Sort by Subscription Tier
    const weightA = TIER_WEIGHT[a.subscription_tier as keyof typeof TIER_WEIGHT] || 0;
    const weightB = TIER_WEIGHT[b.subscription_tier as keyof typeof TIER_WEIGHT] || 0;

    if (weightA !== weightB) {
      return weightB - weightA; // Higher weight first
    }

    // 2. Tie-breaker: Rating
    return (b.rating || 0) - (a.rating || 0);
  });
}

// ─── Listing Queries ────────────────────────────────────

export async function getListingsByCity(
  citySlug: string,
  stateAbbr?: string
): Promise<NormalizedListing[]> {
  let query = supabase
    .from("business_listings")
    .select("*")
    .in("city_slug", citySlugVariants(citySlug, stateAbbr));

  if (stateAbbr) {
    query = query.eq("state", stateAbbr.toUpperCase());
  }

  const { data, error } = await query;

  if (error) {
    console.error("getListingsByCity error:", error.message);
    return [];
  }
  return applyHierarchy(
    dedupeBySlug(withTagsAll((data ?? []) as BusinessListing[]).filter(hasKnownCity))
  );
}

export async function getListingsByState(
  stateAbbr: string
): Promise<NormalizedListing[]> {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .eq("state", stateAbbr.toUpperCase());

  if (error) {
    console.error("getListingsByState error:", error.message);
    return [];
  }
  return applyHierarchy(withTagsAll((data ?? []) as BusinessListing[]).filter(hasKnownCity));
}

export async function getListingBySlug(
  slug: string
): Promise<NormalizedListing | null> {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("getListingBySlug error:", error.message);
    return null;
  }
  return withTags(data as BusinessListing);
}

async function fetchAllListingRows(): Promise<BusinessListing[]> {
  const allListings: BusinessListing[] = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("business_listings")
      .select("*")
      .order("rating", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("fetchAllListingRows error:", error.message);
      return allListings;
    }

    if (data) {
      allListings.push(...(data as BusinessListing[]));
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }

    page++;
  }

  return allListings;
}

const getCachedListingRows = unstable_cache(fetchAllListingRows, ["all-listing-rows"], {
  revalidate: 300,
  tags: [LISTINGS_CACHE_TAG],
});

export async function getListingsByServiceTag(
  serviceTag: string,
  citySlug?: string,
  stateAbbr?: string
): Promise<NormalizedListing[]> {
  let results = withTagsAll(await getCachedListingRows())
    .filter(hasKnownCity)
    .filter((l) => l.service_tags.includes(serviceTag));

  if (citySlug) {
    const variants = new Set(slugVariants(citySlug));
    results = results.filter((l) => variants.has(l.city_slug));
  }
  if (stateAbbr) {
    const state = stateAbbr.toUpperCase();
    results = results.filter((l) => l.state.toUpperCase() === state);
  }

  return applyHierarchy(results);
}

export async function getListingsBySpecialtyTag(
  specialtyTag: string,
  citySlug?: string,
  stateAbbr?: string
): Promise<NormalizedListing[]> {
  let results = withTagsAll(await getCachedListingRows())
    .filter(hasKnownCity)
    .filter((l) => l.specialty_tags.includes(specialtyTag));

  if (citySlug) {
    const variants = new Set(slugVariants(citySlug));
    results = results.filter((l) => variants.has(l.city_slug));
  }
  if (stateAbbr) {
    const state = stateAbbr.toUpperCase();
    results = results.filter((l) => l.state.toUpperCase() === state);
  }

  return applyHierarchy(results);
}

export async function getListingsByFilters(filters: {
  serviceTags?: string[];
  specialtyTags?: string[];
  citySlug?: string;
  stateAbbr?: string;
}): Promise<NormalizedListing[]> {
  let results = withTagsAll(await getCachedListingRows()).filter(hasKnownCity);

  if (filters.citySlug) {
    const variants = new Set(slugVariants(filters.citySlug));
    results = results.filter((l) => variants.has(l.city_slug));
  }
  if (filters.stateAbbr) {
    const state = filters.stateAbbr.toUpperCase();
    results = results.filter((l) => l.state.toUpperCase() === state);
  }
  if (filters.serviceTags && filters.serviceTags.length > 0) {
    results = results.filter((l) =>
      filters.serviceTags!.some((tag) => l.service_tags.includes(tag))
    );
  }
  if (filters.specialtyTags && filters.specialtyTags.length > 0) {
    results = results.filter((l) =>
      filters.specialtyTags!.some((tag) => l.specialty_tags.includes(tag))
    );
  }

  return applyHierarchy(results);
}

export async function getFeaturedListings(
  limit = 6
): Promise<NormalizedListing[]> {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .eq("is_featured", true)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedListings error:", error.message);
    return [];
  }
  return withTagsAll((data ?? []) as BusinessListing[]).filter(hasKnownCity);
}

export interface FeaturedCityListing extends NormalizedListing {
  /** true if this listing is from a neighboring city, not the current city */
  isSpillover: boolean;
}

/**
 * Get featured listings for a city page, with metro cluster spillover.
 * 1. Fetch featured listings in the target city
 * 2. If fewer than FEATURED_SPOTS_PER_CITY, fill from metro neighbors
 * 3. Cap at FEATURED_SPOTS_PER_CITY total
 */
export async function getFeaturedByCity(
  citySlug: string,
  stateAbbr: string
): Promise<FeaturedCityListing[]> {
  // First: get featured listings in this exact city
  const localSlugs = citySlugVariants(citySlug, stateAbbr);

  const { data: localData, error: localError } = await supabase
    .from("business_listings")
    .select("*")
    .eq("is_featured", true)
    .eq("state", stateAbbr.toUpperCase())
    .in("city_slug", localSlugs)
    .order("rating", { ascending: false })
    .limit(FEATURED_SPOTS_PER_CITY);

  if (localError) {
    console.error("getFeaturedByCity local error:", localError.message);
    return [];
  }

  const localListings: FeaturedCityListing[] = withTagsAll(
    (localData ?? []) as BusinessListing[]
  )
    .filter(hasKnownCity)
    .map((l) => ({ ...l, isSpillover: false }));

  // If we already have enough, return early
  if (localListings.length >= FEATURED_SPOTS_PER_CITY) {
    return localListings.slice(0, FEATURED_SPOTS_PER_CITY);
  }

  // Otherwise: fill from metro neighbors
  const neighbors = getMetroNeighbors(citySlug);
  if (neighbors.length === 0) {
    return localListings;
  }

  const remaining = FEATURED_SPOTS_PER_CITY - localListings.length;
  const localIds = new Set(localListings.map((l) => l.id));

  // Build all slug variants for neighbor cities
  const neighborSlugs = neighbors.flatMap((n) => citySlugVariants(n, stateAbbr));

  const { data: neighborData, error: neighborError } = await supabase
    .from("business_listings")
    .select("*")
    .eq("is_featured", true)
    .eq("state", stateAbbr.toUpperCase())
    .in("city_slug", neighborSlugs)
    .order("rating", { ascending: false })
    .limit(remaining + 5); // fetch a few extra to account for dedup

  if (neighborError) {
    console.error("getFeaturedByCity neighbor error:", neighborError.message);
    return localListings;
  }

  const neighborListings: FeaturedCityListing[] = withTagsAll(
    (neighborData ?? []) as BusinessListing[]
  )
    .filter(hasKnownCity)
    .filter((l) => !localIds.has(l.id))
    .slice(0, remaining)
    .map((l) => ({ ...l, isSpillover: true }));

  return [...localListings, ...neighborListings];
}

/**
 * Count how many featured spots are taken in a city (local only, no spillover).
 * Used on the pricing page for scarcity signals.
 */
export async function getFeaturedCountByCity(
  citySlug: string,
  stateAbbr: string
): Promise<number> {
  const localSlugs = citySlugVariants(citySlug, stateAbbr);

  const { count, error } = await supabase
    .from("business_listings")
    .select("*", { count: "exact", head: true })
    .eq("is_featured", true)
    .eq("state", stateAbbr.toUpperCase())
    .in("city_slug", localSlugs);

  if (error) {
    console.error("getFeaturedCountByCity error:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Get featured listing counts for a list of cities.
 * Used on the pricing page for scarcity signals.
 */
export async function getFeaturedCountsForCities(
  cities: { slug: string; name: string; stateAbbr: string }[]
): Promise<{ cityName: string; taken: number }[]> {
  const results = await Promise.all(
    cities.map(async ({ slug, name, stateAbbr }) => ({
      cityName: name,
      taken: await getFeaturedCountByCity(slug, stateAbbr),
    }))
  );
  return results;
}

export async function getAllListings(): Promise<NormalizedListing[]> {
  return withTagsAll(await getCachedListingRows()).filter(hasKnownCity);
}

// ─── Owner Queries ──────────────────────────────────────

export async function getListingsByOwner(userId: string): Promise<NormalizedListing[]> {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .eq("owner_id", userId)
    .order("claimed_at", { ascending: false });

  if (error) {
    console.error("getListingsByOwner error:", error.message);
    return [];
  }
  return withTagsAll((data ?? []) as BusinessListing[]);
}

// ─── City Queries (derived from business_listings) ──────
// These aggregate city data directly from listings, so every city
// with at least one listing is always included, no sync issues.

type CityRow = Pick<BusinessListing, "city_slug" | "city" | "state">;

function aggregateCities(rows: CityRow[]): CityWithCount[] {
  const map = new Map<string, { name: string; state: string; count: number }>();

  for (const row of rows) {
    if (!row.city || row.city === "Unknown" || !row.city_slug) continue;

    const slug = plainSlug(row.city_slug);
    const key = `${row.state}:${slug}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { name: row.city, state: row.state, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([key, { name, state, count }]) => ({
      slug: key.split(":")[1] ?? "",
      name,
      state,
      state_abbr: state,
      groomer_count: count,
    }))
    .sort((a, b) => b.groomer_count - a.groomer_count);
}

async function getCityRows(stateAbbr?: string): Promise<CityRow[]> {
  const allCities: CityRow[] = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("business_listings")
      .select("city_slug, city, state")
      .range(from, to);

    if (stateAbbr) {
      query = query.eq("state", stateAbbr.toUpperCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error("getCityRows error:", error.message);
      return [];
    }

    if (data) {
      allCities.push(...(data as CityRow[]));
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }

    page++;
  }

  return allCities;
}

export async function getCityBrowseSummary(
  stateAbbr: string
): Promise<{
  cities: CityWithCount[];
  totalListings: number;
  uncategorizedListings: number;
}> {
  const rows = await getCityRows(stateAbbr);
  const cities = aggregateCities(rows);
  const categorizedListings = cities.reduce((sum, city) => sum + city.groomer_count, 0);

  return {
    cities,
    totalListings: rows.length,
    uncategorizedListings: rows.length - categorizedListings,
  };
}

// Cached: hit on every /api/search request. Time-revalidated every 5 min.
export const getCities = unstable_cache(
  async (): Promise<CityWithCount[]> => aggregateCities(await getCityRows()),
  ["all-cities"],
  { revalidate: 300, tags: [LISTINGS_CACHE_TAG] }
);

export async function getCitiesByState(
  stateAbbr: string
): Promise<CityWithCount[]> {
  return aggregateCities(await getCityRows(stateAbbr));
}

export async function getAllCitiesWithCounts(): Promise<CityWithCount[]> {
  return getCities();
}

export async function getCityBySlug(
  slug: string,
  stateAbbr?: string
): Promise<CityWithCount | null> {
  let query = supabase
    .from("business_listings")
    .select("city_slug, city, state")
    .in("city_slug", citySlugVariants(slug, stateAbbr));

  if (stateAbbr) {
    query = query.eq("state", stateAbbr.toUpperCase());
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  const cities = aggregateCities(data as CityRow[]);
  return cities[0] ?? null;
}

// ─── Aggregate Helpers ──────────────────────────────────

export async function getTotalListingCount(): Promise<number> {
  const { count, error } = await supabase
    .from("business_listings")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}

export async function getListingCountByCity(
  citySlug: string,
  stateAbbr?: string
): Promise<number> {
  let query = supabase
    .from("business_listings")
    .select("*", { count: "exact", head: true })
    .in("city_slug", citySlugVariants(citySlug, stateAbbr));

  if (stateAbbr) {
    query = query.eq("state", stateAbbr.toUpperCase());
  }

  const { count, error } = await query;

  if (error) return 0;
  return count ?? 0;
}

import Fuse, { type Expression } from "fuse.js";

// Building a Fuse index over the full table is the expensive part of search,
// so keep one per server instance and rebuild only when the cached rows
// change (same 5-min cadence as getCachedListingRows).
let listingFuseCache: {
  fuse: Fuse<NormalizedListing>;
  rowCount: number;
  builtAt: number;
} | null = null;
const LISTING_FUSE_TTL_MS = 5 * 60 * 1000;

function getListingFuse(all: NormalizedListing[]): Fuse<NormalizedListing> {
  const now = Date.now();
  if (
    listingFuseCache &&
    now - listingFuseCache.builtAt < LISTING_FUSE_TTL_MS &&
    listingFuseCache.rowCount === all.length
  ) {
    return listingFuseCache.fuse;
  }

  const fuse = new Fuse(all, {
    keys: [
      { name: "name", weight: 3 },
      { name: "city", weight: 2 },
      { name: "zip", weight: 2 },
      { name: "service_tags", weight: 2 },
      { name: "specialty_tags", weight: 2 },
      { name: "description", weight: 1 },
      { name: "address", weight: 1 }
    ],
    threshold: 0.3,
    ignoreLocation: true,
    useExtendedSearch: true, // Required for logical queries ($and)
  });

  listingFuseCache = { fuse, rowCount: all.length, builtAt: now };
  return fuse;
}

export async function searchListings(
  query: string
): Promise<NormalizedListing[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Reuse the cached full-table read instead of re-scanning the table on
  // every keystroke. Fuse.js reorders by match score, so the DB-side
  // ordering is irrelevant here.
  const all = withTagsAll(await getCachedListingRows()).filter(hasKnownCity);

  // Split the query into distinct terms for multi-intent searching
  // e.g. "Seattle Mobile" -> ["seattle", "mobile"]
  const terms = q.split(/\s+/).filter(Boolean);

  const fuse = getListingFuse(all);

  // Create a logical query where EVERY term must match *somewhere* in the listing
  // This allows "Seattle Mobile" to match a listing where city="Seattle" and service_tags="mobile"
  const logicalQuery = {
    $and: terms.map(term => ({
      $or: [
        { name: term },
        { city: term },
        { zip: term },
        { service_tags: term },
        { specialty_tags: term },
        { description: term },
        { address: term }
      ] as Expression[]
    }))
  };

  const results = fuse.search(logicalQuery);
  return results.map(res => res.item);
}
