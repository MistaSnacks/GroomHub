# Legal Basics: Privacy Policy and Terms of Service

## Decision
Replace auto-generated legal pages with accurate, custom policies before groomer outreach begins.

## Why This Can't Stay Auto-Generated
- Auto-generated privacy policies don't describe the actual data flows (leads sent to groomers via Resend, Vercel Analytics, newsletter via Resend, Supabase storage)
- Scraped listings displayed without groomer consent need legal cover
- Groomer-edited content (after claiming) is user-generated content that needs terms
- WA state has evolving privacy laws. Getting basics right now avoids problems later.

## What's Needed

### Privacy Policy (rewrite)
- What data is collected: groomer profiles (scraped + self-edited), pet owner contact form submissions, newsletter emails, analytics
- How data flows: contact form messages emailed to groomers via Resend, analytics via Vercel
- Data retention: how long leads/messages are stored
- Deletion: account deletion removes auth + unclaims listings (already built)
- Cookies: Supabase auth cookies, Vercel analytics

### Terms of Service (new)
- Scraped data disclaimer: listings sourced from public data, groomers can claim and correct
- User-generated content: groomers grant GroomLocal right to display edited content
- Accuracy: GroomLocal not liable for inaccurate listing info
- Content removal: GroomLocal reserves right to remove inappropriate content
- Beta terms: founding member features subject to change (supports the 90-day barter program)

### CAN-SPAM (newsletter)
- Every email must include unsubscribe link
- Resend handles this if configured properly
- Physical mailing address required (can be PO box)

## Timing
- Must be done before first outreach visit
- Doesn't need a lawyer, but needs to be accurate and specific to GroomLocal's actual data practices
- Review and update after any major feature change (payments, new integrations)

## Action Items
- [ ] Audit current auto-generated privacy page for accuracy
- [ ] Rewrite privacy policy to reflect actual data collection and flows
- [ ] Write terms of service covering scraped data, user content, and beta terms
- [ ] Ensure Resend newsletter includes unsubscribe link and physical address
- [ ] Add link to ToS in the claim flow (checkbox: "I agree to the Terms of Service")
