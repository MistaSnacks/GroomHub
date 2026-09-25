# The Great Restructure: GroomingBook Directory — Changelog

## Overview

Transformed GroomingBook from a SaaS-feeling product (pricing tiers, "how it works" funnel, fake testimonials) into a **true directory** — search-first, browse-friendly, SEO-rich. New URL hierarchy, tag-based filtering, programmatic pages, and JSON-LD structured data.

---

## Phase 1: Data Foundation

### New Files

| File | Purpose |
|------|---------|
| `src/lib/tags.ts` | Tag taxonomy: 15 service tags, 8 specialty tags, 4 feature tags. `normalizeTags()` maps raw service/specialty strings → clean slugs via case-insensitive alias lookup. |
| `src/lib/geography.ts` | State/city registry. `STATES` const (WA, OR), helpers: `buildCityPath()`, `stateNameFromSlug()`, `isValidStateSlug()`, etc. |
| `src/lib/supabase/queries.ts` | Centralized data access replacing scattered inline Supabase calls. All queries run `withTags()` normalization at query time. Functions: `getListingsByCity()`, `getListingsByState()`, `getListingBySlug()`, `getListingsByServiceTag()`, `getCities()`, `getCitiesByState()`, `getAllCitiesWithCounts()`, `getTotalListingCount()`. |
| `scripts/normalize-tags.ts` | Migration script (for future use when Supabase service role key is available). Currently tags are computed at query time instead. |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Added `NormalizedListing` (extends `BusinessListing` with `service_tags[]`, `specialty_tags[]`, `feature_tags[]`, `price_tag`). Added `CityWithCount` type for Supabase city records. |

### Tag Taxonomy

**Service Tags (15):** full-groom, cat-grooming, nail-care, dog-bath, mobile-grooming, self-wash, teeth-cleaning, deshedding, ear-cleaning, puppy-grooming, flea-treatment, hand-stripping, creative-grooming, boarding, daycare

**Specialty Tags (8):** doodle-poodle, puppy-specialist, fear-free, large-dogs, cat-specialist, small-dogs, senior-pets, eco-friendly

**Feature Tags (4):** walk-ins-welcome, transparent-pricing, paw-verified, vaccinations-required

**Price Tags:** `$` | `$$` | `$$$` | `$$$$`

---

## Phase 2: Route Restructure + Homepage Redesign

### Dependencies Added

- `framer-motion` — Nav dropdown animations, future browse section entrance animations

### New Route Hierarchy

| Route | File | Purpose |
|-------|------|---------|
| `/dog-grooming` | `src/app/dog-grooming/page.tsx` | Hub: all cities across WA & OR with groomer counts |
| `/dog-grooming/[state]` | `src/app/dog-grooming/[state]/page.tsx` | State hub (WA or OR cities). Also handles legacy redirects for old `/dog-grooming/seattle-wa` URLs. |
| `/dog-grooming/[state]/[city]` | `src/app/dog-grooming/[state]/[city]/page.tsx` | **The money page** — city listings with tag-based filtering |
| `/api/cities` | `src/app/api/cities/route.ts` | JSON API endpoint for nav dropdown city data |

### Legacy URL Handling

Old `/dog-grooming/seattle-wa` → 307 redirect → `/dog-grooming/wa/seattle`
Old `/dog-grooming/seattle` → looks up city in Supabase → redirect to correct state/city path

### Homepage Redesign

**Removed sections:**
- Trust strip ("500+ Verified Listings, 4.8★, 10K+ Bookings")
- "How GroomingBook Works" 3-step funnel
- Testimonials from "pet parents"
- Blog preview cards
- CTA banner for groomers

**New homepage (top to bottom):**
1. **Hero** — Search bar + Maui mascot. Dynamic listing count from Supabase.
2. **Browse by Service** — Grid of 12 service tag cards with icons (uses `ServiceTagCard` component)
3. **Browse by City** — Two columns (WA | OR) with groomer counts per city, links to `/dog-grooming/{state}/{city}`
4. **Simple groomer CTA** — One line: "Are you a groomer? List your business."

### Navigation Redesign

**Before:** Find Groomers | Get Quotes | Pricing | For Groomers + "List Your Business"

**After:** Browse Cities (Framer Motion dropdown with WA/OR columns) | Services (dropdown with top tags) | All Groomers | List Your Business (secondary)

### New Components

| Component | Purpose |
|-----------|---------|
| `tag-filter-bar.tsx` | Collapsible tag filter sections (Services / Specialties / Features / Price) with pill toggles. Shows active filter count, individual remove buttons, "Clear all". Replaces old `filter-bar.tsx`. |
| `city-listings-client.tsx` | Client Component wrapper for city pages. Handles interactive tag filtering + sorting on `NormalizedListing[]` data fetched by server. |
| `service-tag-card.tsx` | Browse-by-service card with icon + label + optional count |
| `browse-by-city-section.tsx` | WA/OR city grid for homepage |
| `browse-by-service-section.tsx` | Service tag grid for homepage |
| `nav-dropdown.tsx` | Framer Motion `AnimatePresence` mega-menu for header nav. Supports `cities` mode (WA/OR columns) and `services` mode. |

