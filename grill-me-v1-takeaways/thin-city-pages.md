# Thin City Pages: Nearby Results + Groomer CTA

## The Problem
- 272 cities total, 136 (50%) have only 1-2 listings
- 98 cities have exactly 1 listing
- No zero-listing pages exist (cities derived from live data)
- But a city page with 1 groomer card is thin content for SEO and bad UX for pet owners

## Decision
For city pages with fewer than 3 listings, show two additional elements:

### 1. Nearby City Suggestions (Option B)
- "Looking for more options? Check groomers in nearby [City 1], [City 2], [City 3]."
- Requires geographic proximity logic (lat/lng distance or manual region mapping)
- Keeps pet owners on the site instead of bouncing back to Google

### 2. Groomer Acquisition CTA (Option C)
- "Are you a groomer in [City]? Be the first to claim your listing."
- Turns thin pages into a funnel for groomer signups
- Especially valuable in underserved areas where groomers have less competition

## Data Points
- Top cities are healthy: Seattle (52), Portland (31), Tacoma (23), Vancouver (21)
- Mid-tier: 66 cities with 3-5 listings, 46 cities with 6-10
- 7 listings tagged "Unknown" city (5 WA, 2 OR) - should be cleaned up

## Threshold
- Show nearby suggestions when a city has fewer than 3 listings
- Cities with 3+ listings get the normal experience
- The threshold can be adjusted as listings grow

## Action Items
- [ ] Add nearby city logic (geographic proximity or state-level region grouping)
- [ ] Build "nearby groomers" component for thin city pages
- [ ] Build "be the first" CTA component for thin city pages
- [ ] Clean up 7 "Unknown" city listings (assign correct city or remove)
- [ ] Consider adding more descriptive content to thin city pages (neighborhood info, local context) per V1 SEO strategy
