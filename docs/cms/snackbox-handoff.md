# GroomLocal Snackbox handoff — September 12, 2026

Studio: https://snackboxcms.com/admin/groomlocal
Live guides: https://groomlocal.com/blog

## Connected and live

All 18 existing guides now read from Snackbox, with five topics, three author profiles and 27 uploaded images. The migration preserved URLs, dates, article-specific biographies, text, headings, lists, tables, callouts and illustration placement. All 27 CMS originals match the existing PNG bytes and retain RGBA transparency. Existing MDX files remain as the migration archive; editing those files no longer publishes articles.

Next.js renders Portable Text and typed sections as data, without executing remote MDX. CMS publication updates article pages, the guide browser and topic counts, related guides, RSS and the sitemap without a deployment. New slugs render on demand. Revalidation is authenticated at `https://groomlocal.com/api/revalidate`, with project-wide cache tags covering referenced authors, topics and media. The SDK's 15-second cache interval is the fallback, not a substitute for checking the published page.

`check_site_setup` passes all five checks: URL, reachability, webhook, secret and framing. The production environment has the scaffold's public CMS settings and private `REVALIDATION_SECRET`; no CMS write token is required by the frontend. Secrets are excluded from this handoff.

## Editing and preview

In the project overview choose **Edit on site**, then **Browse** to navigate to a guide and **Edit** or **Page content** to edit it. On-site editing and the Studio visual editor are enabled. Save a draft before publishing. The article's ordinary embedded “On your site” panel shows the published page; use the authenticated site editor to inspect saved drafts.

An authenticated preview showed a saved SEO description while anonymous requests still showed the old description. Draft pages carry `noindex`. `?sbx-public=1` shows published content without clearing other tabs' draft session. A global script allows the homepage editor entry to start; article-specific bindings update when navigating between guides. Account and dashboard routes keep their existing authentication and restrictive framing.

## Publication evidence

See `live-verification.json`. A temporary new slug returned 404 before CMS publication, then rendered on the same Vercel preview deployment without rebuilding; the test document was deleted and its URL returned 404 again before release. After release, publishing a small Halloween-guide SEO description change reached groomlocal.com while the production deployment ID remained unchanged.

All 18 live articles passed content/metadata parity checks against the previous site. Guide-topic navigation and related-link tests pass. RSS contains 18 articles and 18 working CMS image enclosures; the sitemap contains all 18 canonical URLs. The ear-cleaning guide loads its images at mobile and desktop sizes with no horizontal overflow. TypeScript, production builds, targeted lint and structured-content renderer tests pass.

## Portable Hermes workflow

`skills/hermes-blog-skill/` documents the CMS MCP, DataForSEO, GTM, source-reading, image generation, visual inspection and browser requirements, with credential placeholders and receiving-PC setup. Recheck tool access and the live connection on each receiving installation. The preflight intentionally starts readiness flags as false; a historical success is not a current connection test.

Hermes creates at most one new, nonoverlapping guide with new Maui art per run. Every final image needs file checks and an actual visual comparison against the approved reference, tied to the exact downloaded CMS original hash. A changed image invalidates approval. These are skill gates; the CMS's general Publish button is not server-enforced artwork validation. Imported, unchanged artwork keeps `pending` review metadata rather than fabricated new approvals.

The local Hermes installation, installed skill, credentials, configuration, scheduler and machine-specific policy remain unchanged. Transfer the portable skill and required checkout resources to the receiving PC; do not copy secrets.

## Scope and remaining content

This release connects blogs, topics and authors. Marketing Pages, Homepage, FAQ, Navigation, Site Settings and Branding have schemas but are not yet connected to frontend copy. Their existing site content still comes from code. Listing data, business prices/booking links, claims, accounts and forms remain in the existing application database. The contact inbox has no form connection or notifications enabled.

Observed CMS issue: `delete_document` with an operation ID returned a database not-null error and rolled back. Re-reading confirmed the temporary test still existed; deleting with its current revision and no operation ID succeeded. No production content was deleted. This platform issue did not affect publishing.
