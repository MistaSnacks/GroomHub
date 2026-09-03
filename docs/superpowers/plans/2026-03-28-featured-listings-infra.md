# Featured Listings Infrastructure - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the infrastructure for city-page featured listings with metro cluster spillover, so it's ready to activate when beta ends and paid subscriptions begin.

**Architecture:** A metro cluster config maps cities to geographic groups. A new query (`getFeaturedByCity`) fetches featured listings for a city, falling back to metro neighbors when local inventory is thin. A `FeaturedSection` server component renders the featured groomers above the regular listings on city pages. The pricing page gets a scarcity signal showing remaining featured spots per city.

**Tech Stack:** Next.js 16 (App Router, Server Components), Supabase (existing client), TypeScript, Tailwind v4, Phosphor Icons

**Important context:**
- Dev server runs on port 3005 (`npm run dev -- -p 3005`)
- No test runner is configured in this project. Steps that say "verify" mean manual browser check or build check.
- The `is_featured` boolean and `subscription_tier` field already exist on `business_listings`
- `ListingCard` already renders badges based on `subscription_tier`
- `CityListingsClient` already pushes `is_featured` listings to the top of filtered results
- No em dashes anywhere. Use hyphens, periods, or commas.
- Use Phosphor Icons (not Lucide)

---

### Task 1: Create Metro Cluster Config

**Files:**
- Create: `src/lib/metro-clusters.ts`

- [ ] **Step 1: Create the metro cluster config file**

```typescript
// src/lib/metro-clusters.ts
// Maps city slugs to metro area groups for featured listing spillover.
// When a city has fewer than 3 featured groomers, we pull from
// other cities in the same metro cluster.

export interface MetroCluster {
  name: string;
  cities: string[]; // city_slug values (plain format, no state suffix)
}

export const METRO_CLUSTERS: MetroCluster[] = [
  {
    name: "Seattle Metro",
    cities: [
      "seattle", "bellevue", "redmond", "kirkland", "renton",
      "kent", "tacoma", "federal-way", "lynnwood", "everett",
      "bothell", "issaquah", "burien", "auburn", "sammamish",
      "shoreline", "edmonds", "woodinville", "tukwila", "seatac",
      "mercer-island", "kenmore", "lake-forest-park",
    ],
  },
  {
    name: "Portland Metro",
    cities: [
      "portland", "beaverton", "tigard", "lake-oswego", "gresham",
      "hillsboro", "vancouver", "milwaukie", "tualatin", "oregon-city",
      "west-linn", "sherwood", "happy-valley", "clackamas",
      "wilsonville", "canby", "troutdale", "wood-village",
    ],
  },
  {
    name: "Olympia Area",
    cities: ["olympia", "lacey", "tumwater"],
  },
  {
    name: "Spokane Metro",
    cities: ["spokane", "spokane-valley", "liberty-lake", "cheney"],
  },
  {
    name: "Salem Metro",
    cities: ["salem", "keizer", "silverton", "woodburn"],
  },
  {
    name: "Tri-Cities",
    cities: ["kennewick", "richland", "pasco"],
  },
];

const cityToCluster = new Map<string, MetroCluster>();
for (const cluster of METRO_CLUSTERS) {
  for (const city of cluster.cities) {
    cityToCluster.set(city, cluster);
  }
}

/**
 * Get all city slugs in the same metro cluster as the given city.
 * Returns an empty array if the city is not in any cluster.
 * Excludes the input city itself.
 */
export function getMetroNeighbors(citySlug: string): string[] {
  const plain = citySlug.replace(/-wa$|-or$/, "");
  const cluster = cityToCluster.get(plain);
  if (!cluster) return [];
  return cluster.cities.filter((c) => c !== plain);
}

/**
 * Get the metro cluster name for a city, or null if not in a cluster.
 */
export function getMetroClusterName(citySlug: string): string | null {
  const plain = citySlug.replace(/-wa$|-or$/, "");
  return cityToCluster.get(plain)?.name ?? null;
}

/** Maximum featured listings shown per city page */
export const FEATURED_SPOTS_PER_CITY = 3;
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npx tsc --noEmit src/lib/metro-clusters.ts 2>&1 | head -20`

If TypeScript standalone check fails due to path aliases, just verify with: `npm run build 2>&1 | tail -20` (should have no errors in metro-clusters.ts)

- [ ] **Step 3: Commit**

```bash
git add src/lib/metro-clusters.ts
git commit -m "feat: add metro cluster config for featured listing spillover"
```

---

### Task 2: Add getFeaturedByCity Query with Spillover

**Files:**
- Modify: `src/lib/supabase/queries.ts` (add new function after `getFeaturedListings`)

