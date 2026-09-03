# Programmatic SEO: Consolidate & Expand — Design

**Date:** 2026-07-06
**Status:** Approved (design), pending spec review
**Owner:** Camren
**Related:** `2026-03-28-featured-listings-strategy-design.md`, forthcoming barter-plan-redesign spec

## Context

GroomLocal (`groomlocal.com`) is a PNW pet-grooming directory (Next.js 16 + Supabase + Tailwind v4), live since ~2026-03-10, then paused for ~3 months. Restarting 2026-07-06.

Current programmatic footprint (measured against production Supabase 2026-07-06):

- **1,000 listings** across WA (757) and OR (243).
- **246 distinct cities**; only **118 are indexable** (template `noindex`es any city with <3 listings). The other **128 cities are `noindex`ed** — 1–2 listings each.
- Of the 118 indexable city pages, **117 already have full enrichment content** (neighborhoods, parks, trails, FAQ, pricing). Exactly one thin indexable page exists: Dayton, WA.
- Existing route types: `dog|cat|mobile-grooming/[state]/[city]`, `/groomer/[slug]`, `/services/[slug]`, `/specialties/[slug]`, state pages, blog, resources.
- Schema is mature (`src/lib/schema.ts`): LocalBusiness (with OfferCatalog + PriceSpecification — `priceRange` deliberately omitted as Google-deprecated), BreadcrumbList, WebSite, Organization, FAQPage, ItemList, city/state/service page schema, BlogPosting.
- Ranking reality (DataForSEO, 2026-07-06): **50 ranked keywords, ~50 est. monthly organic visits.** Competitors: pawsh.app ~470 kw / ~800 visits; groomscout.com ~18 kw / ~7 visits (effectively dead); groomit.me ~6,371 kw / ~36,000 visits.

**Key insight:** Raw page count is not the bottleneck — there are already ~1,750 programmatic pages ranking for only 50 keywords. Depth on indexable city pages is ~99% done. The factors suppressing rankings are (1) near-zero domain authority / backlinks, (2) the 3-month freshness gap, and (3) dead surface locked behind the `noindex` gate. Authority is addressed by the separate **barter-plan-redesign** spec. This spec covers the programmatic-page levers: activate dead surface and add high-intent net-new page types.

## Goal

Grow ranked-keyword surface and qualified organic traffic by (a) converting the 128 dead city pages into indexable value, and (b) adding net-new page types validated by real keyword demand — without repeating the thin-content pattern that weakens Groomit/Pawsh.

## Non-goals / Out of scope

- Backlinks / domain authority (barter-plan-redesign spec).
- Review or ratings features (removed by prior strategic decision).
- Pricing-tier changes.
- SaaS competitor comparison pages (`groomit`/`pawsh` alternatives) — DataForSEO shows ~0 search demand; explicitly dropped.

## Keyword Evidence (DataForSEO, US monthly volume, 2026-07-06)

| Cluster | Example keyword | Volume | Competition |
|---|---|---|---|
| Breed | poodle grooming | 14,800 | LOW (KD 7–13) |
| Breed | poodle haircut styles | 14,800 | LOW (KD 3) |
| Breed | shih tzu grooming | 8,100 | LOW |
| Breed | goldendoodle grooming | 2,900 | LOW |
| Breed | goldendoodle haircut styles | 1,900 | LOW |
| Breed | bernedoodle grooming | 880 | LOW |
| Cost | dog grooming cost / dog grooming prices | 3,600 each | LOW (KD 26) |
| Cost | how much does dog grooming cost | 1,600 | LOW |
| Cost vs chains | petsmart grooming cost (+ many variants) | ~6,600 each | LOW (KD 12–22) |
| Cost vs chains | petco grooming cost | 4,400 | LOW (KD 2) |
| SaaS compare | groomit / pawsh / groomit alternatives | ~0 | — (dropped) |

Notes: "dog grooming cost calculator" has ~0 volume — the calculator is a UX asset, not a keyword target; its page targets the "cost/prices" terms. Breed volumes are national/informational (link magnets). WA-scoped volumes are smaller (e.g. poodle grooming 390/mo, shih tzu 170/mo) but confirm regional demand.

## Design

### Phase 1 — Consolidate & Expand (no new listing data)

Six components. Components are independently shippable; suggested priority order reflects the keyword evidence.

#### Component 1 — County consolidation hubs (activate the 128 dead cities)

**Problem:** 128 cities have enrichment + 1–2 listings each but are `noindex`ed for thinness, so their content counts for nothing.

**Solution:** A county-level hub route that aggregates all sub-threshold cities in a county into one genuinely non-thin, indexable page.

- **Route:** `/dog-grooming/[state]/county/[county]` (mirror later for cat/mobile only if warranted; dog-first).
- **County derivation:** map each listing to a county using existing `zip` (primary; ZIP→county lookup table) with `lat`/`lng` as fallback. Persist a `county` value (denormalized field or derived at build time via a mapping module `src/lib/counties.ts`).
- **Hub content:** aggregated listing list across the county's cities; combined enrichment highlights (parks/spots pulled from constituent cities); county-level intro; internal links down to each constituent city page and up to the state page; FAQ.
- **Thin city pages:** remain `noindex,follow`, gain a prominent "See all groomers in {County}" link to their hub. (Canonicalizing thin cities to the hub is an alternative; default is `noindex,follow` + internal link, preserving the city URL for future activation.)
- **Indexability gate:** a county hub is indexed only if it aggregates ≥3 listings total (nearly all will).
- **Schema:** reuse `cityPageSchema` / `itemListSchema` shape adapted to county + `BreadcrumbList`.
- **Sitemap:** add county hubs to sitemap chunk 2.

