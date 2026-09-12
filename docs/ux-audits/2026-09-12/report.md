GroomLocal site walkthrough — September 11–12, 2026

Follow-up: the [pricing, booking, and controlled signup report](pricing-booking-signup.md) records the subsequent live data corrections and real owner tests. Its results supersede the unresolved pricing/booking and ownership-mutation items below.

The main discovery and signup interfaces have been repaired and checked on the public site. The final mobile claim correction prevents the sticky business summary from overlapping the signup form. Hold the broad groomer recruitment push until questionable listing data is verified and one real account completes email confirmation and onboarding.

The walkthrough used Chrome at 320, 390, 768, 1024 and 1440 pixels. It sampled pet-owner discovery, groomer acquisition, forms, menus, pricing, recovery states, and guide reading. Tests did not send leads, contact messages, or real confirmation emails, submit a business, claim another business, or purchase sponsorship.

| Journey | Evidence and result |
| --- | --- |
| Homepage navigation | Desktop dropdowns, Escape dismissal, compact menu, city/service links. Fixed 768px header overflow (939px before). |
| Search | Portland, Seattle Canine Club, 98122, and Portland mobile return groomers. Before the repair, live Portland and business-name searches returned none. |
| Portland mobile groomer | City page → Mobile Grooming filter → Jackie's Clip Joint → phone, profile and claim entry. Booking destination needs verification (below). |
| Seattle cat groomer | Cat service and Seattle listings load. Cat pricing no longer displays dog-weight categories. |
| Tacoma anxious-pet search | Fear-Free / Anxiety filter returns 3 listings; filter survives reload; Clear all returns 23. |
| Secondary city samples | Bend and Bellevue load; other routes include Portland mobile, services and specialties. |
| Claim lookup | Existing business found; short/cleared queries discard stale results; simulated outage shows a retry message instead of suggesting a duplicate submission. |
| Signup and login | Required fields and short-password validation; switching pages retains the intended claim; confirmation redirect retains it too. Signup network response was intercepted, so this is frontend coverage, not proof of account creation or delivery. |
| Password recovery | Simulated recovery shows password-reset instructions rather than verification-email instructions. Return destination survives recovery and expired-link handling. No actual reset email sent. |
| Claim confirmation | Replaced misleading plan selection (which always created a free claim) with a clear free-listing confirmation. Beta photo allowance comes from existing tier limits. Authenticated ownership mutation has not been exercised. |
| Quote flow | Cat sizes and services now fit cats. All four steps exercised; simulated server failure preserves contact details. Copy now explains operator review during beta rather than promising immediate notification of groomers. |
| Pricing | Monthly/annual toggle checked; annual savings copy matches displayed values. Sponsorship CTA leads to contact rather than suggesting that a free claim reserves a paid spot. |
| Supporting routes | About, Contact, Resources, Privacy, Terms, blog index, ear-cleaning guide, and 404 recovery checked. All 17 guide links appear on the index; sampled rendered guide images load. |

Published repairs also remove imported editor text from displayed descriptions, hide empty profile galleries and empty trust panels, replace unknown “N/A” prices with “Ask for a quote,” group legacy city slugs into a single city link, and replace blanket “verified” count claims with “listed.” No original business records were overwritten. Existing unrelated workspace changes were preserved with three-way merges.

The database issue was observable in the Vercel build: parallel page generation returned “Gateway Timeout” for full listing and city reads. The old code returned empty or partial arrays on failure, making a failed directory query look like a legitimate empty result. The corrected build uses two workers and bounded page-generation concurrency, retries only transient read responses, throws on critical directory read failures, and uses a fresh complete-listing cache key. The next build succeeded with populated search results. Next documents the page-generation concurrency setting in its [configuration reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/staticGeneration).

Remaining launch checks:

1. Verify listing accuracy. Across 1,178 public records, 169 contained the imported phrase “Drag to change, click to remove”; it is now suppressed when rendered. Floof Pet Grooming displays a $20–$2,000 range and Viva La Pooch displays $615–$4,739. These are suspicious, not verified prices; do not substitute guessed values.
2. Verify booking destinations and duplicates. Jackie's Clip Joint points to a Facebook page named `mudpuppieslombard`. DogSpaw and The Shampooch share a booking destination named The Painted Pooch. Sarah's Groomingdale's appears under Lakewood and Tacoma entries sharing a booking URL. Best In Show has two Brookings entries. Shared destinations can be legitimate, so records need checking before changing or merging them.
3. Complete one controlled real signup: receive confirmation email, verify it, reach the correct claim, confirm an authorized test listing, and exercise dashboard editing. The requested test email address has not been supplied. Email deliverability, ownership mutation, and authenticated dashboard behavior remain unverified.
4. Confirm the intended ownership verification policy. The current claim action checks that the user is authenticated and the listing is unclaimed, then assigns ownership based on self-attestation. It does not independently verify affiliation with the business. No ownership change was performed in this audit.
5. Establish who handles manual quote and new-listing requests and confirm their operational turnaround before promising results in acquisition campaigns.

Validation: the public release passed 12 browser test groups with zero JavaScript page errors. The release built successfully on Vercel. Changed-file ESLint had no errors (two existing warnings: a raw image and an unused import). Bounded read retries were tested with mocked 504/503 responses; writes and authorization errors were not retried. Early rapid local multi-page runs logged intermittent React hydration warnings; isolated checks and the completed live browser run did not reproduce them. Chrome was used; Safari, Firefox, real phone hardware, real email delivery and payment processing were not tested.

Evidence and runnable checks are in `/Users/admin/GroomingBook Directory/output/site-walkthrough-2026-09-11/`: `live-browser-checks.json`, `browser-checks.cjs`, `public-data-quality.json`, `vercel-build-failure.log`, `vercel-build-second.log`, `test-read-retries.ts`, screenshots, and `publication.json`. Credentials used for read-only diagnostics were kept outside deployment source and are not part of the report.

Final live deployment: `dpl_6fok36mtuYV6W2uZDbud6DGhz7ze`. The main repair was `dpl_JAZP8bWaSAKT2eHbZa8SiCRBbN49`; the follow-up changed only the claim summary’s responsive sticky classes. All deployed source hashes matched the reviewed source.