- [ ] **Step 1: Add the getFeaturedByCity function**

Add this after the existing `getFeaturedListings` function (after line 237 in queries.ts):

```typescript
import { getMetroNeighbors, FEATURED_SPOTS_PER_CITY } from "../metro-clusters";

// ... (add to existing imports at top of file)

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
  ).map((l) => ({ ...l, isSpillover: false }));

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
```

- [ ] **Step 2: Add the import at the top of queries.ts**

At the top of `src/lib/supabase/queries.ts`, add to existing imports:

```typescript
import { getMetroNeighbors, FEATURED_SPOTS_PER_CITY } from "../metro-clusters";
```

- [ ] **Step 3: Export FeaturedCityListing from types or re-export**

The `FeaturedCityListing` interface is defined in queries.ts alongside the function. No separate type file change needed since it extends `NormalizedListing` which is already exported from types.ts.

- [ ] **Step 4: Verify build**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npm run build 2>&1 | tail -30`

Expected: Build succeeds with no errors related to queries.ts or metro-clusters.ts.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/queries.ts
git commit -m "feat: add getFeaturedByCity query with metro cluster spillover"
```

---

### Task 3: Create FeaturedSection Component

**Files:**
- Create: `src/components/featured-section.tsx`

- [ ] **Step 1: Create the FeaturedSection component**

```typescript
// src/components/featured-section.tsx
import { ListingCard } from "./listing-card";
import { Star } from "@phosphor-icons/react/dist/ssr";
import type { FeaturedCityListing } from "@/lib/supabase/queries";

interface FeaturedSectionProps {
  listings: FeaturedCityListing[];
  cityName: string;
}

export function FeaturedSection({ listings, cityName }: FeaturedSectionProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-5">
        <Star weight="fill" className="w-5 h-5 text-brand-accent" />
        <h2 className="font-heading text-xl font-semibold text-brand-primary">
          Featured Groomers in {cityName}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <div key={listing.slug} className="relative">
            <div className="rounded-xl border-2 border-brand-accent/30 bg-brand-accent/[0.03]">
              <ListingCard listing={listing} compact />
            </div>
            {listing.isSpillover && (
              <p className="mt-1.5 text-xs text-text-muted italic px-1">
                Also serving {cityName}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npm run build 2>&1 | tail -20`

Expected: No errors related to featured-section.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/featured-section.tsx
git commit -m "feat: add FeaturedSection component for city pages"
```

---

### Task 4: Wire FeaturedSection into City Pages

**Files:**
- Modify: `src/app/dog-grooming/[state]/[city]/page.tsx`

- [ ] **Step 1: Add imports to city page**

At the top of `src/app/dog-grooming/[state]/[city]/page.tsx`, add:

```typescript
import { getFeaturedByCity } from "@/lib/supabase/queries";
import { FeaturedSection } from "@/components/featured-section";
```

- [ ] **Step 2: Add getFeaturedByCity to the data fetch**

In the `CityPage` component (around line 109), modify the `Promise.all` to include featured listings:

Change:
```typescript
const [listings, cityData, relatedCities] = await Promise.all([
  getListingsByCity(city, stateAbbr),
  getCityBySlug(city, stateAbbr),
  getCitiesByState(stateAbbr),
]);
```

To:
```typescript
const [listings, cityData, relatedCities, featuredListings] = await Promise.all([
  getListingsByCity(city, stateAbbr),
  getCityBySlug(city, stateAbbr),
  getCitiesByState(stateAbbr),
  getFeaturedByCity(city, stateAbbr),
]);
```

- [ ] **Step 3: Render FeaturedSection above listings**

In the JSX, inside the `{/* Main content - Listings */}` section (around line 155-163), add the FeaturedSection before CityListingsClient:

Change:
```tsx
<section className="bg-bg flex-1">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
    <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading filters...</div>}>
      <CityListingsClient
        listings={listings}
        heading={`Best Dog Groomers in ${cityName}`}
      />
    </Suspense>
  </div>
</section>
```

To:
```tsx
<section className="bg-bg flex-1">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
    {featuredListings.length > 0 && (
      <FeaturedSection listings={featuredListings} cityName={cityName} />
    )}
    <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading filters...</div>}>
      <CityListingsClient
        listings={listings}
        heading={`Best Dog Groomers in ${cityName}`}
      />
    </Suspense>
  </div>
</section>
```

- [ ] **Step 4: Start dev server and verify visually**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npm run dev -- -p 3005`

Visit `http://localhost:3005/dog-grooming/wa/seattle` in the browser. Since no listings are currently marked `is_featured: true`, the FeaturedSection should not render (returns null when empty). The page should look identical to before.

