---
name: hermes-blog-skill
description: Track, research, verify, and publish one genuinely new GroomLocal grooming article with newly generated Maui artwork per weekly run. Do not refresh existing guides. Creates Snackbox CMS drafts, requires SEO and image quality checks, and publishes only after the live CMS connection is verified.
---

# Hermes Blog Skill

This workflow is for GroomLocal, not TAILOR or any other business in shared Hermes identity files. Work only on the grooming directory task. The project root is the current GroomLocal checkout (the directory containing `package.json` and `src/content/blog/`). Read [setup on another computer](references/setup.md) and the [required tools](references/tools.md) before the first run. Use Snackbox project `groomlocal` at `https://snackboxcms.com/api/mcp`. This package does not install or modify a local Hermes bot, credentials, or scheduler. Repository paths below are relative to that root; bundled `references/` paths are relative to this skill folder. Do not send emails, contact groomers, or message external channels. The scheduler saves your final report locally.

## Authority and output

The user authorized recurring GTM tracking and verified publication on September 5, 2026. Run the bundled `python3 "<skill-folder>/scripts/cms-preflight.py" --project-root "<checkout>"` at the start unless a valid CMS preflight result was already supplied. It supplies the run directory, inventory, and execution mode. The scheduler does not inject a script because its script-directory restriction rejects this repository path. The policy is **review** mode (since 2026-09-24): choose one worthwhile NEW guide with a NEW Maui illustration, track it on the GroomLocal GTM board, prepare and verify the article and artwork, then follow [Snackbox publication](references/snackbox-publishing.md) to create a CMS draft and call `request_review` on it. Never call `publish_draft`; the owner publishes from the Studio. Do not use the old MDX/Vercel publisher (archived under `scripts/archive/`) or make code changes for articles. Read the current policy; do not alter your own permissions, schedules, model, credentials, or unrelated code. Never deploy the dirty working checkout or commit/push it wholesale.

## When something fails: keep going

The goal of every run is one complete draft in the owner's review queue. From 2026-10-12 to 2026-11-10, five of six weekly runs and the Christmas run ended with no draft because one check failed: a 429 from the site check, a dead source link, an empty keyword result. None of those is a reason to stop. Only a **Stop** row below ends a run without a draft. For every other failure: retry once, take the fallback, add one line under `Degraded checks` in the run report, and continue to the next step.

| What failed | What to do |
|---|---|
| `cms-preflight.py` returns `blocked_preflight` | **Stop.** The policy or checkout is wrong. |
| Snackbox cannot read the schema or save a draft, after one retry | **Stop.** Save the full draft JSON under `<run-dir>/drafts/` first. |
| No search tool works at all (no SERP, no page fetch) | **Stop.** An article needs sources. |
| All three topic candidates fail their evidence check | **Stop** with a no-change report. |
| `check_site_setup` is not all OK (429, unreachable, framing) | Wait 60 seconds and retry once. Then continue. This run never publishes, so site readiness cannot block a draft or a review request. |
| GTM board is down | Continue. Keep the pending update in `gtm-task.json`; the next run syncs it. |
| A DataForSEO docs lookup or one endpoint fails | Call the endpoint with the request shapes in the runtime notes. Skip the citation and backlink checks if they still fail. |
| The keyword tool returns nothing | Use the live SERP and People Also Ask as demand evidence. Write "no volume data" in the report. Never invent a number. |
| Search Console is unavailable | Skip it. |
| A source URL is dead or unreadable | Use another primary source for that claim, or drop the claim. |
| Hero art loop ends `exhausted`, or an image, vision or Jev credential is down | Save the full text draft (best hero candidate if one exists, `artworkReview.status: "needs-fixes"`), do not call `request_review`, and report "draft saved, needs art". The next run resumes it and reruns only the art. |
| Inline art loop ends `exhausted` | Ship the article with the hero only. |

## GTM tracking on every run

Use the `gtm-board` MCP tools with the explicit project **groomlocal**. Never guess grooming/groomhub or fall back to TAILOR. At the beginning inspect existing SEO cards and create/update one card in `preparing` for this run, type `seo`, channel `seo`, target date in Pacific time, tags `weekly-guides` and the chosen slug when known. Record the returned card ID in `gtm-task.json`. Update its title when the topic is selected and add research, draft, report, and verification paths. A board-status update must preserve existing draft, sources, evidence, and report files; it updates only the board and gtm-task.json. Deduplicate by stored card ID or matching run marker before creating anything.

