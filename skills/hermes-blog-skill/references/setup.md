# Use on another computer

This package preserves the GroomLocal Hermes workflow as of September 11, 2026,
including the September 7 requirement for new articles and new Maui artwork.
It shares instructions and fixed visual references. It does not install a
scheduler, transfer credentials, or configure publishing on the other computer.

## Read or install

Any bot can read `skills/hermes-blog-skill/SKILL.md` directly from this repository.
For a Hermes installation, copy the entire `hermes-blog-skill` directory into that
installation's skills directory, retaining `references/` and its PNG files.
Use the skill name `hermes-blog-skill` or display title **Hermes Blog Skill**.
Reading the skill does not require running a job.

Run repository commands from the GroomLocal checkout root. Do not reuse the
original Mac's absolute paths. Configure the output directory for the destination
machine in its existing weekly-guides policy. Resolve relative output paths from
the checkout root. Keep run artifacts outside tracked source or locally ignored.

## Runtime prerequisites for executing the workflow

Check these files before an editorial run:

- `scripts/weekly-guides-preflight.py`
- `scripts/publish-weekly-guide.py`
- `scripts/verify-weekly-guide.mjs`
- `docs/automation/weekly-guides-policy.json`
- `src/lib/grooming-guides.ts`
- Current MDX articles under `src/content/blog/` and applicable `AGENTS.md` rules

The publishing helpers and topic index were local, uncommitted runtime files when
this documentation package was exported. A clone of the documentation branch
alone may not contain them. If they are missing, the bot can read and plan from
this skill, but must report the missing runtime before attempting the controlled
editorial run. Obtain the current maintained runtime rather than inventing a
replacement publisher or deploying the checkout wholesale.

The image workflow additionally uses `scripts/maui-blog-image.sh` and
`scripts/maui-remove-background.py`, or available image tools that meet the same
appearance and export requirements. Inspect the helpers' arguments and installed
dependencies before running them. Preserve their required runtimes, including
`uv` when declared by a helper.

Bundled visual references correspond to these repository locations:

| Bundled file, relative to this skill | Canonical repository location |
|---|---|
| `references/maui/STYLE-STANDARD.md` | `docs/maui/STYLE-STANDARD.md` |
| `references/maui/MAUI-BASE-PROMPT.md` | `public/maui-assets/MAUI-BASE-PROMPT.md` |
| `references/maui/approved-reference/*.png` | `docs/maui/approved-reference/*.png` |

Read the bundled versions when inspecting this package. When preparing a runtime,
restore missing reference files to their canonical locations; preserve any newer
explicitly approved standard and never overwrite approved images blindly. The
PNG files are opaque identity references, not publishable transparent cutouts.
New scenes require newly reviewed background seeds, not seeds copied from an
unrelated image.

## Services and policy

- Authenticate GTM Board for project `groomlocal`. Preserve the recurring task ID
  recorded in `SKILL.md`; do not create another recurring card merely because this
  is a different computer.
- Search Console is available through GTM Board's `google_search_console`
  connector, configured for `sc-domain:groomlocal.com`. Confirm current access.
- Connect DataForSEO and a source-reading tool such as Firecrawl. Use current
  primary source pages for factual claims.
- Connect image generation and visual inspection tools. Copy no API keys or OAuth
  tokens into this repository or run reports.
- Publication requires the current policy to explicitly enable publishing and
  authenticated Vercel access to GroomLocal's production project. Preserve the
  existing authorization scope and verification gates. If policy or access is
  absent, report the missing prerequisite; do not enable publication yourself.
- The existing schedule is Monday, 9 a.m. `America/Los_Angeles`, with at most one
  new article and new illustration per run. Its recorded model is
  `gpt-5.6-luna`, medium reasoning, via Hermes `openai-codex`. These are existing
  job settings, not instructions to configure a second scheduler.
- Coordinate with the existing weekly runner before executing from another PC.
  Check GTM for an active or already-published run and synchronize pending updates
  first. Do not run duplicate weekly publications from two machines.

For a missing preflight helper, stop before the run. For a scheduler path rejection
with an installed helper, use the direct-execution fallback in `SKILL.md` only
when the environment permits it. Reading the package never requires changing
credentials, schedules, or permissions.