- [ ] **Step 5: Commit**

```bash
git add src/app/dog-grooming/\[state\]/\[city\]/page.tsx
git commit -m "feat: wire FeaturedSection into city pages"
```

---

### Task 5: Add Scarcity Signal to Pricing Page

**Files:**
- Modify: `src/app/pricing/page.tsx`

This task adds a small helper component and query to show "X of 3 featured spots available in [City]" on the pricing page. Since we don't know the visitor's city yet (no geo-detection in beta), this will show scarcity for the top cities as a general signal.

- [ ] **Step 1: Read the current pricing page**

Read `src/app/pricing/page.tsx` to understand the current structure before modifying.

- [ ] **Step 2: Create a FeaturedAvailability component**

Create `src/components/featured-availability.tsx`:

```typescript
// src/components/featured-availability.tsx
import { FEATURED_SPOTS_PER_CITY } from "@/lib/metro-clusters";
import { MapPin } from "@phosphor-icons/react/dist/ssr";

interface CityAvailability {
  cityName: string;
  taken: number;
}

interface FeaturedAvailabilityProps {
  cities: CityAvailability[];
}

export function FeaturedAvailability({ cities }: FeaturedAvailabilityProps) {
  if (cities.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-bg/50 p-5">
      <h3 className="font-heading text-base font-semibold text-brand-primary mb-3">
        Featured Spot Availability
      </h3>
      <div className="space-y-2">
        {cities.map(({ cityName, taken }) => {
          const available = FEATURED_SPOTS_PER_CITY - taken;
          const isFull = available <= 0;
          return (
            <div key={cityName} className="flex items-center gap-2 text-sm">
              <MapPin weight="fill" className="w-4 h-4 text-brand-secondary flex-shrink-0" />
              <span className="text-text-muted">
                {cityName}:
              </span>
              {isFull ? (
                <span className="font-medium text-brand-accent">
                  Full - join the waitlist
                </span>
              ) : (
                <span className="font-medium text-brand-primary">
                  {available} of {FEATURED_SPOTS_PER_CITY} spots available
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add a query to get featured counts for top cities**

Add to the bottom of `src/lib/supabase/queries.ts`:

```typescript
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
```

- [ ] **Step 4: Wire FeaturedAvailability into the pricing page**

Import and render the component in `src/app/pricing/page.tsx`. Add it below the pricing tiers grid, inside the same container. This requires:

1. Import `getFeaturedCountsForCities` from queries
2. Import `FeaturedAvailability` from components
3. Fetch counts for top cities (Seattle, Portland, Tacoma, Bellevue, Beaverton)
4. Render the component

Add to imports:
```typescript
import { getFeaturedCountsForCities } from "@/lib/supabase/queries";
import { FeaturedAvailability } from "@/components/featured-availability";
```

In the page's server component, fetch the data:
```typescript
const TOP_CITIES = [
  { slug: "seattle", name: "Seattle", stateAbbr: "WA" },
  { slug: "portland", name: "Portland", stateAbbr: "OR" },
  { slug: "tacoma", name: "Tacoma", stateAbbr: "WA" },
  { slug: "bellevue", name: "Bellevue", stateAbbr: "WA" },
  { slug: "beaverton", name: "Beaverton", stateAbbr: "OR" },
];

const featuredCounts = await getFeaturedCountsForCities(TOP_CITIES);
```

Then render `<FeaturedAvailability cities={featuredCounts} />` after the pricing tier cards.

- [ ] **Step 5: Verify build and visual check**

Run: `npm run build 2>&1 | tail -20`
Visit: `http://localhost:3005/pricing`

Expected: Pricing page renders as before, plus a "Featured Spot Availability" section showing "3 of 3 spots available" for each city (since none are featured yet).

- [ ] **Step 6: Commit**

```bash
git add src/components/featured-availability.tsx src/lib/supabase/queries.ts src/app/pricing/page.tsx
git commit -m "feat: add featured spot scarcity signals to pricing page"
```

---

### Task 6: Add Profile Quality Check Utility

**Files:**
- Create: `src/lib/profile-quality.ts`

This utility checks whether a featured listing meets the minimum profile quality requirements. It will be used later for enforcement, but having the logic ready now means we can display quality status in the dashboard.

- [ ] **Step 1: Create the profile quality check**

