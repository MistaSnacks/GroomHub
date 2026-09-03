# Contact Form: Claimed Listings Only

## Decision
The contact form only appears on claimed listings (where owner_id is present). Unclaimed listings do not show a contact form.

## Why
- Unclaimed groomers never opted into receiving leads from GroomLocal
- Sending unsolicited "you have a lead" emails to scraped contacts could feel spammy
- In-person outreach is the intended first touchpoint, not a surprise email
- Once a groomer claims, they've opted in and the contact form is part of the value proposition

## Re-Verification Pipeline (Future)
- Claimed listings should eventually require annual re-verification to stay active
- Prevents stale "Verified" badges on closed businesses
- Prevents dead email addresses from eating contact form submissions
- Not needed at launch, but build awareness that this will be necessary at scale

## Implementation Note
- Check `listing.owner_id` before rendering ContactForm component on groomer profile page
- Unclaimed listings show the claim CTA in that space instead (already built)

## Action Items
- [ ] Gate ContactForm render behind owner_id check in groomer profile page
- [ ] Design the lead notification email to include "manage your listing" link to dashboard
