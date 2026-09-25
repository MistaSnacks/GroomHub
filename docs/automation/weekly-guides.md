# Weekly grooming guides

One new guide per week, written by the Hermes blog skill on the receiving Mac (see the workspace `AGENTS.md`), with a new Maui illustration, and handed to the owner for review inside Snackbox CMS. Nothing publishes without the owner.

## Policy

`docs/automation/weekly-guides-policy.json` is the contract the skill reads at the start of every run.

| Field | Value | Meaning |
|---|---|---|
| `mode` | `review` | Save a Snackbox draft and call `request_review`. Never `publish_draft`. |
| `publication_authorized` | `false` | Agent self-review is not owner approval. |
| `review_workflow` | `snackbox_request_review` | The `blogPost` collection has `requireReview` on; the owner publishes from the Studio. |
| `maximum_articles_per_run` | `1` | |
| `require_new_maui_image` | `true` | The bundled art loop must approve a new illustration. |
| `output_root` | `output/groomlocal-weekly` | Relative to the checkout; the art loop requires run artifacts inside the checkout. |
| `schedule` | `0 9 * * 1` America/Los_Angeles | |

The retired MDX and Vercel publisher (`scripts/archive/publish-weekly-guide.py`) is not part of this workflow and must not be invoked.

## What a run produces

- A Snackbox `blogPost` draft with the article, SEO fields, related links and the approved hero image.
- A `request_review` call on that draft, verified by reading the document back.
- A run directory under `output_root` with `publication.json` (status `pending_owner_review`, `live: false`), the art loop record, gate JSON files and `report.md`.
- A GTM board card in `preparing` until the owner publishes and the public URL is verified.

## Owner steps

1. Open the Snackbox Studio review queue.
2. Read the draft, check the Maui image against `docs/maui/STYLE-STANDARD.md`.
3. Publish from the Studio, or leave a comment and reject.

## Verifying a run without trusting "Last run: ok"

The scheduler reports success when the process exits cleanly, not when a draft exists. Check:

- The run directory has `publication.json` with a `cms_document_id`.
- The Snackbox document is in `review` state.
- The art loop record ends `approved` (not `exhausted` or `needs_export_review`).

## Known constraints

- The art loop calls `scripts/blog-hero-image.py`; keep that helper present in the checkout the skill runs from.
- Apron Maui is always bipedal; the anatomy hard rule keys on limb counts, not on a raised paw.
- Model IDs and gate thresholds live in the skill; record the exact `jev_model` from each gate file when calibrating.
