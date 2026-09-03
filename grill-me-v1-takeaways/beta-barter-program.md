# Beta Barter Program: Free Premium for Backlinks

## Decision
During the pre-revenue beta period, groomers who claim listings get full Premium features for free in exchange for adding a backlink to GroomLocal on their website. No Stripe needed yet.

## The Exchange
- **GroomLocal gives**: Premium features (top placement, badges, unlimited photos, analytics)
- **Groomer gives**: Backlink on their website + one-line testimonial quote
- **Bonus offer**: GroomLocal writes a spotlight blog post about their business (interview style). This is framed as a perk, not a requirement. Gives us unique content + mutual backlink.

## Data Point
- 758 of 1,178 listings (64%) have a website URL
- 420 (36%) have no website. These groomers can still claim and get the testimonial/interview exchange, but no backlink. Possible future venture: offer simple web design to groomers without sites.

## Enforcement: Graduated Nudge System

### At Claim Time
- Full features unlocked immediately
- Clear messaging: "You're getting Premium free as a founding member. In return, add a link to GroomLocal on your website."
- Provide copy-paste HTML snippet or embeddable badge
- Store `beta_claimed_at` timestamp in DB

### At 2 Weeks
- Automated email reminder: "Have you added your GroomLocal link? Here's the snippet again."
- Friendly tone, not threatening

### At 6 Weeks
- Check if backlink exists (manual for first 50 groomers, automate later)
- If no backlink: email with soft deadline. "Your founding member benefits continue through [date]. After that, free tier unless you upgrade or add your link."

### At 90 Days
- **No backlink + no payment** = downgrade to Free tier (lose top placement, badge, extra photos)
- **Backlink confirmed** = renew Premium for another 90 days (rolling)
- **Payment** = Premium regardless of backlink

## 90-Day Window Rationale
- Gives time to build traffic and prove value before asking for money
- By day 90, we'll have data: "Your listing got X views this quarter" becomes the upgrade pitch
- Rolling renewal for backlink holders keeps the SEO value flowing indefinitely

## Action Items
- [ ] Add `beta_claimed_at` column to business_listings (or use existing `claimed_at`)
- [ ] Build copy-paste backlink snippet / embeddable badge
- [ ] Set up email reminder sequence (2 weeks, 6 weeks, 90 days) via Resend
- [ ] Build simple backlink checker (curl + parse, or use a service)
- [ ] Add "founding member" messaging to claim flow UI
- [ ] Create spotlight blog post template for groomer interviews
- [ ] Collect testimonial quotes during outreach

## GBP Note
Google Business Profile for GroomLocal (the brand, not as a groomer) is worth doing in Phase 2 once there are groomers to collect reviews from. Low effort, moderate upside for brand authority.
