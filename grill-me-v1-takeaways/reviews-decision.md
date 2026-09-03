# Reviews Decision: Remove Entirely

## Decision
Remove all review-related UI and functionality from GroomLocal. This is a discovery and booking directory, not a review platform.

## Rationale
- Reviews require moderation, spam prevention, and critical mass to be useful
- Building a review ecosystem is a second startup inside the first one
- With all ratings already nuked in the March 2026 cleanup, there's nothing to preserve
- Owner wants minimal operational overhead, not a Yelp competitor

## Action Items
- [ ] Remove review cards from groomer profile pages
- [ ] Remove `review-card.tsx` component (or deprecate)
- [ ] Remove any review-related fields from the groomer profile display (rating, review_count)
- [ ] Remove star ratings from `listing-card.tsx` if present
- [ ] Update JSON-LD schema to not include `aggregateRating` (empty ratings hurt more than no ratings)
- [ ] Remove the "empty reviews" Maui mascot placement (idle animation on empty reviews section)
- [ ] Keep the database columns (rating, review_count) in Supabase for potential future use, just don't display them

## Future Consideration
If social proof becomes necessary down the road, the lightest-weight option would be pulling Google Places star counts (not full reviews) as a read-only badge. That requires no moderation and no user-generated content. But this is not a priority.
