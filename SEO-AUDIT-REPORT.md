# GroomLocal.com - Full SEO Audit Report

**Date:** March 7, 2026
**Domain:** groomlocal.com
**Business Type:** Local pet grooming directory (Washington & Oregon)
**Pages in Sitemap:** 1,151
**Google Indexed Pages:** 0

---

## SEO Health Score: 43/100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 74/100 | 18.5 |
| Content Quality | 25% | 46/100 | 11.5 |
| On-Page SEO | 20% | 60/100 | 12.0 |
| Schema / Structured Data | 10% | 35/100 | 3.5 |
| Performance | 10% | 65/100 | 6.5 |
| Images | 5% | 50/100 | 2.5 |
| AI Search Readiness | 5% | 48/100 | 2.4 |
| **INDEXING PENALTY** | | | **-14.0** |
| **TOTAL** | | | **38/100** |

> The indexing penalty reflects that 0 pages are currently in Google's index, which nullifies all other SEO work until resolved.

---

## EXECUTIVE SUMMARY

### The #1 Problem: You're Invisible to Google

`site:groomlocal.com` returns **zero results**. Despite having 1,151 URLs in the sitemap, proper meta tags, no noindex directives, and a working robots.txt, Google has not indexed a single page. There are also zero backlinks and zero brand mentions found online.

**Root causes:**
1. No Google Search Console verification file found in the codebase
2. No inbound backlinks from any external domain
3. Domain appears to be very new with no crawl history
4. Sitemap is not submitted to Google

### Top 5 Critical Issues

1. **Zero Google indexation** - No pages indexed at all
2. **No Google Search Console setup** - Can't monitor, submit sitemap, or diagnose crawl issues
3. **~90% of city pages are thin content** - Only ~10 cities have enhanced content; the rest have <100 words of unique text
4. **About page lacks trust signals** - No team names, no address, no verification methodology explained
5. **Schema markup missing on high-value pages** - Homepage, city pages, and state pages have zero JSON-LD

### Top 5 Quick Wins

1. Set up Google Search Console and submit sitemap (30 min)
2. Add WebSite + Organization schema to homepage (15 min)
3. Add BreadcrumbList + ItemList schema to city pages (1 hr)
4. Fix empty openingHoursSpecification bug in schema.ts (5 min)
5. Fix numberOfItems mismatch in service page ItemList schema (5 min)

---

## 1. TECHNICAL SEO (Score: 55/100)

### Indexability: CRITICAL

| Check | Status | Details |
|-------|--------|---------|
| Google Index | FAIL | 0 pages indexed |
| Google Search Console | FAIL | No verification file found |
| Sitemap | PASS | 2,046 URLs at /sitemap.xml (1,178 groomers + 868 pages) |
| robots.txt | PASS | Properly configured, allows crawling |
| noindex tags | PASS | None found |
| Canonical: Homepage | FAIL | Missing `<link rel="canonical">` and `og:url` |
| Canonical: /blog | FAIL | Only in RSC payload, not initial HTML |
| Canonical: City pages | PASS | Present and correct |
| Meta robots | PASS | No blocking directives |

### Caching & Performance

| Check | Status | Details |
|-------|--------|---------|
| Homepage TTFB | PASS | 148ms (Vercel edge cache HIT, prerendered) |
| Inner page TTFB | WARN | 312-537ms (SSR on every request, no caching) |
| Cache headers | FAIL | City/state pages use `private, no-cache` -- every visit triggers SSR + Supabase |
| Seattle page HTML | WARN | 392KB uncompressed -- heavy for mobile |
| JS chunks | OK | 12 async script chunks on homepage |

### Redirect Chains

| From | To | Hops | Status |
|------|-----|------|--------|
| http://groomlocal.com | https://groomlocal.com | 1 (308) | PASS |
| http://www.groomlocal.com | https://groomlocal.com | 2 (308->308) | WARN |
| https://www.groomlocal.com | https://groomlocal.com | 1 (308) | PASS |

### Security Headers: STRONG

All configured in `next.config.ts`:

| Header | Status | Value |
|--------|--------|-------|
| HTTPS | PASS | Enforced |
| HSTS | PASS | max-age=63072000; includeSubDomains; preload |
| X-Frame-Options | PASS | SAMEORIGIN |
| X-Content-Type-Options | PASS | nosniff |
| Referrer-Policy | PASS | strict-origin-when-cross-origin |
| Permissions-Policy | PASS | camera=(), microphone=(), geolocation=() |
| Content-Security-Policy | MISSING | Not configured |

### robots.txt: WELL CONFIGURED

- Blocks: /api/, /claim/, /dashboard/, /login, /signup
- AI bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended): Allowed on public pages
- Sitemap reference: Present

### Sitemap Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Uniform lastmod dates | Medium | All URLs show same timestamp - Google ignores lastmod when it's always the same |
| Suspicious city: Stayton, WA | Low | Stayton is in Oregon, not Washington |
| No lastmod differentiation | Medium | Blog posts should have different dates than directory pages |

