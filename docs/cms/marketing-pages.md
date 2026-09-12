# Marketing content in Snackbox

The Homepage singleton controls `/`. Marketing Pages contains `about` and `for-groomers`, using their existing layouts. Copy, section headings, button labels/destinations, illustrations, alt text and SEO overrides are editable. Counts, search, cities, groomer cards, pricing records and account flows remain application data.

Keep existing slugs and section keys. Homepage keys: `featured`, `services`, `specialties`, `findGroomers`, `forGroomers`, `cities`. About keys: `story`, `story-details`, `values`, `pets-first`, `transparency`, `free-forever`, `community`, `maui`, `maui-details`. For Groomers keys: `features`, `feature-1` through `feature-4`, `steps`, `step-1` through `step-3`, `closing`. These slots keep their existing order and design. Missing copy falls back to the prior site text. Use `{groomerCount}` / `{cityCount}` in homepage introductions and overview, and `{groomerCount}` in About's story details, for live counts. The heading emphasis field highlights an exact phrase in the heading.

Create a Marketing Page with a new, lowercase, hyphenated slug for a new landing page. It uses the shared header/footer, hero, buttons, body, ordered sections and FAQs. Application routes are reserved and cannot be replaced this way. New pages need no deployment; publication adds indexable pages to the sitemap. Existing About/For Groomers pages also render additional body content and FAQs below their established layouts. Other existing application or service pages have not been migrated merely because they have a matching slug.

Save a draft, use **Edit on site** to inspect it, then publish. Anonymous requests only read published content; preview pages use `noindex`. SEO fields control title, description, social image/alt and search exclusion. No-index marketing pages are omitted from the sitemap. The existing authenticated webhook invalidates CMS cache tags; the SDK's short cache interval is a fallback.

The initial three documents reproduce the existing live copy. Their five reused Maui originals are unchanged uploads. New or replacement Maui artwork still needs the portable skill's file checks and visual review against the approved reference before publication; Studio's Publish button does not enforce that review.

Navigation, Site Settings, Branding and standalone FAQ schema do not control the existing global UI. FAQ references can be displayed on marketing pages. Service/taxonomy pages, pricing UI and contact form continue to use their existing code/database sources.
