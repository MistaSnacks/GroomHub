# Existing grooming-guide audit — September 7, 2026

The owner requested a full review of existing guides and clarified that Hermes should create new articles with newly generated Maui artwork, leaving existing-guide maintenance to Codex.

## Scope and editorial changes

All 16 existing guides were reviewed and revised. Original production slugs, publication dates, bylines, and image references are preserved. Substantive revisions use September 7, 2026 as dateModified. Existing authored biography text was preserved, not independently credential-verified; unsupported first-person salon anecdotes and invented experience statistics were removed from article bodies.

| Guide | Main corrections |
|---|---|
| Cat grooming | Rechecked provider prices; added the checking date, direct PetSmart requirements link, and relevant provider-selection guidance. |
| Choosing a groomer | Removed unsupported certification superlatives, review guarantees, and the claim that a listing badge certifies quality/safety; added service, handling, supervision, and quote questions. |
| Seattle/Portland costs | Incorporated the previously undeployed September 4 work after rechecking actual menus; replaced invented market averages with labeled provider examples and corrected annual budgeting arithmetic. |
| Nail-trim costs | Rechecked Petco and Oh Paws, replaced the older Seattle educational estimate with a current provider example, clarified mobile-service minimums, and strengthened handling links. |
| Goldendoodle | Preserved ten style options and mini/coat coverage; removed invented popularity rankings, genetic/size assumptions, allergy claims, price averages, universal schedules, and regrowth guarantees. Added direct Doodle menu examples. |
| Anxious dogs | Removed invented case statistics, rigid training timelines, unsupported calming-product claims, and statements that comforting reinforces fear or medication cannot be sedating. Added individual triggers, stopping rules, and veterinary/behavior resources. |
| Grooming duration | Replaced fabricated minute-by-minute and breed tables with clearly attributed provider estimates; distinguished arrival windows, total visits, hands-on work, and waiting. |
| Grooming frequency | Separated brushing, bathing, cuts, and nails; replaced rigid breed/life-stage schedules and shedding percentages with coat assessments and individualized plans. |
| Mobile costs | Incorporated and rechecked the prior unpublished menu-based revision; removed invented national averages, fixed price premiums, discounts, and guaranteed appointment durations. |
| Seasonal calendar | Removed invented regional rainfall/climate claims and mandatory seasonal treatments; clarified each seasonal guide's distinct purpose and linked them. |
| Puppy first groom | Replaced fixed vaccine-dose/age clearance with veterinary and provider requirements; retained gentle early handling and removed forced progression, anecdotal guarantees, and unsupported price tables. |
| Rain and mud | Removed universal wet-brushing rules, infection statistics, product endorsements, and unsafe scissor advice; distinguished cleanup, mat assessment, and veterinary symptoms. |
| Senior care | Removed universal surcharges, unverified discounts/nonprofit programs, guaranteed savings and mobile benefits; added comfort planning and explicitly hypothetical budgeting. |
| Matted dogs | Removed blade prescriptions, pain-free shaving and regrowth promises, invented medical prices, and claims that double coats cannot mat. Added professional/veterinary triage and safer maintenance. |
| Summer | Replaced simplistic cooling claims and smoke eye-flushing advice with coat-specific decisions and direct heat, smoke, and toxic-algae resources. |
| Winter | Removed invented regional weather, blanket clipping intervals, unsupported skin diagnoses/supplements, and dismissal of de-icing risks; clarified coat care and veterinary escalation. |

All guides now have a direct opening answer, meaningful headings, reader-focused FAQs, direct source links, and contextual internal links. Length follows useful coverage rather than a quota. Broad guides link to specialist guides instead of repeating unsupported numeric rules.

## Evidence

`seo-evidence.json` records a fresh 15-keyword DataForSEO batch (13 returned records), with vendor collection dates and estimated US monthly volume. This audit has no first-party Search Console clicks, impressions, or conversion data. Rankings and traffic improvements are not guaranteed.

Direct provider menu checks: Full Moon Groom, Tail Swagger, Girl & Doggies, PDX Pet Spa, The Groom Shop, Seattle Canine Club, Petco cat/nail menus, and Oh Paws. The browser text extractor omitted prices from several menus; current raw public HTML was fetched and parsed to verify the visible menu text. Provider size labels, package scope, starting rates, hourly pricing, and geographical differences are retained. Sources are linked beside the claims in the articles.

Animal-care sources include specific VCA coat/nail/ear/hot-spot pages; AAHA behavior, cooperative-care, and senior-care guidance; ASPCA dog/cat grooming, matting, and seasonal safety pages; AVSAB's puppy socialization statement; AKC home-grooming/tool resources; AAFA's allergy guidance; AirNow pet-smoke guidance; and Washington Department of Health cyanobacteria guidance. Generic organizational homepages were replaced where they did not support a claim. AVMA pages that yielded only an iframe were not used as evidence for new claims.

