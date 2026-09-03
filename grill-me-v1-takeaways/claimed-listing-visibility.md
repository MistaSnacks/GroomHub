# Claimed Listing Visibility: Verified Badge on All Cards

## Decision
Extend the "Verified" indicator to listing cards for ANY claimed listing, not just Featured/Premium tiers.

## Current State
- Profile pages: Claimed shows "Verified owner" text, unclaimed shows claim CTA. This works.
- Listing cards: Only Featured/Premium get visible badges (paw-verified, best-in-show)
- Free/Standard claimed listings look identical to unclaimed on city pages
- Featured listings already sort to top of city results

## The Change
In `listing-card.tsx`, extend the verified badge condition to include any listing with an `owner_id` (not just `is_paw_verified` or premium/featured tier). Small checkmark + "Verified" text, same style as current badge but available to all claimed listings.

## Why
- **Pet owners**: Can distinguish actively managed listings from scraped data. Builds trust.
- **Claimed groomers**: Get immediate visible reward for claiming, even on Free tier. Feels worth the effort.
- **Unclaimed groomers**: See competitors with a badge they don't have. FOMO drives claims.
- **Implementation**: Near-zero effort. The badge component and conditional logic already exist.

## Visual Hierarchy (important)
- Unclaimed: No badge
- Claimed (Free/Standard): Small "Verified" checkmark
- Featured: "Verified" + "Paw Verified" badge
- Premium: "Verified" + "Paw Verified" + "Best in Show" badge + top sort position

Each tier adds visible value. This creates a clear ladder that groomers can see on the city page.

## Action Items
- [ ] Update listing-card.tsx verified condition to check `owner_id` presence (not just tier)
- [ ] Ensure the badge is subtle enough to not compete with Featured/Premium badges
- [ ] Verify horizontal card variant gets the same treatment