### Updated Components

| Component | Changes |
|-----------|---------|
| `listing-card.tsx` | Shows normalized service tags (amber pills) and specialty tags (teal pills) instead of raw strings. "Photo coming soon" placeholder with `ImageSquare` icon when no image. "Get Quote" button → "Visit Website" (links to actual website). Handles both `BusinessListing` and `NormalizedListing` types gracefully. |
| `city-card.tsx` | Now uses `CityWithCount` type. Links to `/dog-grooming/{state}/{city}` via `buildCityPath()`. |
| `search-hero.tsx` | State-aware routing: detects Oregon cities and routes to `/dog-grooming/or/{city}`, defaults to WA. Simplified to single city input (removed service dropdown). Quick chips for Dog/Cat/Mobile grooming. |
| `site-header.tsx` | Complete rewrite with `NavDropdown` components. Fetches cities from `/api/cities` for dropdown. Mobile nav shows WA/OR state links. |
| `site-footer.tsx` | Links updated to new `/dog-grooming/{state}/{city}` routes. Organized by WA cities, OR cities, Services, For Groomers. |

---

## Phase 3: Service Routes + Profiles + Monetization + Polish

### Service-Specific Routes

| Route | Pre-filter |
|-------|-----------|
| `/cat-grooming` | Hub page listing all cities |
| `/cat-grooming/[state]/[city]` | `cat-grooming` service tag pre-filtered |
| `/mobile-grooming` | Hub page listing all cities |
| `/mobile-grooming/[state]/[city]` | `mobile-grooming` service tag pre-filtered |

All share the `CityListingsClient` component with a `preFilterService` prop.

### Groomer Profile Enhancements (`src/app/groomer/[slug]/page.tsx`)

- **JSON-LD** `LocalBusiness` + `BreadcrumbList` schema in page source
- **Breadcrumbs:** Home > Dog Grooming > WA > Seattle > Business Name
- **"Claim this listing"** link → `/claim/[slug]`
- **Service tags** displayed as amber pills (main content + sidebar)
- **Specialty tags** displayed as teal pills (main content + sidebar)
- **Gallery:** Shows real images or "Photo here" placeholders with `ImageSquare` icon
- **Map embed** in sidebar using lat/lng coordinates
- **Contact info** with clickable phone link and truncated website display

### SEO

| File | Purpose |
|------|---------|
| `src/lib/schema.ts` | JSON-LD generators: `localBusinessSchema()`, `breadcrumbSchema()`, `faqSchema()`, `itemListSchema()` |

### Monetization Integration Points

| Component | Purpose |
|-----------|---------|
| `featured-listing-banner.tsx` | Premium featured slot — larger card with gold `Featured` badge, image, service tags. For top of city pages. |
| `src/app/claim/[slug]/page.tsx` | Claim listing stub page. Shows business info, 3-step explanation, contact CTA. |
| `ad-slot.tsx` | Placeholder ad areas (dashed border, labeled) for city pages. |

### Dead Code Cleanup

| Action | File |
|--------|------|
| DELETED | `src/components/crm-software-section.tsx` |
| REMOVED | Old `src/app/dog-grooming/[city]/` route directory (replaced by `[state]` handler) |

### Config Changes

| File | Change |
|------|--------|
| `next.config.ts` | Added `images.remotePatterns` for `images.unsplash.com` and `storage.googleapis.com` |
| `package.json` | Added `framer-motion` dependency |

---

## Architecture Decisions

1. **Tags normalized at query time** — Supabase service role key unavailable, so `withTags()` in `queries.ts` runs `normalizeTags()` on every fetch. Works fine for 262 listings. Can migrate to stored columns later.
2. **City pages = Server Component + Client Component child** — Server fetches data for SEO, `CityListingsClient` handles interactive filtering.
3. **Service routes share `CityListingsClient`** — `preFilterService` prop avoids duplication across dog/cat/mobile grooming routes.
4. **Framer Motion confined to Client Components** — `NavDropdown` only. Maui mascot keeps anime.js.
5. **Legacy redirects handled in `[state]/page.tsx`** — Detects non-state slugs (e.g., `seattle-wa`) and redirects via Supabase lookup.
6. **`city_slug` stays as-is in Supabase** — `"seattle"` not `"seattle-wa"`. State derived from `state` column.

---

## Verification Results

```
✓ Build succeeds (Next.js 16.1.6 Turbopack)
✓ Homepage — 200
✓ /dog-grooming — 200 (hub)
✓ /dog-grooming/wa — 200 (state)
✓ /dog-grooming/wa/seattle — 200 (city)
✓ /dog-grooming/seattle-wa — 307 → /dog-grooming/wa/seattle (legacy redirect)
✓ /cat-grooming — 200 (service hub)
✓ /mobile-grooming — 200 (service hub)
✓ /groomer/urban-doggie-kirkland — 200 (profile with JSON-LD)
✓ /claim/urban-doggie-kirkland — 200 (claim stub)
✓ /api/cities — 200 (JSON)
✓ JSON-LD scripts present in groomer page source
```