```typescript
// src/lib/profile-quality.ts
// Profile quality gate for featured listings.
// Featured groomers must maintain a complete profile to keep their spot.

import type { BusinessListing } from "./types";

export interface QualityCheck {
  passed: boolean;
  missing: string[];
}

const MIN_SERVICES = 3;

/**
 * Check if a listing meets the minimum quality requirements for featured placement.
 * Requirements:
 * - At least 1 photo uploaded
 * - Business description filled out (non-empty)
 * - Business hours listed (at least 1 day)
 * - At least 3 services tagged
 */
export function checkProfileQuality(listing: BusinessListing): QualityCheck {
  const missing: string[] = [];

  if (!listing.images || listing.images.length === 0) {
    missing.push("At least 1 photo");
  }

  if (!listing.description || listing.description.trim().length === 0) {
    missing.push("Business description");
  }

  if (!listing.hours || listing.hours.length === 0) {
    missing.push("Business hours");
  }

  if (!listing.services || listing.services.length < MIN_SERVICES) {
    missing.push(`At least ${MIN_SERVICES} services`);
  }

  return {
    passed: missing.length === 0,
    missing,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npm run build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/lib/profile-quality.ts
git commit -m "feat: add profile quality check utility for featured listings"
```

---

### Task 7: Wire Service Route City Pages (cat-grooming, mobile-grooming)

**Files:**
- Check and modify: `src/app/cat-grooming/[state]/[city]/page.tsx` (if it exists)
- Check and modify: `src/app/mobile-grooming/[state]/[city]/page.tsx` (if it exists)

These service-specific city pages should also show featured groomers when relevant.

- [ ] **Step 1: Check if service city pages exist and share the same pattern**

Run: `find src/app -name "page.tsx" -path "*/[city]/*" | sort`

If they exist and follow the same pattern as the dog-grooming city page (fetching listings and rendering CityListingsClient), apply the same changes from Task 4:
1. Import `getFeaturedByCity` and `FeaturedSection`
2. Add `getFeaturedByCity` to the Promise.all
3. Render `FeaturedSection` above `CityListingsClient`

If they use a shared layout or component, only one change may be needed.

- [ ] **Step 2: Verify build after changes**

Run: `npm run build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/cat-grooming/ src/app/mobile-grooming/
git commit -m "feat: add featured section to service-specific city pages"
```

---

### Task 8: Update Pricing Page Copy for Featured Tier

**Files:**
- Modify: `src/lib/pricing.ts`

The current "Featured" tier ($29/mo) says "Top-tier search placement (Rotated)" but our spec says no rotation. Update the copy to match the decided strategy.

- [ ] **Step 1: Update Featured tier feature text**

In `src/lib/pricing.ts`, change the Featured tier features:

Change:
```typescript
{ text: "Top-tier search placement (Rotated)", included: true },
```

To:
```typescript
{ text: "Featured placement on your city page", included: true },
```

- [ ] **Step 2: Update Premium tier feature text**

Change:
```typescript
{ text: "#1 placement in your area", included: true },
```

To:
```typescript
{ text: "Top placement in your city (1 of 3 spots)", included: true },
```

And change:
```typescript
{ text: "Homepage spotlight rotation", included: true },
```

To:
```typescript
{ text: "Homepage spotlight", included: true },
```

- [ ] **Step 3: Verify build and visual check**

Visit: `http://localhost:3005/pricing`
Confirm the updated copy renders correctly on the pricing cards.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pricing.ts
git commit -m "fix: update pricing tier copy to match featured listings strategy"
```

---

## Summary of New/Modified Files

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/metro-clusters.ts` | Create | Metro area city groupings + helpers |
| `src/lib/profile-quality.ts` | Create | Quality gate checker for featured listings |
| `src/lib/supabase/queries.ts` | Modify | Add `getFeaturedByCity`, `getFeaturedCountByCity`, `getFeaturedCountsForCities` |
| `src/components/featured-section.tsx` | Create | City page featured groomers display |
| `src/components/featured-availability.tsx` | Create | Pricing page scarcity signals |
| `src/app/dog-grooming/[state]/[city]/page.tsx` | Modify | Wire in FeaturedSection |
| `src/app/cat-grooming/[state]/[city]/page.tsx` | Modify | Wire in FeaturedSection (if exists) |
| `src/app/mobile-grooming/[state]/[city]/page.tsx` | Modify | Wire in FeaturedSection (if exists) |
| `src/app/pricing/page.tsx` | Modify | Add scarcity signals |
| `src/lib/pricing.ts` | Modify | Update tier copy |

## Verification Checklist

After all tasks complete:
- [ ] `npm run build` passes with no errors
- [ ] City pages render correctly with no featured listings visible (none marked yet)
- [ ] Pricing page shows "3 of 3 spots available" for all top cities
- [ ] Pricing tier copy reflects no-rotation strategy
- [ ] Marking a listing `is_featured: true` in Supabase causes it to appear in the FeaturedSection on its city page
- [ ] Marking a listing in a neighbor city causes spillover with "Also serving [City]" label
