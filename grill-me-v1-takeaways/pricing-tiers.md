# Pricing: Collapse to 3 Tiers

## Decision
Reduce from 4 tiers to 3 using decoy pricing psychology. The middle tier is the target.

## New Structure

| Tier | Price | Role |
|------|-------|------|
| **Free** | $0/mo | Anchor. Basic listing, gets groomers in the door |
| **Basic** | ~$15-20/mo | **Target tier.** The one we want most groomers to choose. Good value, clear upgrade from free |
| **Premium** | ~$40-50/mo | Decoy/aspirational. Makes Basic feel like a bargain. Top placement, badges, lead gen |

## Psychology
- 3 options avoids decision paralysis (4 was too many)
- Premium exists to make Basic look reasonable by comparison
- Free exists so groomers can see the platform before committing
- Most groomers will land on Basic, which is the goal

## Action Items
- [ ] Decide exact feature split between Basic and Premium
- [ ] Decide exact price points (keep Premium high enough to make Basic feel easy)
- [ ] Update `/src/lib/pricing.ts` (currently has 4 tiers)
- [ ] Update pricing page UI
- [ ] Update claim flow tier selection
- [ ] Simplify tier-based feature gating in codebase (fewer conditionals)

## Feature Split (to decide)
What makes Basic worth $15-20? What justifies Premium at $40-50?
The answer should come from real groomer feedback during outreach, not guessing.
Starting suggestion:
- **Basic**: Multiple photos, hours, website link, services/specialties displayed, ad removal, basic analytics
- **Premium**: Everything in Basic + top placement in city, Paw-Verified badge, lead notifications, homepage spotlight