#### Component 2 — Breed grooming guides (highest-priority new type)

- **Route:** `/dog-grooming/breeds/[breed]`.
- **Coverage:** ~12–15 guides for the highest-volume / lowest-KD breeds: poodle, goldendoodle, doodle (generic), shih tzu, golden retriever, bernedoodle, plus next tier by volume (e.g. maltese, yorkie, labradoodle, cockapoo, shih poo, husky, german shepherd, cavapoo). Final list ranked by a DataForSEO pull at implementation time.
- **Content per guide (depth to avoid thin-content):** coat type & grooming frequency; common haircut/style options; what a groom involves; typical cost range (ties to Component 3); at-home care tips; breed-specific cautions; CTA into WA/OR groomers.
- **Groomer linking:** only 27 listings carry structured `breeds` data, so guides link broadly to the directory / relevant city hubs rather than rendering a filtered "groomers for this breed" list initially. Revisit once breed coverage improves (Phase 2 / claims).
- **Schema:** `Article` + `FAQPage` + `HowTo` (grooming steps).
- **Content rules:** hand-authored or LLM-assisted with human review; must pass the slop rules below.

#### Component 3 — Cost guide + interactive calculator

- **Route:** `/dog-grooming-cost`.
- **Targets:** "dog grooming cost", "dog grooming prices", "how much does dog grooming cost".
- **Calculator:** interactive estimator — inputs breed/size, coat condition, service type (bath/full groom/de-shed/nails), optional add-ons → estimated price range. Backed by existing `price_min` / `price_max` listing data plus PNW regional averages. Client component, no external deps (matches "avoid heavy animation libraries / keep it light" brand note).
- **Cost guide body:** national vs PNW pricing context, what drives price, tipping norms, FAQ.
- **Schema:** `FAQPage` (+ optional structured price table).

#### Component 4 — Chain-comparison pages (re-targeted from SaaS compare)

- **Route:** `/dog-grooming-cost/[chain]` or `/compare/[chain]` — e.g. `petsmart`, `petco`.
- **Targets:** "petsmart grooming cost" cluster (~6,600/mo, KD 12–22), "petco grooming cost" (4,400/mo, KD 2).
- **Content:** explain the chain's typical grooming pricing/structure, honest pros/cons vs an independent local groomer, then convert to "find an independent groomer near you" (link to city/county hubs). Informational, not disparaging.
- **Schema:** `FAQPage` + `BreadcrumbList`.
- **Dropped:** groomit/pawsh SaaS comparisons (no demand).

#### Component 5 — ZIP code search (UX feature, not a page type)

- ZIP input → resolve to nearest city or county hub via `lat`/`lng` (haversine over listing coordinates) or a ZIP→city map.
- Surfaced on the homepage search and `/search`. Supports "near me / 98101" intent.
- No new indexable pages; a resolver + redirect.

#### Component 6 — Branding & content consistency (cross-cutting)

- All new pages reuse existing components (`WaveDivider`, `AdSlot`, listing cards), color tokens, Fredoka/Inter typography, and `src/lib/schema.ts` helpers.
- Copy rules (from feedback memory): **no em dashes; no AI-slop phrasing; use "dog" not "furry friend".** Run `/slop-check` on generated copy.
- New routes added to `sitemap.ts` and internally linked from relevant existing pages (city → county hub → breed/cost guides).

### Phase 2 — OSM data seeding (sequenced later)

Deferred until Phase 1 ships and barter backlinks begin landing (more listings without authority won't rank).

- Import groomers from existing `groomers_osm.json` / `overpass.js` pipeline.
- De-dupe against the current 1,000 listings (name + address / geo proximity).
- Flag imported records unclaimed; apply a quality gate (name, address, at least phone or website).
- Purpose: push more cities over the 3-listing threshold so they index individually, and strengthen county hubs.

## Data & schema changes

- **County mapping:** `src/lib/counties.ts` (ZIP→county table + lat/lng fallback) and/or a denormalized `county` column on `business_listings` (migration). Decide at plan time; leaning on a build-time module to avoid a migration if the ZIP table is reliable.
- **No changes** to LocalBusiness schema (already correct; `priceRange` intentionally absent).
- **Breed data:** no schema change; guides use static breed content, not the sparse `breeds` column.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Breed guides become thin/templated | Depth requirements per guide; human review; `/slop-check`; unique per-breed specifics (coat, styles, cautions). |
| County-from-ZIP mapping inaccuracy | Use authoritative ZIP→county table; lat/lng fallback; spot-check WA/OR counties. |
| Breed→groomer filtering weak (27/1000 have breed data) | Guides link broadly to directory initially; add filtered lists after coverage improves. |
| Adding pages without authority won't move rankings | Accepted; this spec is the surface lever, barter spec is the authority lever; they compound. |
| Chain-comparison pages read as disparaging / brand risk | Keep informational and factual; focus on converting to local, not attacking chains. |

## Success criteria

- 128 dead cities consolidated into county hubs; dead indexable-thin count → 0 (Dayton fixed or consolidated).
- ~12–15 breed guides + cost guide/calculator + chain-comparison pages live, indexed, in sitemap, internally linked.
- Ranked-keyword count rises from the 50 baseline over the following 8–12 weeks (tracked via DataForSEO), acknowledging authority is the co-dependent lever.
- All new pages pass brand/slop review and reuse existing design system.

## Open decisions for the implementation plan

1. County hub route shape (`/[state]/county/[county]`) and whether to mirror for cat/mobile (default: dog-only first).
2. `county` as denormalized column vs build-time module (default: module unless ZIP table proves unreliable).
3. Thin-city handling: `noindex,follow` + up-link (default) vs canonical-to-hub.
4. Final breed list and ordering (DataForSEO pull at plan time).
