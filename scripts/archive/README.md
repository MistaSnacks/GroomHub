Retired scripts, kept for reference only.

- `publish-weekly-guide.py`, `verify-weekly-guide.mjs`, `weekly-guides-preflight.py`, `migrate-snackbox.mjs`: the MDX-and-Vercel blog publisher. Retired 2026-09-12 when the blog moved to Snackbox CMS; the weekly Hermes skill now saves a draft and calls `request_review`.
- `check-*.js`, `stats.js`, `final-stats.js`, `seed-supabase.js`, `clear-dns-errors.js`: one-off pipeline analysis that reads gitignored `data/` files from the March 2026 import.
- `test-service-key.js`, `test-fetch.js`, `test-places.js`: manual live-service probes, not tests. `test-service-key.js` inserts into production; do not run it.
