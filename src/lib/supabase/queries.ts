import { supabase } from "./client";
import { normalizeTags } from "../tags";
import type { BusinessListing, NormalizedListing, CityWithCount } from "../types";

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

/** Return both plain and suffixed variants so we catch all listings */
function slugVariants(slug: string): string[] {
  const plain = plainSlug(slug);
  return [plain, `${plain}-wa`, `${plain}-or`];
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
  citySlug: string
): Promise<NormalizedListing[]> {
  // Query for all slug variants to merge split data
  const variants = slugVariants(citySlug);
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .in("city_slug", variants);

  if (error) {
    console.error("getListingsByCity error:", error.message);
    return [];
  }
  return applyHierarchy(dedupeBySlug(withTagsAll((data ?? []) as BusinessListing[])));
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
  return applyHierarchy(withTagsAll((data ?? []) as BusinessListing[]));
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

export async function getListingsByServiceTag(
  serviceTag: string,
  citySlug?: string,
  stateAbbr?: string
): Promise<NormalizedListing[]> {
  let query = supabase.from("business_listings").select("*");

  if (citySlug) {
    query = query.in("city_slug", slugVariants(citySlug));
  }
  if (stateAbbr) query = query.eq("state", stateAbbr.toUpperCase());

  const { data, error } = await query;

  if (error) {
    console.error("getListingsByServiceTag error:", error.message);
    return [];
  }

  // Filter by service tag after normalization
  const normalized = withTagsAll((data ?? []) as BusinessListing[]).filter((l) =>
    l.service_tags.includes(serviceTag)
  );

  return applyHierarchy(normalized);
}

export async function getListingsBySpecialtyTag(
  specialtyTag: string,
  citySlug?: string,
  stateAbbr?: string
): Promise<NormalizedListing[]> {
  let query = supabase.from("business_listings").select("*");

  if (citySlug) {
    query = query.in("city_slug", slugVariants(citySlug));
  }
  if (stateAbbr) query = query.eq("state", stateAbbr.toUpperCase());

  const { data, error } = await query;

  if (error) {
    console.error("getListingsBySpecialtyTag error:", error.message);
    return [];
  }

  const normalized = withTagsAll((data ?? []) as BusinessListing[]).filter((l) =>
    l.specialty_tags.includes(specialtyTag)
  );

  return applyHierarchy(normalized);
}

export async function getListingsByFilters(filters: {
  serviceTags?: string[];
  specialtyTags?: string[];
  citySlug?: string;
  stateAbbr?: string;
}): Promise<NormalizedListing[]> {
  let query = supabase.from("business_listings").select("*");

  if (filters.citySlug) {
    query = query.in("city_slug", slugVariants(filters.citySlug));
  }
  if (filters.stateAbbr) query = query.eq("state", filters.stateAbbr.toUpperCase());

  const { data, error } = await query;

  if (error) {
    console.error("getListingsByFilters error:", error.message);
    return [];
  }

  let results = withTagsAll((data ?? []) as BusinessListing[]);

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
  return withTagsAll((data ?? []) as BusinessListing[]);
}

export async function getAllListings(): Promise<NormalizedListing[]> {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .order("rating", { ascending: false });

  if (error) {
    console.error("getAllListings error:", error.message);
    return [];
  }
  return withTagsAll((data ?? []) as BusinessListing[]);
}

// ─── City Queries (derived from business_listings) ──────
// These aggregate city data directly from listings, so every city
// with at least one listing is always included — no sync issues.

type CityRow = Pick<BusinessListing, "city_slug" | "city" | "state">;

function aggregateCities(rows: CityRow[]): CityWithCount[] {
  const map = new Map<string, { name: string; state: string; count: number }>();

  for (const row of rows) {
    if (!row.city || row.city === "Unknown") continue;
    const slug = plainSlug(row.city_slug);
    const existing = map.get(slug);
    if (existing) {
      existing.count++;
    } else {
      map.set(slug, { name: row.city, state: row.state, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([slug, { name, state, count }]) => ({
      slug,
      name,
      state,
      state_abbr: state,
      groomer_count: count,
    }))
    .sort((a, b) => b.groomer_count - a.groomer_count);
}

export async function getCities(): Promise<CityWithCount[]> {
  const { data, error } = await supabase
    .from("business_listings")
    .select("city_slug, city, state");

  if (error) {
    console.error("getCities error:", error.message);
    return [];
  }
  return aggregateCities((data ?? []) as CityRow[]);
}

export async function getCitiesByState(
  stateAbbr: string
): Promise<CityWithCount[]> {
  const { data, error } = await supabase
    .from("business_listings")
    .select("city_slug, city, state")
    .eq("state", stateAbbr.toUpperCase());

  if (error) {
    console.error("getCitiesByState error:", error.message);
    return [];
  }
  return aggregateCities((data ?? []) as CityRow[]);
}

export async function getAllCitiesWithCounts(): Promise<CityWithCount[]> {
  return getCities();
}

export async function getCityBySlug(
  slug: string
): Promise<CityWithCount | null> {
  // Derive city info from listings with this slug
  const variants = slugVariants(slug);
  const { data, error } = await supabase
    .from("business_listings")
    .select("city_slug, city, state")
    .in("city_slug", variants);

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
  citySlug: string
): Promise<number> {
  const variants = slugVariants(citySlug);
  const { count, error } = await supabase
    .from("business_listings")
    .select("*", { count: "exact", head: true })
    .in("city_slug", variants);

  if (error) return 0;
  return count ?? 0;
}

import Fuse from "fuse.js";

export async function searchListings(
  query: string
): Promise<NormalizedListing[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false });

  if (error) {
    console.error("searchListings error:", error.message);
    return [];
  }

  const all = withTagsAll((data ?? []) as BusinessListing[]);

  // Split the query into distinct terms for multi-intent searching
  // e.g. "Seattle Mobile" -> ["seattle", "mobile"]
  const terms = q.split(/\s+/).filter(Boolean);

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
      ] as any[]
    }))
  };

  const results = fuse.search(logicalQuery);
  return results.map(res => res.item);
}
