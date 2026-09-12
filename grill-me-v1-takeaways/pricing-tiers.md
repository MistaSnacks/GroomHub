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
- [x] Update `/src/lib/pricing.ts` (done 2026-09-03: Free $0, Basic $18, Premium $50)
- [x] Update pricing page UI
- [x] Update claim flow tier selection
- [x] Simplify tier-based feature gating in codebase (fewer conditionals)

## Feature Split (to decide)
What makes Basic worth $15-20? What justifies Premium at $40-50?
The answer should come from real groomer feedback during outreach, not guessing.
Starting suggestion:
- **Basic**: Multiple photos, hours, website link, services/specialties displayed, ad removal, basic analytics
- **Premium**: Everything in Basic + top placement in city, Paw-Verified badge, lead notifications, homepage spotlight

## Revision 2026-09-04: Free + Sponsored (supersedes the 3-tier decoy)

Decided after the Astra independent strategy review (`analysis/astra-independent-directory-strategy-2026-09-04.md`, sections 5 and 7) and a code check that showed the 3-tier split was never enforced (Free already got website/hours/services; only photo count differed; no Stripe).

| Offer | Price | What it is |
|---|---|---|
| **Free** | $0 | Full listing: website, booking link, hours, services, pricing, 10 photos, contact inquiries, "Owner Confirmed" badge on claim |
| **Sponsored** | $49/mo ($41 annual) | Labeled "Sponsored" spot at the top of the city page, max 3 per city, 50 photos. DB slug stays `premium` |

- `basic` is no longer sold. It remains a valid DB tier value for compatibility.
- "Paw-Verified" renamed "Owner Confirmed" and now means exactly "the owner claimed this listing". Never derived from payment. "Best in Show" removed as an entitlement.
- Paid placement always carries a visible "Sponsored" label (cards, city featured section, homepage featured section).
- Beta barter (backlink + testimonial for free Premium) dropped. Beta is a plain 90-day free Premium with no obligations. Badge snippet now uses `rel="sponsored"`; ranking-boost copy removed.
- Ad placeholders hidden behind `NEXT_PUBLIC_SHOW_ADS=true`.
- Pricing validation gate (from Astra): 3 paying sponsors and 2 renewals before adding a state or a second paid tier.
