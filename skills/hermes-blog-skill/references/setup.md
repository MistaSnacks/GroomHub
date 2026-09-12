# Set up the portable skill on another PC

This handoff updates the repository skill only. It does not configure the current local Hermes bot, transfer secrets, install a schedule, or enable the unfinished site integration.

## Files to bring

Pull the GroomHub repository: `https://github.com/MistaSnacks/GroomHub`. Keep the full checkout while the existing MDX guides are being migrated: they and `docs/automation/content-inventory.json` are coverage exclusions. Copy the complete `skills/hermes-blog-skill/` folder, including scripts and all six approved PNG references, into the receiving agent's skill directory. Its skill name is `hermes-blog-skill`.

If an existing receiving Hermes job loads `groomlocal-weekly-guides`, explicitly update that receiving installation to the new skill name or preserve its installed alias consistently. Do not create another weekly job. Do not reuse the old prompt that commands `scripts/publish-weekly-guide.py`; that prompt belongs to the legacy local runner and conflicts with this CMS workflow.

Required checkout resources:

- `AGENTS.md`, `docs/automation/weekly-guides-policy.json`, `docs/automation/content-inventory.json`, current `src/content/blog/`, and the latest `docs/content-audits/`.
- `docs/cms/groomlocal-schema.json`, `docs/cms/snackbox-handoff.md`, and `docs/cms/live-verification.json`.
- `docs/maui/STYLE-STANDARD.md`, `docs/maui/approved-reference/*.png`, `public/maui-assets/MAUI-BASE-PROMPT.md`.
- For command-line image generation: `scripts/maui-blog-image.sh`, `scripts/maui-compare-index.py`, `scripts/image-providers/{gemini,gpt-image}.py`.
- For transparent export: `scripts/maui-remove-background.py`. The existing `docs/maui/transparency-seeds.json` is only for its matching reviewed scenes; new scenes need their own inspected gaps.

The six bundled reference PNGs are opaque appearance masters, not deployable cutouts. Compare their hashes with the canonical checkout copies. Do not overwrite a newer explicitly approved standard or treat older illustrations as the reference.

## Tools, credentials and dependencies

Read [the complete tool checklist](tools.md). Connect Snackbox, GTM Board, DataForSEO, source reading, reference-image generation, visual inspection and a browser. Use the receiving PC's own credentials; copy no `.env`, OAuth files, API keys, or local Hermes configuration from this machine. The sample MCP configuration uses an environment placeholder rather than a real token.

Install Python 3.11+, Pillow, Git and Node.js. `uv` runs the checked-in image provider helpers with their declared dependencies. For the background remover use:

```bash
uv run --with numpy --with scipy --with Pillow python scripts/maui-remove-background.py --help
```

Read helper arguments before execution. Image generation helpers write under `public/maui-assets/_compare/` relative to their staging root, so run them from a unique staging copy inside the run directory containing only the needed helpers, base prompt and approved reference. Keep generated masters, transparent exports and evidence in that run directory. Do not modify the production checkout to generate article media.

The upload helper needs only Python's standard library. It uploads a local PNG directly into Snackbox media using `SNACKBOX_GROOMLOCAL_TOKEN`. Article creation and publication use MCP.

## Policy and first run

Use the receiving checkout's editorial policy; preserve an existing absolute `output_root` and its pending run history. A fresh checkout's shared policy uses a checkout-relative output folder. Publishing requires `mode: publish` and `publication_authorized: true`; otherwise keep drafts. The CMS preflight reads those controls but deliberately does not call the legacy publisher. Tool access and end-to-end live-site readiness still need verification.

The existing job is Monday 9 a.m. `America/Los_Angeles`, at most one new article with new Maui art. Preserve its existing model/provider/schedule unless Camren directs a change. Coordinate the receiving runner with the current runner before enabling it; two PCs must not publish the same weekly run. Use GTM's active run/card and CMS document ID to detect in-progress or completed work.

Suggested receiving-job prompt:

> Use hermes-blog-skill for GroomLocal. Run its bundled CMS preflight against the GroomHub checkout. Reconcile CMS drafts/published posts, the existing MDX inventory, live pages and GTM. Research at most one new nonoverlapping guide with DataForSEO, generate new Maui art, and save a Snackbox draft. Complete the file and separate visual quality gates for every image. Publish through Snackbox MCP only in authorized publish mode after the CMS-to-site connection and draft preview have been verified. Never use the legacy MDX/Vercel publisher or update existing guides. Track both GTM cards and verify the live URL before marking live. Do not alter credentials, schedules, models, unrelated code or send messages.

First run should verify connections read-only, then draft. The schema alone is not the live-site integration. See [publication readiness](snackbox-publishing.md) for the verified blog connection and the current checks required before a publish-mode run can proceed.

## Verify the package

From the checkout, run `python3 -m unittest discover -s skills/hermes-blog-skill/tests -v`. Nine offline checks cover missing/uncertain visual approval, image replacement, opaque/empty/clipped exports, preflight authorization and the local-upload request. They do not spend API credits or publish content. Run the receiving agent's skill validator if available.
