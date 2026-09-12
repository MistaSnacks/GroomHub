# GroomLocal editorial audit — September 4, 2026

The highest-value first action was to refresh the mobile grooming cost guide and its linked Seattle/Portland salon price guide. The mobile article already appears in DataForSEO's ranking and ChatGPT citation datasets. Both articles contained unsupported market averages, fixed mobile premiums, and local price claims that were inconsistent with the public provider menus checked during this run.

## Evidence and scope

Reviewed the inventory of 15 existing articles, batched 15 candidate search phrases, inspected live national SERPs for dog grooming cost, Goldendoodle grooming, cat grooming cost, and mobile dog grooming cost, and checked AI citation and backlink data. The compact API evidence is in `evidence.json`.

DataForSEO returned 176 domain ranking records in total; this audit retrieved the top 30. In that sample the mobile guide ranked 9 for “how much does mobile grooming cost” and 12 for several related phrases. These are third-party observations with the collection dates recorded in the evidence, not current Search Console positions, clicks, or conversions. No Search Console or first-party conversion analytics were available in this run.

For the mobile cost phrase, the ChatGPT top-pages response included the GroomLocal article with five mentions in its returned page bucket. A separate Google domain query returned 25 source-domain mentions. These counts have different scopes and must not be added or treated as visits. The exact Google mobile-cost phrase query returned no records; that does not mean the site is absent from Google AI Overviews generally. An initial domain filter using `answer` was rejected; rerunning with the API-supported `any` scope succeeded.

| Candidate phrase | Estimated US monthly searches | Intent from provider | Decision |
|---|---:|---|---|
| dog grooming cost | 3,600 | Informational | Refresh local pricing guide; current examples were needed |
| goldendoodle grooming | 2,900 | Transactional, with secondary intents | Future refresh candidate; existing article already covers styles and care |
| cat grooming cost | 1,000 | Informational | Future pricing-source audit candidate |
| dog grooming tipping | 880 | Mixed | Address useful tipping arithmetic within existing price guides first |
| dog nail trimming cost | 880 | Informational | Possible future standalone guide after checking service-page overlap |
| mobile dog grooming cost | 590 | Informational/commercial | First priority due to existing rankings and citations |
| how long does dog grooming take | 590 | Informational | Existing guide; monitor before another rewrite |
| how often should you groom your dog | 390 | Informational | Existing guide; future accuracy/source review |
| dog grooming for anxious dogs | 320 | Mixed | Existing April update; requires careful health-source review |
| puppy first grooming | 210 | Informational/commercial | Existing April update; retain, monitor queries |
| matted dog grooming | 110 | Commercial/transactional | Existing guide; welfare and source quality matter more than keyword volume |
| how to choose a dog groomer | 10 | Informational | Useful conversion-support content despite low exact-phrase volume |
| winter dog grooming | 10 | Informational/commercial | Low exact-phrase demand; do not create a duplicate merely for seasonality |

The two local “dog grooming cost Seattle/Portland” phrases were omitted from the keyword response, so their volumes are unavailable, not zero. Volumes are estimates; the keyword data was last updated in August 2026. Advertising competition fields are not organic SEO difficulty.

Backlink ranks on the requested 0–1000 scale were GroomLocal 63, Wag'n Tails 222, Rainbow Groomers 118, Raise The Wuff 228, and Seattle Canine Club 224. This is comparative context, not proof that a given score difference causes or prevents rankings. GroomLocal's existing citations already show why an “authority below 100 means no traction” assumption would be wrong.

## Changes completed

- `mobile-dog-grooming-cost-guide`: Replaced unsourced national-average tables and fixed percentage premiums with attributed provider examples. Added provider size-bracket and package distinctions, annual budget arithmetic, practical quote questions, mobile-service tradeoffs, and five FAQ answers. Removed unsupported discount, timing, and directory capability guarantees. Preserved the title, slug, original publication date, and image.
- `dog-grooming-cost-seattle-portland-2026`: Replaced city-average and chain-price assertions with linked Seattle and Portland salon menus, clarified starting prices and service definitions, added optional tip arithmetic and five structured FAQ answers, and linked the mobile guide and quote flow. Preserved the title, slug, original publication date, and image.
- Both guides now record the substantive update as September 4, 2026 and state the pricing method and its limits. Existing topic assignments remain Cost & Pricing. No new article was created in this initial pass.

The refreshed bodies are approximately 1,624 words (mobile) and 1,338 words (regional). The objective was better-supported answers, not a word-count increase. The weekly job will be limited to one substantive article; this initial audit refreshed both related pricing guides together to eliminate contradictory price claims.

## Primary pricing sources checked

- [Full Moon Groom — SW Portland](https://www.fullmoongroom.com/): Full groom starts at $145 / $175 / $220 for its stated size brackets; Poodle/Doodle work is hourly.
- [Tail Swagger — Portland metro](https://www.tailswaggerpdx.com/services): Swagger Groom, Doodle Groom, and bath-only packages are separately priced.
- [Girl & Doggies — Seattle area](https://girldoggies.com/): Full-groom menu lists $160 / $220 / $270 / $300 by size category.
- [The Groom Shop — Portland](https://www.thegroomshoppdx.com/services): Bath-and-haircut packages and extra-service menu.
- [PDX Pet Spa — Portland](https://pdxpetspa.com/): Separate basic bath, full bath, tidy, and haircut columns with weight brackets.
- [Seattle Canine Club](https://seattlecanineclub.com/services/dog-grooming-seattle/): Long-coat full-groom weight brackets and location-specific qualifications.

These are a small nonrepresentative set of advertised menus, not a market survey or endorsement. Verify each source again before using its prices in a future update.

## Verification and next run

The full Next.js production build and TypeScript checks passed. Frontmatter, original slugs/publication dates, referenced image files, topic membership, internal route patterns, and external citation presence were checked. No images were changed, so this run did not generate or claim a new Maui visual review.

The next editorial run should inspect fresh performance/search evidence and choose one useful refresh or one nonoverlapping new article. Cat pricing, Goldendoodle source quality, and nail-trim pricing are candidates, not a locked publication calendar. Measure guide-to-directory and guide-to-quote conversions when first-party analytics are available.

**Publication status: local edits, not deployed by this audit.** The workspace also contains unrelated ongoing changes; do not deploy it wholesale as an editorial-only release.
