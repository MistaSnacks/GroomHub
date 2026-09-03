# Per-Listing Analytics: Vercel Analytics API

## Decision
Use Vercel Analytics API to pull per-listing view counts by path (`/groomer/[slug]`). Upgrade Vercel plan as needed for API access and data retention.

## Why This Matters
At the 90-day beta barter mark, the upgrade pitch is: "Your listing got X views and Y inquiries this quarter." Without per-listing data, you're asking groomers to pay on faith.

## Two Key Metrics Per Listing
1. **View count** - from Vercel Analytics API (page views by path)
2. **Lead count** - from leads table (contact form submissions, see contact-form-routing.md)

## Implementation
- Query Vercel Analytics API filtering by path pattern `/groomer/[slug]`
- Display on groomer dashboard: "Your listing was viewed X times this month"
- Keep it simple - total views is enough for now, no need for unique visitor dedup initially

## Action Items
- [ ] Upgrade Vercel account for Analytics API access
- [ ] Build API route or server action to query Vercel Analytics by groomer slug
- [ ] Add view count display to groomer dashboard
- [ ] Combine with lead count for the 90-day "value report" email
