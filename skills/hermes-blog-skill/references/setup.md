# Use on another computer

This package preserves the GroomLocal Hermes workflow as of September 11, 2026,
including the September 7 requirement for new articles and new Maui artwork.
It shares instructions, runtime scripts, policy, and fixed visual references. It does not install a
scheduler, transfer credentials, or configure publishing on the other computer.

## Read or install

Any bot can read `skills/hermes-blog-skill/SKILL.md` directly from this repository.
For a Hermes installation, copy the entire `hermes-blog-skill` directory into that
installation's skills directory, retaining `references/` and its PNG files.
Use the skill name `hermes-blog-skill` or display title **Hermes Blog Skill**.
Reading the skill does not require running a job.

Pull `main` in the full GroomHub checkout, not just the skill directory. The
runtime scripts and policy live at the repository paths below. Run commands from
the checkout root. The shared policy writes to `output/groomlocal-weekly/`, which
is ignored by Git; both preflight and publisher resolve it from the checkout
root, even when called from another directory. Absolute output paths remain
supported for existing installations. Do not replace an existing machine's
policy or move its pending runs merely to match this shared default.

## Runtime prerequisites for executing the workflow

Check these files before an editorial run:

- `scripts/weekly-guides-preflight.py`
- `scripts/publish-weekly-guide.py`
- `scripts/verify-weekly-guide.mjs`
- `docs/automation/weekly-guides-policy.json`
- `src/lib/grooming-guides.ts`
- Current MDX articles under `src/content/blog/` and applicable `AGENTS.md` rules

These runtime files are now included in `main` for the September 11 handoff.
The exact handoff paths are in `docs/automation/hermes-runtime-files.json`.
Install Python 3.11 or newer, Node.js compatible with the repository's Next.js
version, Git, `uv`, and the Vercel CLI. Run `npm ci` in the checkout to install
the existing locked JavaScript dependencies used by the verifier. Use a Unix
shell (or WSL on Windows) for the shell image helper.

The Git checkout is not a complete snapshot of the latest deployed site.
Read `docs/automation/content-inventory.json` alongside local MDX to avoid
duplicating guides or drafts missing from the checkout. Its entries are coverage
exclusions, not proof of publication; reconcile them with current live pages and
GTM. The controlled publisher reconstructs current production source before
applying a new article. Never deploy the Git checkout wholesale.

The image workflow uses `scripts/maui-blog-image.sh`,
`scripts/maui-compare-index.py`, and `scripts/maui-remove-background.py`, or
available image tools meeting the same appearance and export requirements.
Both provider helpers are bundled at `scripts/image-providers/{gemini,gpt-image}.py`;
no external `.claude` directory is needed. Their `uv` shebangs install declared
dependencies. Supply image API keys through the process environment or the
checkout's ignored `.env.local`. Provider defaults are preserved; the image-model
comparison did not change the weekly default. The bundled OpenAI helper retains
its existing Image 2 to 1.5 organization-verification fallback and reports the
actual model used. Inspect helper arguments before execution.

Run the extractor with its dependencies, for example:

```bash
uv run --with numpy --with scipy --with Pillow python scripts/maui-remove-background.py --help
```

Its `--sources` JSON is an array of `{ "scene": "new-slug", "source":
"output/groomlocal-weekly/<run>/artwork/master.png" }`; source paths are relative
to the checkout or absolute. `--output` must be a run-local directory. Optional
`--seeds` maps scene names to reviewed normalized `[x, y]` coordinate lists.
Inspect the generated numbered region diagnostic before selecting enclosed gaps.

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

## Temporary Git handoff

The user requested these runtime files stay tracked until the other machine has
pulled them. After transfer is confirmed, any later removal from tracking must
preserve local copies first. `.gitignore` alone does not untrack committed files;
`git rm --cached` affects future checkouts and may remove clean copies on another
machine's next pull. The transfer commit remains available in Git history.
