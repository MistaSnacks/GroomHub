# GroomLocal Snackbox handoff — September 12, 2026

Studio: https://snackboxcms.com/admin/groomlocal

Created the `groomlocal` database-defined project under Camren's existing account. Applied the schema through MCP after a non-destructive dry run. Snapshot: `groomlocal-schema.json`; read the live schema before any replacement.

Content sections: Blogs & Grooming Guides, Guide Topics, Authors, Marketing Pages, Homepage, Frequently Asked Questions, Maui Illustration Library, Navigation, Site Settings and Branding. The default contact inbox is retained, with no email notifications or form connection enabled.

Seeded the five existing guide topics and `author-camren-mcmath`, preserving current attribution. No blog articles or marketing copy have been imported yet. No new blog was published in the CMS. The previous site release is live from Git commit `c56f651a4cb8999bf8dcbfdea40ce20fe8907031`, including the Halloween guide.

## Remaining site connection

The live Next.js site still reads 18 local MDX articles. The project has no siteUrl/revalidation endpoint configured yet; `check_site_setup` returned `allOk: false` on September 12. Before enabling CMS publication:

1. Use Snackbox's existing-site starter instructions to connect its reader, draft preview and authenticated revalidation to GroomLocal. Obtain/store the scaffold secret securely before setting the existing site URL; do not create another repository or Vercel project.
2. Convert/import current articles and media without changing URLs, attribution, publication/update dates or article order. Preserve lists, tables, callouts and illustrated sections. Blog content uses Portable Text plus typed sections, not remotely executable MDX.
3. Replace filesystem reads in `src/lib/blog.ts` and update article/list pages, RSS, sitemap and related posts. Read `guideTopic` documents and article references rather than hard-coded slug arrays so new posts/topics need no code changes.
4. Preserve Next.js page layouts and responsive art presentation. Add Snackbox's media hostname and validate actual emitted optimizer URLs. Handle original PNG and WebP variants correctly.
5. Verify preview privacy, cache invalidation, new-slug rendering without rebuilding, SEO output and image loading. Demonstrate a CMS edit reaches the live site without a new deployment, then record the result for the receiving agent.
6. Connect marketing page/home/navigation/settings content as structured props, preserving application behavior. Listing data, business prices/booking links, claims and accounts remain in the existing application database.

## Portable automation

`skills/hermes-blog-skill/` now documents the CMS workflow, all required tools and credentials, a receiving-PC prompt, quality gates and executable helpers. It explicitly refuses to claim live publication before the site connection is verified. The original local Hermes installation, configuration, credentials, scheduler, installed skill and local policy are unchanged.

Maui quality requires both byte-level checks and an actual visual comparison with the approved reference. Approvals identify exact image hashes, and every hero/inline asset needs evidence. A changed image invalidates approval. This is an agent workflow gate; the CMS's general Publish action is not yet constrained by a server-side artwork validator.

## Walkthrough and validation

Verified the project dashboard and blog editor in the existing signed-in Chrome tab. The five topic choices and Camren McMath author are selectable; the editor exposes rich text, SEO/source/research fields, asset selection, review hashes and separate Create/Save draft buttons. The Maui collection exposes image upload, provenance and review fields. No test article or image was created or published during the walkthrough.

Nine offline helper tests and the skill validator pass. Preflight inventories all 18 existing MDX guides and correctly leaves tool/site readiness unverified. The upload helper was tested with a mocked response; no real token was minted or asset uploaded. A transfer archive includes the skill, approved references and required checkout resources, with hashes and no credentials.
