# SEO and editorial guidance for Hermes

Adapted from the local `seo-blog-optimize` command for this specific new-article
workflow. The general command's existing-page revisions and brainstorming approval
step do not apply to the already-authorized weekly job. Preserve the current
publication policy and the new-only rules in `SKILL.md`.

## Evidence collection

1. Inventory existing guides and topic assignments. Explain how the proposed
   article answers a different intent from its closest existing guides.
2. Prefer actual GSC clicks, impressions, and queries through GTM Board for
   GroomLocal's own performance. Record the date range, collection date, and
   preliminary-data limits. Page impressions and property impressions use
   different aggregation; query rows may omit traffic. Do not label these visits
   as leads or bookings.
3. Batch roughly 10–15 relevant candidate phrases with DataForSEO's keyword
   overview. Keep raw returned records, estimated volume, intent, and available
   trend fields. Separate advertising competition from organic difficulty.
4. Inspect live SERPs for the top three relevant candidates. Capture organic
   competitors, People Also Ask, related searches, result formats, and available
   AI Overview sources. Choose by intent and useful coverage, not volume alone.
5. Check Google and ChatGPT citation patterns for the chosen topic. Record cited
   domains/pages and any returned AI-search-volume estimate with its scope.
   Domain filters use `search_scope: ["any"]`, not `["answer"]`.
6. Compare GroomLocal's backlink rank with a few actual competitors. Scores are
   context, not a rule predicting rankings. Do not reuse the old generic command's
   200/500-point cutoffs or assume authority does not matter for AI citations.

Tool names may differ by connector version. Inspect the available schema before
calling these endpoint families:

- `dataforseo_labs_google_keyword_overview`
- `serp_organic_live_advanced`
- `ai_opt_llm_ment_top_domains`, `ai_opt_llm_ment_top_pages`
- `ai_opt_llm_ment_agg_metrics`
- `backlinks_bulk_ranks`

Use the United States and English unless the article's actual audience requires
another location/language. Related-keyword and individual-backlink endpoints are
optional follow-ups, not mandatory extra calls. Keep research bounded and record
empty results separately from tool errors.

## Writing the new guide

- Lead with an answer and make each section useful on its own. Use a table,
  numbered steps, or concise FAQ where that helps the actual reader.
- Cite current primary sources inline for prices and other changing claims.
  Open the source rather than treating a search snippet as a verified menu.
- Preserve distinctions between advertised starting prices, hourly rates,
  provider examples, and measured averages. A few examples are not a market
  survey. Label dates and service inclusions.
- Verify geography, particularly Portland OR versus Portland ME. Use authoritative
  veterinary sources for animal-care claims without inventing qualifications or
  providing individualized treatment advice.
- Make the title and excerpt accurate and concise. Include the target phrase
  naturally, without treating a fixed character count as a display guarantee.
- Match current MDX frontmatter, author attribution, category, and topic mapping.
  New article dates use the actual Pacific publication date.
- Link naturally to relevant existing guides, service/city pages, and `/get-quotes`.
  The public section is **Grooming Guides** at `/blog`; `/resources` redirects there.
- Do not promise verified prices, availability, credentials, or instant booking
  across directory listings.
- Avoid filler and stock phrases such as “game-changer,” “seamless,” “delve,”
  “leverage,” “elevate,” “holistic,” “it's worth noting,” and “at the end of the day.”
  Follow additional content rules in the current checkout.

## Report and review

Save the chosen intent, nearest existing guides, source links and dates, raw SEO
evidence, and factual/editorial checks. Record why this topic is worthwhile and
why it does not duplicate an existing article. Review the full draft, links,
frontmatter, MDX compilation, and new Maui image before signing release checks.
Use the controlled publisher in `SKILL.md`; writing a guide or selecting artwork
does not complete publication. Report only checks actually performed.