### URL Structure: CLEAN

- Route hierarchy: `/dog-grooming/[state]/[city]` - logical and SEO-friendly
- No URL parameters for core pages
- Trailing slashes consistent
- State slugs use lowercase abbreviations (wa, or)

---

## 2. CONTENT QUALITY (Score: 46/100)

### E-E-A-T Assessment: 37/100

| Factor | Score | Key Issues |
|--------|-------|------------|
| Experience | 45/100 | Seasonal guide shows real experience; most pages lack first-hand signals |
| Expertise | 40/100 | Sarah Clarke's bio is strong; other authors weak; no team expertise on About |
| Authoritativeness | 30/100 | No external citations, no press, no industry affiliations, unsubstantiated "#1" claim |
| Trustworthiness | 35/100 | No physical address, no named team, no verification methodology |

### Page-by-Page Content Scores

| Page Type | Score | Word Count | Issue |
|-----------|-------|------------|-------|
| Homepage | 42/100 | ~300 words | Below 500-word minimum, no FAQ, unsubstantiated "#1 directory" claim |
| Blog: Pricing Guide | 62/100 | ~850 words | Below 1,500 minimum, weak author credentials, no sources |
| Blog: Seasonal Guide | 72/100 | ~1,150 words | Best content piece, genuine expertise, needs expansion |
| City (enhanced, ~10 cities) | 55/100 | ~550 words | Good local data, needs schema |
| City (non-enhanced, ~90% of cities) | 25/100 | <100 words unique | SEVERE thin content risk |
| About Page | 35/100 | ~375 words | Critical trust gaps |
| Services Hub | 30/100 | ~125 words | Navigation-only, no editorial content |

### Thin Content Risk: HIGH

The biggest content problem: ~90% of city pages use identical boilerplate text with only city/state name swapped:

> "Finding a reliable, skilled dog groomer in {cityName} doesn't have to be stressful. GroomLocal has verified and reviewed all listings..."

This is exactly the pattern Google's Helpful Content system flags as "content created primarily for search engines."

### Blog Assessment

7 posts published (Jan-Mar 2026). Good publication cadence. Content quality varies:
- Strongest: PNW Seasonal Guide (genuine groomer expertise)
- Weakest: Posts lack external citations, word counts below ideal
- No author profile pages exist
- No author avatars
- Sarah Clarke (professional groomer) should author more content

---

## 3. ON-PAGE SEO (Score: 60/100)

### Title Tags: GOOD

| Page | Title | Assessment |
|------|-------|------------|
| Homepage | "GroomLocal \| Find Dog Groomers in the PNW" | Good, includes primary keyword |
| City page | "Best Dog Groomers in Tacoma, WA \| GroomLocal" | Strong local keyword targeting |
| Blog | Descriptive, keyword-rich | Good |
| State page | "Dog Groomers in Washington - Browse by City \| GroomLocal" | Good |

### Meta Descriptions: GOOD

All key pages have unique, descriptive meta descriptions with local keywords.

### Heading Structure: GOOD

- H1 tags present and unique on all page types
- Logical H2/H3 hierarchy
- City pages use service-relevant headings

### Internal Linking: MODERATE

| Strength | Detail |
|----------|--------|
| Navigation | Strong mega-menu with city/service links |
| Breadcrumbs | Visual breadcrumbs present but missing BreadcrumbList schema on most pages |
| Cross-linking | Blog posts link to directory pages (good) |
| Footer | Comprehensive city/service links |
| Gap | No "related cities" or "groomers also found in..." cross-links on groomer profiles |

### Missing: Meta Keywords

The homepage has `meta keywords` set - this tag is ignored by Google since 2009. Not harmful, just unnecessary.

---

## 4. SCHEMA / STRUCTURED DATA (Score: 35/100)

### Current Implementation

| Page Type | Schema Present | Types |
|-----------|---------------|-------|
| Homepage | NO | None |
| City pages | NO | None |
| State pages | NO | None |
| Groomer profiles | YES | LocalBusiness + BreadcrumbList |
| Blog posts | YES | Article + BreadcrumbList |
| Service pages | YES | @graph [BreadcrumbList, ItemList] |
| Services index | NO | None |

### Bugs Found

1. **Empty openingHoursSpecification** (`src/lib/schema.ts` ~line 54)
   - Filter allows through hour entries with no open/close times
   - Fix: `hours.filter(h => !h.closed && h.open && h.close)`

2. **numberOfItems mismatch** (`src/lib/schema.ts` ~line 129)
   - Claims 979 items but only includes 20 in the array
   - Fix: `numberOfItems: Math.min(listings.length, 20)`

3. **Dormant FAQPage generator** (`src/lib/schema.ts` ~line 80)
   - FAQPage rich results restricted to government/healthcare since Aug 2023
   - Not currently used but should be removed to prevent accidental future use

### Missing Schema (Priority Order)

1. **Homepage**: WebSite (with SearchAction) + Organization
2. **City pages**: BreadcrumbList + ItemList
3. **State pages**: BreadcrumbList
4. **Blog Article**: Add publisher logo ImageObject
5. **About page**: Organization with founders, address

