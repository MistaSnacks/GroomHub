# Snackbox drafting and publication

Project: `groomlocal`. Studio: `https://snackboxcms.com/admin/groomlocal`.
Schema snapshot: `docs/cms/groomlocal-schema.json` in the checkout; always read the live schema before writing.

## Current handoff state

September 12, 2026: project and editorial schema created; five guide topics and Camren McMath's author record seeded. Existing articles still come from local MDX. **The Next.js CMS reader, preview route, image host configuration and revalidation webhook are not connected yet.** CMS Publish is not evidence of a live GroomLocal article. Keep work in draft until an implementing developer verifies the connection. Do not fall back to a code deployment from this skill.

The implementation handoff must verify: CMS published reads for articles/listings/topics/related posts/RSS/sitemap; stable existing slugs and dates; new slugs reachable without rebuilding; safe Portable Text rendering; draft preview hidden from public readers; served asset variants allowed by Next Image; authenticated cache invalidation; and a CMS edit visible on the site without a new deployment. `check_site_setup.allOk` is necessary but alone does not prove the blog actually reads CMS content. Retain that end-to-end verification evidence and recheck current availability before publication.

## Draft data

Use fluent `query` JSON with `type: "blogPost"`, `perspective: "published"` or `"draft"`, `limit: 100`, and `offset: 0`. Query both perspectives. Draft perspective overlays saved drafts on published documents; it is not a draft-only list. Also query each perspective with `filters: [{"op":"eq","path":"_hidden","value":true}]` so hidden documents are coverage exclusions too.

There are two pagination layers: the tool's top-level `offset`/`page.nextOffset` drains a size-limited MCP response **within the same fluent query**. After draining that response, advance `fluent.offset` by the number of documents in that database batch and query again until the batch is shorter than `fluent.limit`. `page.complete: true` alone does not prove the database inventory is exhausted. Deduplicate coverage by document ID and slug. Reconcile against the checkout's MDX, content inventory, live site and GTM; CMS is initially empty of the existing 18 articles, so an empty CMS collection does not mean a topic is new. Choose one distinct intent and slug. Query `guideTopic` and `author`; reuse their real IDs.

Create with an explicit draft perspective, stable ID (for example `blog-<slug>`), locale `default` and stable `operationId`. `create_documents` defaults must never decide publication status.

```json
{
  "project": "groomlocal",
  "perspective": "draft",
  "operationId": "<run-id>-create",
  "documents": [{
    "id": "blog-<slug>",
    "type": "blogPost",
    "locale": "default",
    "data": {
      "title": "<specific article title>",
      "slug": "<new-slug>",
      "excerpt": "<useful summary>",
      "category": "guides",
      "topic": {"_ref": "topic-getting-started"},
      "author": {"_ref": "author-camren-mcmath"},
      "date": "<actual Pacific publication day>",
      "dateModified": "<same initial date>",
      "readTime": "<measured reading time>",
      "heroImage": {"_ref": "<uploaded asset ID>"},
      "heroAlt": "<what the illustration shows>",
      "body": [{
        "_type": "block", "_key": "intro", "style": "normal",
        "markDefs": [],
        "children": [{"_type": "span", "_key": "intro-text", "text": "<article introduction>", "marks": []}]
      }],
      "artworkReview": {"status": "pending"}
    }
  }]
}
```

This is a shape example, not content to publish. Portable Text supports `normal`, `h2`, `h3`, strong/em marks and link annotations; do not submit raw MDX or executable JavaScript. Use `sections` for ordered illustrations, callouts and tables **after** `body`; split the article accordingly rather than duplicating or shuffling text. Populate SEO description, tags, source links and the research record from actual evidence. Do not force a search volume when the API returned none.

Call `get_document` with draft perspective before every update, then `save_draft` with its `expectedRevision`. Preserve unrelated edits. Save the document ID/revision and draft editor URL in `cms-draft.json`. The usual Studio editor path is `/admin/groomlocal/blogPost/<id>`; use a returned/observed editor URL if the platform changes it.

## Quality and publication gates

1. Required SEO research, sourced factual/editorial review, nonoverlap and internal-link checks pass. GTM tracking exists.
2. Every final hero and inline asset passes [Maui quality review](maui-quality.md). Use downloaded CMS originals and inspect served variants. Store all asset IDs and hashes in run evidence. `artworkReview` records the hero hash and review summary; the complete per-image manifest remains in the run evidence. For each image, a `mauiIllustration` record may retain the matching individual approval.
3. The live-site connection has the end-to-end evidence described above, current `check_site_setup` passes, and the article's draft preview renders correctly at mobile and desktop widths. Inspect actual `src`/`srcset` responses, not only the original PNG.
4. Re-read the draft immediately before publishing. Compare its revision/content and complete image-reference set to the reviewed version. Fetch current asset bytes and compare hashes. Any changed image/content requires the affected checks again. Do not set `approved` from a prompt or assume the CMS enforces that field: these are agent workflow gates, **not server-enforced publishing rules**.
5. In policy publish mode, call `publish_draft` with the exact reviewed revision and stable operation ID. In review mode, leave the draft. Do not use `patch_document` or published `create_documents` to bypass drafting.
6. Verify public article status/content, canonical URL, title/description, Article JSON-LD, topic/listing placement, related links, RSS and sitemap, and actual browser image loads. Confirm no unpublished/test content leaked. Only then save `publication.json` as `live` and update GTM. A failed public verification is `published_unverified`, not success; retain evidence and report the failure without blind republishing.

CMS Publish in the browser can currently bypass the agent's review procedure. A mandatory gate for **every** publishing route requires a platform-side validation feature. Do not represent the review fields or this skill as that feature.
