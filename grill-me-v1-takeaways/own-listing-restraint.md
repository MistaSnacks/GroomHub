# Own Listing: Stay Visually Equal

## Decision
Own grooming business listing gets the same treatment as any other claimed Free tier listing. No special badges, no top placement, no premium features visible.

## Why
- If the site looks like an ad for your own business, groomers won't trust it
- "This guy built a directory to promote himself" kills credibility instantly
- Groomers need to see a peer, not a platform owner gaming his own system

## Rules
- Claim on Free tier. Same "Verified" checkmark as everyone else.
- Fill it out completely (photos, hours, services, description) as a demo of what a polished listing looks like
- No premium badges (no Best in Show, no Paw Verified)
- No artificial top placement in city results
- Do not feature own listing in the homepage "Premium Groomers" section

## The Pitch Benefit
- "I'm listed too, same as you. Here's mine." shows you eat your own cooking
- A polished Free listing is the best demo of what claiming gets you
- Groomers see equal treatment, not favoritism

## When to Change
- Once 10-20 other groomers have claimed and the directory has real traffic
- At that point, own listing blends in as one of many
- Can quietly upgrade then without it being obvious

## Revision 2026-09-04: reverted and re-featuring rules

Sarah's Groomingdale's had drifted to `premium` + `is_featured` (homepage and Lakewood top spot). Reverted to `free`, unfeatured, on 2026-09-04. It stays claimed with the Owner Confirmed badge and a complete profile, which is the intended demo.

Rules for moving it back up later:
1. Only as a Sponsored seat on the same terms as any sponsor: same $49 price, actually recorded, same "Sponsored" label, same rules. Never a free spot, a badge, or a sort tweak.
2. Trigger: at least 10 other claimed listings AND at least 3 paying sponsors elsewhere on the site, so it is never the first or only Sponsored listing.
3. Never take a seat in a city where a paying sponsor is on the waitlist. A seat she holds is one that cannot be sold there.

### Trigger implementation (2026-09-04)
- `business_listings.sponsor_paid_until` (timestamptz, admin-only, protected by the privileged-columns trigger). A listing counts as a **paying sponsor** only while this is in the future. Beta/free Premium does not count.
- The house listing slug lives only in the `HOUSE_LISTING_SLUG` env var (Vercel prod + .env.local), never in the repo or DB schema.
- `src/lib/refeature-trigger.ts` computes: other claimed >= 10, paying sponsors elsewhere >= 3, house not currently sponsored.
- Admin dashboard (`/admin/dashboard`) shows a "House listing re-feature trigger" card with live counts.
- Daily Vercel cron (`vercel.json`, 15:00 UTC) hits `/api/cron/refeature-check` with `CRON_SECRET`; emails `LISTING_NOTIFY_EMAIL` while conditions are met and the house listing is still free.
- To record a paid sponsor: `update business_listings set subscription_tier='premium', is_featured=true, sponsor_paid_until='<paid-through>' where slug='<sponsor>'`.
