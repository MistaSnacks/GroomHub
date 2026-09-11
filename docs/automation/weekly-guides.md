# Weekly GroomLocal guides

Hermes runs each Monday at 9:00 a.m. America/Los_Angeles (first run September 7, 2026). The user authorized recurring GTM tracking and verified publication on September 5, 2026.

Job `groomlocal-weekly-guides` (`7d9933d99b17`) uses `gpt-5.6-luna` with medium reasoning through the `openai-codex` ChatGPT subscription provider. Per-job `base_url` is unset so Hermes resolves its own pooled OAuth credential at `https://chatgpt.com/backend-api/codex`. An explicit per-job URL bypasses that pool in this Hermes version. The API key added during initial setup was removed from Hermes; no API fallback is configured. Research and image services retain their separate billing.

## Each run

1. Synchronize any pending GTM updates for already-published runs.
2. Create or reuse a card in the explicit `groomlocal` project, column `preparing`, type/channel `seo`. Save its actual ID in the run directory.
3. Research live opportunities and select at most one worthwhile NEW guide on a nonoverlapping topic. Do not publish duplicate or cosmetic content just to meet a quota.
4. Write and review the MDX, direct source links, topic mapping, and a newly generated topic-specific Maui illustration. Record the exact draft hash and completed checks.
5. Publish with `scripts/publish-weekly-guide.py`, then put the verified canonical URL and result on the GTM card and move it to `live`.

The current mode is **publish**. The release command reconstructs the current production source by SHA-1 and stages only the selected MDX, topic assignment, and required new PNG. It validates MDX, topic mapping, internal links, and image transparency. Vercel builds with production settings without assigning the live domain. The command checks the deployment's article, listing, feed, and blog sitemap, confirms production has not changed, promotes the release, and verifies the public URL. Local content is synchronized only where that will preserve unrelated edits.

A real GTM card and completed factual/editorial/image checks are required before publication. If the board, source acquisition, content validation, build, page checks, or production-baseline check fails, stop and record the reason. Do not bypass the publisher by deploying the working checkout. A completed release is recorded in `publication.json`; never republish it merely to retry a failed board update.

## Files and outputs

- `docs/automation/weekly-guides-policy.json`: mode, authorization, schedule, model, and output root.
- The live Hermes cron table remains authoritative; machine-specific job snapshots are not transferred.
- `scripts/weekly-guides-preflight.py`: inventories content and pending board updates in a fresh run directory.
- `scripts/publish-weekly-guide.py` and `scripts/verify-weekly-guide.mjs`: controlled release and validation.
- `skills/hermes-blog-skill/SKILL.md`: editorial, GTM, and publication instructions.
- `skills/hermes-blog-skill/references/seo-editorial.md`: underlying SEO and Maui requirements.

Run artifacts: `output/groomlocal-weekly/<timestamp>/` by default, resolved from the checkout root; existing installations may use an absolute path in their policy.
Scheduler reports: the active Hermes installation's `cron/output/7d9933d99b17/` directory.

Each run keeps its GTM card ID, source evidence, draft, review checks, release manifest, deployment result, and publication record. These are operational artifacts and are not deployed with the article.

## Operations

```bash
hermes cron list
hermes cron pause 7d9933d99b17
hermes cron resume 7d9933d99b17
hermes cron run 7d9933d99b17
hermes gateway status
```

`run` requests an immediate full editorial run. It uses subscription capacity and can incur research or image-service charges. The Mac must be running and connected; the launchd gateway cannot execute while the computer sleeps or is off.

To return to drafts, set policy mode to `review` and `publication_authorized` to false. The publisher rejects that configuration. A review run still creates a GTM card and delivers the complete draft.

## Verification

Fresh subscription OAuth login, Hermes CLI response, and a real scheduled DataForSEO call passed. The corrected scheduler returned `SCHEDULED_SUBSCRIPTION_LUNA_OK 3600`. These historical verification snapshots remain on the original runner and are not part of the handoff. The first complete release passed and is live at https://groomlocal.com/blog/dog-nail-trimming-cost-guide. Its publication.json records the exact two changed files and deployment. The sitemap is split: /sitemap.xml is the index and /sitemap/0.xml contains guides. Promotion explicitly selects the camrens-projects-24b42280 team. The publisher supports --resume for an already-built stage after a corrected verification error; source hashes and the production baseline must still match. No live browser viewport check was possible because no browser was connected.

## September 7 separation of responsibilities

Codex audits and maintains existing guides. Hermes creates new articles only, each with a newly generated Maui illustration. The policy and publisher enforce `--new` and `--asset`; the skill requires intent-level deduplication and visual review. The cron prompt invokes the repository preflight directly to avoid the scheduler script-directory error. The full existing-guide audit is in `docs/content-audits/2026-09-07/`.