## Agent board tracking (recurring task)

The weekly job also has one permanent card on the GroomLocal **agent-tasks** board, task_id `weekly-groomlocal-grooming-guide-mondays-9am-pt-7725` (card UUID `684565f9-bf2b-4591-bd20-b91d43ae5edf`). This is where Camren watches the job. Update it on every run, in addition to the per-article SEO card on the marketing board:

- At the start of the run call `gtm_update_agent_task` with project `groomlocal`, that task_id, `column: "preparing"` (do not pass `status`, which would move the column), and an `output` object. Read the current output with `gtm_get_agent_task` first and preserve `output.runs`; append a new entry `{date, slug, title, url, deployment_id, primary_query, marketing_card, result: "in_progress"}` and set `output.last_run` to today's Pacific date.
- After publication succeeds (`publication.json` says `live` and the URL was checked), call `gtm_update_agent_task` again with `column: "preparing"` and the same output with that run's `result` set to `"published"`, the canonical URL, CMS document ID/revision, and the marketing card slug. Include `content_type: "new"` and `new_maui_image: true` only after verifying those outcomes. Also append a row to the "Run log" table in the card body via `title`/`details` if the tool supports it; otherwise the `output.runs` log is sufficient.
- If the run publishes nothing, set `result` to `"no_change"` or `"blocked"` with a one-line `reason`, and `output.last_result` accordingly.
- Never pass `status: "completed"` for this task and never move it to `done`. It is an ongoing weekly job and must stay in `preparing`, which the dashboard shows as IN PROGRESS (`live` shows as BLOCKED there). Only the per-article marketing card moves columns.
- If the agent-task card is missing, recreate it with `gtm_create_agent_task` (project `groomlocal`, column `preparing`, assigned_agent `hermes`, tags `weekly-guides`, `recurring`, `seo`), record the new task_id in `gtm-task.json` under `agent_task_id`, and report that it was recreated.

After every agent-task update, read the task back and verify all of the following: the recurring card is still in `preparing`, the current run appears exactly once in `output.runs`, `output.last_run` and `output.last_result` are current, and the human-readable Run log body contains the current row when the update tool accepts `body`/`details`. Do not assume a successful tool response means the body and structured output were both persisted.

Before publication, the card must exist. If the board is unavailable, retain complete draft/task details locally and report the blocker; do not claim a board write. Retry once for a concrete transient error, then continue with the pending update saved (see the failure table). A failed release stays in `preparing` with the specific blocked check. Only after `publication.json` says `live` and the URL has been checked, move the card to `live` and include the canonical URL, CMS document ID/revision, primary query, evidence date, and verification outcome. If this final board update fails, preserve `publication.json` and a pending update in `gtm-task.json`; the next run must synchronize pending updates before selecting new work. Never republish a successful run just because its board update failed.

The user clarified on September 7, 2026 that Codex maintains the existing guides and Hermes must create NEW articles with NEW Maui illustrations. Prepare at most one genuinely new, nonoverlapping article per run. Never refresh, retitle, or duplicate an existing guide to satisfy this job. If the evidence does not justify a new article, save a short no-change report with the next opportunity to investigate. Do not change dates without meaningful updates, rewrite winning articles merely to make them longer, or fill a weekly quota with duplicate content.

## Resume unfinished work first (added 2026-10-28)

Before selecting a new topic, read the run reports of the last four runs under `output/groomlocal-weekly/`. If one of them selected a topic but never reached `request_review` (for example the 2026-11-09 `salon-mobile-self-wash-dog-grooming-pnw` run, which stopped on a site check), finish THAT article in this run instead of researching a new one: reuse its slug, GTM card, research files, stable document ID and operation ID, redo only the research that is missing, and continue through text, art, upload, humanize and `request_review`. If it has an approved PNG, verify the SHA-256 against its report and reuse it; do not regenerate an approved hero. If its art was never approved, run the art loop.

## Local images: always upload, never block (added 2026-10-28)

Approved PNGs are local files. Upload each one with the bundled script, never with `upload_asset_from_url`, and never report "no public URL" as a blocker:

`SNACKBOX_GROOMLOCAL_TOKEN` is already in `~/.hermes/.env`; load it into the child environment only, then run `python3 "<skill-folder>/scripts/upload-cms-image.py" <final.png> --alt "<alt text>" > <run-dir>/art/upload-<name>.json`. Use `{"_ref": "<asset id>"}` from that JSON for `heroImage` and inline image fields. Download `originalUrl` with `curl` (the media host returns 403 to Python urllib default user agent) and confirm its SHA-256 matches the local file. The 2026-10-05 shedding hero is already uploaded as asset `asset_PUKyWN1E_4sc` (hash verified 2026-10-28, response in that run's `art/upload-hero.json`); reuse it, do not upload it again. Upload the hero BEFORE `create_documents`, because the schema requires `heroImage`. Save the full draft document JSON to `<run-dir>/drafts/` before every CMS call so text is never lost if a call fails.

## Research and selection

Read [SEO and editorial guidance](references/seo-editorial.md) for the editorial and Maui requirements. This scheduled workflow already authorizes research, drafting, GTM card updates, and CMS publication after the required checks when policy mode is publish, so do not stop for brainstorming approval.

### Preflight path-policy fallback

If the scheduler rejects the repository preflight because its path resolves outside the configured Hermes scripts directory, do not treat the error as a successful preflight and do not publish from incomplete metadata. Record the exact error in the run report, then run the same preflight directly from the project root (the bundled `python3 "<skill-folder>/scripts/cms-preflight.py" --project-root "<checkout>"`) if repository execution is permitted. Continue only after the direct run returns valid inventory, run directory, and mode; otherwise save a blocked report. Keep this workaround documented as a policy limitation rather than modifying schedules, permissions, or unrelated tooling. Preserve the useful research sequence using available tools; unavailable Superpowers skills do not block drafting.

Query Snackbox for all published and draft `blogPost` documents, paginating until complete. Also read the preflight inventory, the shared `docs/automation/content-inventory.json` coverage snapshot, `src/lib/grooming-guides.ts`, and the latest report under `docs/content-audits/`. The coverage snapshot includes local drafts and guides that may be absent from the Git checkout; reconcile it with live pages and GTM, and do not assume every entry is published. Check existing coverage before proposing a new slug. Prioritize demonstrated search opportunity, real reader questions, regional relevance, and gaps not already answered by existing guides. Among comparable candidates, prefer a topic whose core answer is a comparison a table can carry (prices by size or service, salon vs mobile, frequency by coat type, cost by city): ChatGPT already cites GroomLocal 33 times, almost entirely for the price tables in the cost guides, and table-based guides are cited far more often than prose (owner direction, 2026-09-30). This is a tiebreaker, not a license to pick a weaker topic or to fill a table with unsourced numbers.

**Topic mix (owner direction 2026-10-28).** Pricing topics blocked three runs in a row (Oct 12, 19, 20) because current Pacific Northwest menus could not be verified. Do not pick a topic whose core table needs live provider prices unless `docs/price-harvest/` already holds at least 8 dated prices for it. Prefer evergreen topics with a table that comes from sourced, stable facts: coat types and what service to book, breed grooming needs, grooming frequency by coat, salon vs mobile vs self-wash, at-home care between appointments, seasonal Pacific Northwest care (rain, mud, ticks, foxtails, winter paws), first groom for puppies, senior or anxious dogs, cats. Do not pick a pricing topic two runs in a row.

**Local focus (owner direction 2026-11-06, adopted strategy review).** GroomLocal is a search-traffic site for Washington and Oregon dog owners; its first priority is the Tacoma, Seattle and Portland metros. Every topic must answer a question for a dog owner in Washington or Oregon, and its core table must carry regional facts (local prices from `docs/price-harvest/`, local groomers, PNW weather, local rules). Holiday posts are allowed: the owner keeps the Thanksgiving and Christmas posts (owner decision 2026-11-06). A holiday post is always an EXTRA draft from a separate holiday run, and it never takes the weekly slot. The scheduled weekly run always writes one regular local post and never picks a holiday topic. A holiday run writes only the holiday post its prompt names and skips the unfinished-article rule above. A holiday draft must reach review at least three weeks before the holiday, because new posts can take weeks to be indexed (the Halloween post was never indexed). Give a holiday post a Washington or Oregon angle where an honest one exists (holiday grooming bookings at local groomers, winter weather) and link it to the city pages. Other national lifestyle topics with no regional angle stay out of both kinds of run. Never add any public line that says AI helped write, research or illustrate the article: no disclosure line, no byline note (owner rule 2026-11-06).

**One draft per run.** If the first candidate fails an evidence check, drop to the next candidate in the same keyword batch (at most three candidates) instead of ending the run. Stop with no draft only for a Stop row in the failure table, and say which. Existing guides are coverage exclusions and internal-link targets, not candidates for revision. Record the closest existing guides and explain how the selected intent differs. Seasonality can inform selection; keyword volume alone does not establish intent or value.

Use the DataForSEO tools for:

1. Existing domain rankings, preserving each result's collection date. Prefer Search Console clicks, impressions, and queries. GroomLocal GSC was verified through GTM Board's `google_search_console` connector for `sc-domain:groomlocal.com` on September 5, 2026; check that route before declaring GSC unavailable just because no standalone GSC tool exists. Reverify access and use the requested date range, label preliminary dates, and distinguish search clicks from inquiries or bookings. Third-party rankings and estimated traffic are not analytics.
2. One batch of roughly 10–15 candidate keywords, then live SERPs for the top 3 relevant candidates. Record organic results, relevant People Also Ask questions, related searches, and any available AI Overview sources.
3. A bounded check of Google and ChatGPT citations for the chosen topic and GroomLocal, plus backlink ranks for GroomLocal and a few actual competitors. For domain LLM filters use `search_scope: ["any"]`; this API rejects `answer` for domains. Distinguish missing data, empty results, and tool errors.

Record source URLs, retrieval dates, and compact raw metrics under the run directory. Preserve the exact requested keyword list and raw returned records; derive missing-keyword lists from those records so returned keywords cannot also be labeled missing. For large persisted tool results, save the relevant raw file and inspect compact ranking/keyword fields instead of loading unrelated output into context. Do not invent volumes, click counts, rankings, quotes, credentials, discounts, or market averages. Advertising competition is not organic keyword difficulty. Treat backlink scores as comparative context; no fixed score gap guarantees a ranking outcome or makes authority irrelevant to AI citations.

If an optional citation or authority endpoint fails, record the limitation and proceed with the evidence you have. Avoid unlimited retries: one corrected retry for a concrete input or transient error, then report the failure.

## Draft the guide

Read the live Snackbox schema with `get_schema`; use `blogPost`, Portable Text in `body`, and typed optional `sections`. See [Snackbox publication](references/snackbox-publishing.md) for the document shape. Resolve existing `author` and `guideTopic` references from the CMS. Do not invent qualifications or edit existing guides. Use the actual Pacific publication day for `date` and initial `dateModified`. Choose a nonoverlapping slug. Topic assignment is a CMS reference; no MDX file or topic-mapping code patch is needed.

Lead with a direct answer, use meaningful headings, and answer the reader's actual decision. Link prices and changing claims directly to current primary sources in the article body, not only a separate report. A provider blog describing general market prices is not its current menu; label old estimates accurately or exclude them. Do not promote a SERP snippet into verified provider pricing when the page cannot be checked. Label a small set of examples as a sample, never as a citywide or national average. Distinguish bath/tidy/full haircut, provider weight brackets, starting prices, and hourly charges. Check geography carefully: Portland, Oregon is not Portland, Maine. Use veterinary or other authoritative sources for animal-health claims and avoid diagnosis or individualized treatment advice.

### Data table

Every new guide includes at least one table in the first third of the article, directly after the opening answer, that summarizes the article's core comparison. Portable Text `body` cannot hold tables and the site renders `sections` after `body`, so structure the document this way: `body` holds only the direct opening answer (one to three short paragraphs); `sections[0]` is the table section (`heading`, `table.headings`, `table.rows`, and a `caption` with sample size, source type and month); the rest of the article follows as ordered `sections`. Do not duplicate text between `body` and `sections`. Each row must trace to a cited source or to GroomLocal's own harvested price data (`docs/price-harvest/` output from the `price-harvest` skill, which records source URL and retrieval date per price). Put the sample size and "as of" month in a caption or the sentence above the table, label starting prices as starting prices, and leave a cell blank rather than estimating it. Never present a handful of provider menus as a city or national average. If the topic has no honest tabular comparison, use a short numbered checklist instead and say so in the run report.

### Internal links

Before saving the draft, add 3 to 6 internal links and record them in the run report as `{anchor, target, reason}`:

- 1 to 2 links to the closest existing guides (from the coverage inventory), with descriptive anchors, never "click here".
- 1 to 2 links to city or service pages that match the article's geography or service (for example `/dog-grooming/wa/tacoma`, `/services/mobile-grooming`). Check that each target returns 200 and is not a filter URL with `?services=` or `?specialties=`.
- `/get-quotes` once, where the reader is ready to compare groomers.

Do not edit existing guides to add backlinks to the new one (Codex maintains them); list suggested reverse links in the report so the owner can add them. Use natural internal links to relevant existing guides, service/city pages, and `/get-quotes` where helpful. Call the section **Grooming Guides**, at `/blog`; `/resources` redirects there. Do not imply that every listing offers confirmed prices, availability, credentials, or instant booking.

### Humanize pass (required since 2026-10-04)

Unedited AI articles rarely reach position 1, and Google rates main content that is AI-generated with little added value as lowest quality (owner request, 2026-10-04). Run this pass on every new guide after the text, table and internal links are drafted and before `request_review`. Read [humanize](references/humanize.md) for the full procedure and [rewrite rules](references/humanize-rewrite-rules.md) for the style fixes. Keep all files in `<run-dir>/humanize/`.

1. Save the complete draft document JSON (`_id`, `slug`, `title`, `excerpt`, `seo`, `heroAlt`, `body`, `sections`) as `before.json` and scan it with `python3 "<skill-folder>/scripts/ai_tells.py" before.json > scan-before.txt`.
2. Value pass in `value-pass.md`: list what the top three results and People Also Ask already say, tag each section GAIN or COMMODITY, add gains only from harvested price data, a cited comparison table no top result has, sourced Pacific Northwest detail, or dated primary data, and compress commodity sections to the short answer. Aim for two or more gains; report it if fewer are possible.
3. Never write first-person experience, anecdotes, quotes, opinions or credentials for Camren, Sarah or any groomer. Write three to five interview questions for Camren instead; they go in the review note, not the body.
4. Style pass: answer first, contractions in normal prose, one hedge per claim, varied sentence length, no "X is not A; it is B" lines, no list-of-three padding, no recap ending, no em dashes. Keep every number, link, quote and source name.
5. Save the rewrite as `after.json`. `ai_tells.py --compare before.json after.json` must exit 0 (each new number needs a cited source) and `ai_tells.py after.json --gate` must exit 0 (no em dash, no model artifact, at most 3 tells per 1,000 words). Fix and re-run until both pass. Value flags such as "no first-hand experience markers" are expected here; report them, they do not block review.
6. Save `after.json` content to the CMS draft and put a before/after metrics table, the gains, the compressed sections and the questions in the run report.

## Maui artwork

Every article gets two newly generated illustrations: the hero, and one inline image for a middle section. A reused or renamed production image does not count. Read the [Maui style standard](references/maui/STYLE-STANDARD.md), the [base prompt](references/maui/MAUI-BASE-PROMPT.md) and the [image workflow](references/maui-image.md), and look at [the approved brushing reference](references/maui/approved-reference/brushing-v2.png). The reference fixes Maui's features, proportions, outlines, fur and bandana. It does not fix his pose or his expression.

### Pick the action, then write the scene

Maui must do something, and his face must do it too (owner direction 2026-11-13: he only ever stood or sat, and his face stayed at the reference's grin whatever he did, which looked uncanny). The art loop holds 14 designed actions. Each one sets his body, his face and the limb rule together: upright work, hugging a prop, reaching up, begging, play bow, nose down, shake-off, lying low, carrying, head tilt, belly up, peeking over an edge, zoomies, towel wrap.

1. Run `python3 "<skill-folder>/scripts/maui-art-loop.py" --plan --run-dir "<run directory>"`. It prints every action, least used first, with `suits`, `body` and `available`.
2. Take the first `available` action whose `suits` honestly fits the article. For the inline image take an action with a different body shape from the hero (an upright hero gets a floor-level or action inline, and the reverse).
3. Write `--scene` for that action in one sentence: what Maui is doing, the one set piece he uses, and at most two small props. Leave out body-position and face words, because the action supplies them. Share no set piece and no main prop with the scenes in the last four `art/art-loop.json` files under `output/groomlocal-weekly/`.
4. Run `python3 "<skill-folder>/scripts/maui-art-loop.py" --project-root "<checkout>" --run-dir "<run directory>" --slug <slug> --action <id> --scene "<scene>"`. For the inline image use `--slug <slug>-inline` and `--run-dir "<run directory>/inline"`.

A scene and its action must agree. `--action shake-off --scene "Maui is shaking off bath water next to a small wooden wash tub full of suds"` works. `--action lying-low` with a scene about a dryer on a grooming table does not: the 2026-10-28 inline image failed four times that way.

Set pieces are cut-out objects that Maui uses, never a full background: a bath tub with suds, a wash tub, a grooming stool, the open door of a grooming van, rain boots on a muddy trail, a pile of autumn leaves, a dog bed, a towel basket, a vet scale, a ferry rail. Keep every set piece short and inside the frame. Clipboards, checklists, calendars and paperwork are retired as main props; the loop rejects them unless you pass `--allow-repeat-prop` with a reason in the report. The loop also refuses an action that one of the last three approved images used, unless you pass `--allow-repeat-action` with a reason.

Use `--pose "<body position>"` in place of `--action` only when no action fits; write "bipedal" in it for an upright pose. Groomer and apron scenes use `--action groom-at-work`. Pass `--allow-viewer-gaze` only for a deliberate portrait.

### What the loop does and how to read it

The loop generates a cream master, has a vision model record literal observations beside the reference, and asks TypeSafe Jev for a probability on identity, anatomy, bandana, edges, style, scene, stray text and (for the export) transparency. Code adds two hard rules. Anatomy: never more than two front paws, two rear paws or four limbs; a raised paw is rejected unless the action is upright or an action pose. Acting: the reference's front-facing grin is rejected unless the action is a joy beat, and the eyes must be on the work unless the action lets them close or meet the viewer. Every gate must reach 0.85. A failed gate adds a correction to the next prompt, for up to 4 attempts on the same action. On a pass it exports the transparent PNG, runs the byte checker, gates a teal composite and writes `image-review.json`.

Read `art/art-loop.json`:

- `approved`: the artwork gate is satisfied. Look at the final once yourself. Report only a concrete defect (which paw, which edge). "Possible", "may" and "not independently certified" are not defects and never block. The image goes into the draft and to `request_review`; the owner makes the final call.
- `exhausted`: follow the failure table. Do not approve the best candidate yourself.
- `needs_export_review`: the master is fine and only the cut-out needs seeds. Inspect `<slug>-regions.jpg`, correct `seeds.json`, and rerun only the export. This is not a new generation.

Never generate outside the loop or add manual rounds on top of `--max-attempts`. Never write into the checkout's `public/` or `docs/`.

## Verification and publication

Read [Snackbox publication](references/snackbox-publishing.md) and [Maui quality gate](references/maui-quality.md). Create exactly one new `blogPost` with `perspective: "draft"`, a stable document ID, and an idempotent operation ID. Never rely on the create tool's default perspective. Save subsequent work with `save_draft` and the current `expectedRevision`.

File checks and a separate visual review must pass for every hero and inline illustration. The visual reviewer must actually see the final exported image alongside the approved reference; a generation prompt, successful upload, or checklist filled from memory is not evidence. Bind each approval to the SHA-256 of the exact CMS original and check served variants too. Replacing an image invalidates its approval. Any failed, missing, or uncertain check leaves the article in draft.

Publish mode is authorization, not evidence that the CMS is connected. As of September 12, 2026 the Next.js blog adapter, draft preview and publication webhook are live. The 18 existing guides were imported and CMS publication was verified without a deployment; see `docs/cms/live-verification.json`. Recheck current readiness on the receiving PC. In review mode a failed check never stops the draft or the review request: report it under `Degraded checks`. Do not deploy code, call the legacy publisher, or claim a CMS draft is live.

Only after all gates pass, including the humanize `--compare` and `--gate` checks, call `request_review` with the reviewed draft revision, a stable operation ID and a `note` (at most 2,000 characters) holding the one-line humanize result, the gains and the numbered "Questions for Camren", then read the document back and confirm it is queued for review. Record `publication.json` with the CMS document ID, draft revision, image hashes, intended canonical URL and check evidence, with `status: pending_owner_review` and `live: false`. Public-URL, RSS and sitemap verification happens after the owner publishes, in the next run's sync step. A CMS-only publish does not create a new deployment ID; record `deployment_id: null` and add `cms_document_id` and `cms_revision` to GTM run output. Do not invent a deployment.

After a timeout, read the saved/published document and check the live site before retrying. Reuse the same operation ID only for the identical operation; never create a second article to recover from a lost response. A revision conflict means re-read and review the changed content, not overwrite it. Mark the marketing card live only after public verification; keep the permanent recurring agent task in `preparing`. In review mode return the Snackbox draft URL and report `Not published — ready for review`. Keep credentials out of all artifacts.