SEO principles were checked against [Google's helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and [publication-date guidance](https://developers.google.com/search/docs/appearance/publication-dates). No FAQ rich-result eligibility or ranking benefit is promised.

## Presentation and technical work

- Article bylines show both published and meaningful updated dates in semantic time elements; cards show the update date without resetting publication dates or artificially moving old articles ahead of future new posts.
- RSS image enclosures now handle cache-version query strings correctly and escape image URL attributes.
- Existing BlogPosting, canonical, Open Graph, sitemap, and original publication metadata are preserved and checked during release.
- Sixteen MDX compilation, unique-slug, topic mapping, route, image dimensions, alpha-channel and transparent-corner checks passed. `content-checks.json` and `editorial-review.json` record results and exact draft hashes.
- Existing images are retained; this pass does not claim that new artwork was generated or that every old image received a new full visual review.

## Isolated release

Production source was reconstructed and matched against deployment `dpl_Aezmq1cs3yvNU5ZveKskzjCz6Yhb`. The allowlist contains exactly 16 existing article files and three date/feed presentation files. No unrelated working-tree changes or image replacements are part of this release. Source hashes must match the built deployment, and the production baseline must remain unchanged before promotion.

Release workspace: `output/groomlocal-guide-audit-2026-09-07/` in the parent workspace. Original production drafts are in `before/`; prior local versions are in `before-local/`. The authoritative deployment result and public checks are `publication.json` and `live-checks.json` there. A missing publication record means the release is not yet verified live.

The release is verified live at https://groomlocal.com/blog on deployment `dpl_5tHrer3P5TB92NfLUh5ykUTaB4pC`. The isolated Vercel build succeeded; all 476 deployed source hashes matched the reviewed stage, with exactly the 19 allowed files changed. All 16 preview and public articles passed the rendered content, canonical, indexability, heading, structured-data date, listing, RSS enclosure, sitemap, and served-image checks. Browser visual QA was unavailable because the computer-use tool reported "No browser is available"; rendered HTML checks and image-file validation succeeded.

## Hermes going forward

The policy, installed skill, and live job prompt now require one genuinely new, nonoverlapping article with a new topic-specific Maui illustration. The publisher requires `--new` and `--asset`, rejects existing slugs in new mode, rejects byte-identical production artwork, and verifies that the MDX uses the new asset. The skill also requires intent-level deduplication, fixed approved Maui identity, image-generation provenance, transparent export, visual review, DataForSEO research, and GTM verification.

The schedule, subscription model, toolsets, and delivery target are unchanged. The cron prompt invokes preflight directly because scheduler script-path validation rejected the repository path. Before/after job and skill snapshots are saved alongside this report. The requested immediate run is to begin after the existing-guide release is verified live.

After live verification, `hermes cron run 7d9933d99b17` successfully queued the requested immediate run at September 7, 2026, 10:50 Pacific. This queue acknowledgment is not evidence of article publication; the new run's publication and GTM results are tracked separately.

The requested Hermes run finished successfully at 11:25 Pacific and published [Dog Ear Cleaning at the Groomer](https://groomlocal.com/blog/dog-ear-cleaning-grooming-guide) on deployment `dpl_EutGLjn2qMJi3jHxq14UKXgbju9r`, with a newly generated Maui scene. Its output is in `output/groomlocal-weekly/2026-09-07_105118-625253/`. Codex independently verified all production source hashes against the reviewed release, plus the canonical article, listing, RSS, sitemap and exact served PNG bytes. This resolves the publisher's immediate post-promotion HTTP 404 without another publication. The local new article, PNG and topic membership were synchronized while preserving unrelated local changes.

The new-image review found cropped props in initial generations and opaque enclosed background in the first RGBA derivative. Those concrete findings were sent back for correction; the first in-flight publisher was stopped before promotion and the image check marked false until corrected. The installed skill now explicitly requires a numbered enclosed-region review, reliable run-local temporary setup, and the image helper's dependency-aware runtime. DataForSEO records now retain the exact 12 requested keywords, seven returned records and original domain-ranking output (216 total, 50 returned), and distinguish advertising competition from organic difficulty.

The owner subsequently identified a fifth limb in the retained pricing-guide illustration. That was outside this pass's original unchanged-image scope. The four-leg edit is verified live on deployment `dpl_7qZdD3FUpVe2VFcTmJyhWbaydcpp`. After both built-in edit attempts returned RGB checkerboard backgrounds, the owner explicitly approved the existing extractor. Full-resolution and display-size review on cream, teal and dark backgrounds passed, with opaque foreground RGB preserved. The release also clears the last enclosed background gap in the ear-cleaning artwork. Both image URLs now carry fresh cache versions. The isolated build, exact production source hashes, article/list/feed/sitemap and public image-byte checks passed. Evidence and the publication record are in `output/maui-cost-four-limbs-2026-09-07/`. The original six appearance references remain untouched.
