# Ad Slots: Hide Now, Expand Later

## Decision
Remove all visible ad slot placeholders from pages immediately. Keep the component and placement logic so they can be reactivated when traffic justifies it.

## Why Hide Now
- Empty dashed "Sponsored" boxes look unfinished to pet owners
- Undermines groomer pitch ("are you going to plaster ads on my profile?")
- Zero traffic = zero ad revenue even if a network was integrated
- First impressions during beta/outreach phase are critical

## Implementation
- Keep `src/components/ad-slot.tsx` component file intact
- Comment out or feature-flag AdSlot usage in pages (homepage, city pages, blog, groomer profiles)
- Document current placements so they can be restored:
  - Homepage: `homepage-bottom` (leaderboard)
  - City pages: `city-{city}-mid` and `city-{city}-bottom` (leaderboard)
  - Blog articles: `blog-article` (leaderboard)
  - Groomer profiles: `groomer-sidebar` (sidebar)

## Future: More Placements
When traffic is high enough (50k+ monthly target from V1), expand ad inventory beyond current slots. Potential additions:
- Between listing cards on city pages (native ad format)
- Blog sidebar (sticky)
- Search results page (if built)
- Service/specialty landing pages
- Keep ad density reasonable - no more than 2 per page view

## Action Items
- [ ] Remove/comment out AdSlot renders from all pages
- [ ] Add feature flag or env var (e.g. `NEXT_PUBLIC_SHOW_ADS=true`) for easy reactivation
- [ ] Keep component file and format types for future use
