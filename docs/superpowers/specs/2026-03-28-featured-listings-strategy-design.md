# Featured Listings Strategy - Design Spec

## Overview

A phased strategy for how GroomLocal handles featured/promoted listings on the homepage and city pages, from beta through national expansion.

**Core principle:** Simple flat fee + hard cap + profile quality gate. No auctions, no rotation, no complexity until scale demands it.

---

## Phase 1: Beta (Now - No Code Changes)

### What exists today
- Homepage shows 3 featured listing cards via `getFeaturedListings(3)`
- Uses `is_featured` boolean + `rating` as tie-breaker
- Empty slots show `PremiumPlaceholderCard` CTA
- No geo-awareness

### Beta action
- Mark beta barter partners as `is_featured: true` and `subscription_tier: "premium"` in Supabase
- They appear on the homepage immediately with existing infrastructure
- No code changes required

### What beta partners get
- Homepage featured card (1 of 3 spots)
- "Premium" badge on their listing card
- Enhanced profile visibility

### What beta partners owe
- Platform feedback
- Testimonial when beta ends
- Complete profile (photos, hours, services, description)

### Why this works at beta scale
- PNW-only traffic means most visitors are from WA/OR, so any PNW groomer is reasonably relevant
- The "this isn't for me" geographic mismatch problem is minimal at regional scale
- Homepage needs to look alive; beta partner cards accomplish this
- Beta partners expect homepage visibility as part of the barter value

---

## Phase 2: Post-Beta - City Page Featured Listings (Build When Charging)

### City page featured section
- Each city page (`/dog-grooming/[state]/[city]`) gets a "Featured Groomers in [City]" section above regular listings
- Hard cap: **3 featured spots per city**
- Featured groomers ALSO appear in the regular listing below (visible in filter results)
- Visual distinction: same `ListingCard` with "Featured" badge and subtle highlight border

### Metro cluster spillover
When a city has fewer than 3 featured groomers, pull from neighboring cities in the same metro cluster. Label spillover listings as "Also serving [City]."

**Metro cluster definitions** (stored in a config file):

```
Seattle metro: Seattle, Bellevue, Redmond, Kirkland, Renton, Kent, Tacoma,
               Federal Way, Lynnwood, Everett, Bothell, Issaquah, Burien,
               Auburn, Sammamish, Shoreline, Edmonds, Woodinville
Portland metro: Portland, Beaverton, Tigard, Lake Oswego, Gresham,
                Hillsboro, Vancouver WA, Milwaukie, Tualatin, Oregon City,
                West Linn, Sherwood, Happy Valley, Clackamas
```

Additional clusters defined as coverage expands (Spokane metro, Salem metro, etc.).

**Spillover priority:** Same metro cluster first, then same state, then nothing (don't show a Portland groomer on a Spokane page).

### Profile quality gate
To keep a featured seat, the groomer must maintain:
- At least 1 photo uploaded
- Business description filled out (non-empty)
- Business hours listed
- At least 3 services tagged

**Enforcement flow:**
1. Weekly automated check of featured listing profiles
2. If below threshold: warning email ("Your featured listing is at risk")
3. 30 days to fix
4. After 30 days unfixed: lose featured spot, keep paid subscription benefits (enhanced profile, badges)
5. Spot opens up for next waitlisted groomer (or stays open)

### Pricing page scarcity signal
Show remaining availability per city on the pricing/upgrade page:
- "2 of 3 featured spots available in Tacoma"
- "Featured spots full in Seattle - join the waitlist"

This is the single most effective conversion tactic identified in research.

### Homepage during Phase 2
- Homepage featured section continues to work as-is (3 static slots, not geo-aware)
- Homepage slots are filled by premium subscribers chosen manually or by highest-traffic city
- Homepage and city page featured spots are independent: a groomer can hold both
- Geo-aware homepage replaces this in Phase 3

### Seat allocation
- First-come, first-served among paying premium subscribers
- No rotation: seat holders keep their spot as long as they pay and maintain profile quality
- When a city fills all 3 spots, new requests go on a waitlist

---

## Phase 3: Growth - Geo-Aware Homepage (~5K Monthly Visitors or National Expansion)

### Geo-aware homepage featured section
- Use IP geolocation (Vercel `request.geo` or similar) to detect visitor's approximate city/state
- Homepage featured section becomes dynamic: shows 3 featured groomers from visitor's detected metro area
- Section title adjusts: "Featured Groomers Near You" (geo-detected) vs "Featured Groomers in the PNW" (fallback)

### Fallback chain
1. Visitor's detected city
2. Metro cluster for that city
3. Visitor's detected state
4. Random premium groomers (last resort)

### Demand scaling
| City demand | Action |
|---|---|
| 0-2 featured groomers | Show what exists + metro spillover |
| 3 (full) | Waitlist new requests. Consider price increase for that city. |
| 5+ wanting spots | Raise price for that city. Expand inventory to service/specialty page featured spots. |

### Additional inventory surfaces (when city spots fill)
- Service landing pages (`/services/[slug]`): featured groomers who offer that service
- Specialty landing pages (`/specialties/[slug]`): featured groomers with that specialty
- Search results: featured groomers pinned above organic results
- Each new surface = more sellable inventory without diluting city page value

---

## What We Are NOT Building

- **No rotation system.** Seat holders keep their spot as long as they pay and maintain quality.
- **No auction/bidding.** Flat fee pricing. Tiered by city demand only at growth phase.
- **No homepage changes during beta.** Current 3-slot system stays as-is.
- **No city page featured section during beta.** Post-beta build.
- **No geo-detection during beta.** Growth phase build.
- **No featured spots on service/specialty pages during beta.** Future inventory expansion.

---

## Data Model (Existing - No Changes Needed for Beta)

The current Supabase schema already supports this strategy:

- `is_featured: boolean` - Marks a listing as featured
- `subscription_tier: "free" | "standard" | "featured" | "premium"` - Payment tier
- `city_slug: string` - Used for city page matching
- `state: string` - Used for state filtering

### Future additions (post-beta build)
- `metro_cluster` config file mapping cities to metro groups
- `featured_at: timestamp` - When the listing became featured (for first-come ordering)
- `profile_quality_score: computed` - Derived from photo count, description length, hours, service tags
- Waitlist table or column for cities at capacity

---

## Research Backing

This strategy is informed by research across:
- **Frey Chu** (Ship Your Directory): "Traffic first, monetize second. Boring location-based niches win."
- **Major directories** (Yelp, Thumbtack, Angi): None monetize the homepage with specific businesses. Monetization lives on search/category pages.
- **Directory communities** (IndieHackers, MakeADir, GeoDirectory): Consensus on flat fee + hard cap + quality gate as the right model for directories under 100K visitors.
- **Wedding directories** (WeddingWire, The Knot): Tiered pricing by market demand, profile quality gates, geographic exclusivity.
- **Key insight**: "The discipline is in the cap." Selling unlimited featured spots destroys value.

---

## Success Criteria

- Beta: 3 homepage spots filled with real groomer profiles (not placeholders)
- Post-beta: At least 1 paying featured groomer per major city (Seattle, Portland, Tacoma)
- Growth: All 3 spots filled in top 5 cities, waitlist active in at least 1 city
- Revenue: Featured spots become a meaningful revenue stream ($150-450/month per city at $50-150/groomer)