---

## 5. AI SEARCH READINESS (Score: 48/100)

### AI Bot Access: GOOD

robots.txt correctly allows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended access to public pages while blocking authenticated routes. This is well-configured.

### Citability: MODERATE

| Signal | Status |
|--------|--------|
| Structured data for extraction | Partial (blog/groomer only) |
| Clear passage-level content | Blog posts are good; city pages are weak |
| Authoritative voice | Sarah Clarke's posts yes; others no |
| Source attribution | Missing on all content |
| Brand mention signals | Zero external mentions found |
| llms.txt | Not present |

### Recommendations

- Add `/llms.txt` file describing the site for AI crawlers
- Strengthen passage-level citability on city pages with unique local data
- Add source methodology to pricing content
- Build brand mentions through local PR, partnerships, directories

---

## 6. IMAGES (Score: 50/100)

| Check | Status |
|-------|--------|
| Alt text on key images | PASS - Maui mascot, service icons have alt text |
| OG image | PASS - 1200x630 og-image.png configured |
| Placeholder handling | PASS - "Photo here" placeholder per user preference |
| Image optimization | UNKNOWN - Would need Lighthouse audit |
| Lazy loading | UNKNOWN - Next.js Image component handles this |
| WebP/AVIF formats | UNKNOWN |

---

## PRIORITY ACTION PLAN

### CRITICAL (Fix This Week)

1. **Set up Google Search Console**
   - Create account at search.google.com/search-console
   - Verify domain via DNS TXT record (preferred) or HTML file upload
   - Submit sitemap: https://groomlocal.com/sitemap.xml
   - Request indexing of homepage and key pages
   - This is THE most important action - nothing else matters until Google can find you

2. **Fix schema bugs**
   - Empty openingHoursSpecification in `src/lib/schema.ts`
   - numberOfItems mismatch in service ItemList

### HIGH (Fix Within 2 Weeks)

3. **Add schema to high-value pages**
   - Homepage: WebSite + Organization JSON-LD
   - City pages: BreadcrumbList + ItemList JSON-LD
   - State pages: BreadcrumbList JSON-LD
   - The generators already exist in `src/lib/schema.ts` - just wire them in

4. **Fix About page trust deficit**
   - Add real team member names, photos, backgrounds
   - Add founding year
   - Add physical or mailing address
   - Explain verification methodology ("what does 'verified' mean?")
   - Remove or substantiate "PNW's #1" claim

5. **Build initial backlink profile**
   - Submit to Yelp, Yellow Pages, BBB for business directory citations
   - Reach out to PNW pet blogs for mentions/reviews
   - List on Product Hunt or similar launch directories
   - Create a Google Business Profile if applicable
   - Submit to DMOZ alternatives and niche directories

### MEDIUM (Fix Within 1 Month)

6. **Expand thin city pages**
   - Add enhanced content to top 20-30 cities by listing count
   - Replace boilerplate SEO paragraph with unique city-specific content
   - Add local context (neighborhoods, parks, climate tips) using `city-data.ts` pattern
   - Programmatically generate minimum viable content for remaining cities using actual listing data

7. **Expand blog content**
   - Grow both existing posts to 1,500+ words
   - Create author profile pages at /blog/author/[name]
   - Add author avatars
   - Link Sarah Clarke to her salon on GroomLocal
   - Add source attribution to pricing data
   - Publish 2-3 posts per month targeting long-tail keywords

8. **Add editorial content to hub pages**
   - Services page: "Which service does my dog need?" guide with comparison table
   - Homepage: 200-300 word editorial section about what GroomLocal is

### LOW (Backlog)

9. **Create "How We Verify Listings" page**
   - Explain editorial process, data sources, quality standards
   - Link from About page, footer, and city pages

10. **Add llms.txt for AI crawlers**

11. **Add Content-Security-Policy header**

12. **Fix sitemap lastmod dates**
    - Use actual content modification dates instead of build timestamp
    - Remove Stayton, WA (doesn't exist - Stayton is in Oregon)

13. **Consider adding FAQ content** (even without FAQPage schema)
    - Homepage: "How does GroomLocal work?" section
    - City pages: "Grooming tips for [city]" section
    - Service pages: "What is [service]?" editorial content

---

## COMPETITIVE CONTEXT

The PNW dog grooming directory space has established competitors:
- **PNW Grooming** (pnwgrooming.com) - Corvallis, OR
- **Yelp/Google Maps** - Dominant for "dog groomer near me" searches
- **Petco/PetSmart store locators** - Chain grooming discovery
- **Rover.com, Wag, Groomit** - National platforms

GroomLocal's differentiator (PNW-focused, curated, 1,177 listings) is strong but invisible until the indexing problem is solved. Once indexed, the local content strategy (city pages, PNW-specific blog) should compete well for long-tail local queries.

---

*Report generated March 7, 2026. Technical SEO performance data pending Lighthouse/PageSpeed analysis.*
