# GroomLocal codebase audit

| | |
|---|---|
| Audited commit | `942e5617ca3c744bcb66d8612ede8ca2aeab8183` (2026-09-12, "Serve marketing pages from Snackbox and untrack installed Hermes skill") |
| Working tree | Dirty: 13 modified tracked files, 3 untracked (`src/lib/city-route.ts`, `outreach/contacted-list.md`, `docs/maui/opaque-masters/tip-jar-groomer-v2.png`). Audited as-is. |
| Date | 2026-09-24 |
| Model | Claude Fable 5.1 (orchestrator) with 14 fresh-context subagents (2 mappers, 12 dimension auditors) and 4 refuters |
| Repo | `/Users/admin/GroomingBook Directory/pnw-grooming-directory`, remote `origin` = github.com/mistasnacks/groomhub, `main` at parity with `origin/main`; also CLI-linked to Vercel project `groom-hub` |

**Method.** Read-only. Two mapping agents produced a repo map; git history was mined for churn and fix hotspots; type-check, lint, the one test script, npm audit, and a cycle detector were run (build was skipped because static generation hits production Supabase). Twelve dimension auditors ran in parallel with the map and hotspots, each citing only files it opened. Every Critical and High finding was then handed to a fresh-context refuter that had not produced it. Facts are labeled OBSERVED (a tool result shows it) or INFERRED (reasoned from code). No source was edited, no database queried, no external service called. Refuter tally over 23 High findings: **0 refuted / 15 downgraded / 8 survived**. No finding reached Critical. One survival (the Next.js advisory) is an orchestrator decision: the refuter downgraded it conditionally on whether an RCE affects 16.1.6, and the observed `npm audit` output shows one (GHSA-2xp9-vwfh-vxw4, image optimizer AVIF RCE, fixed in 16.3.3), so High is retained with that reasoning recorded.

---

## 0. Remediation status (2026-09-24, same day, commits 64c2f3b, 07b63d9, 61f8121, 86030ee)

**Done and verified** (`tsc` clean, `eslint` 0 errors, 33 offline unit tests + 16 skill tests pass, migrations applied to the linked project and the ledger reconciled):

- SEC-01 JSON-LD escaping via `src/lib/json-ld.ts` at all 11 sites; angle brackets rejected in listing fields.
- SEC-02 / M1-2 claim verification: domain match auto-approves, otherwise `claim_requests` queue with an admin page, approve/reject emails, and a revoke action.
- FE-28 / M1-4 `src/lib/listing-rules.ts`: regular lists ignore payment; featured queries require an unexpired paid-through date; label, admin toggle, claim, unclaim, deletion and cron use the same predicate.
- SEC-09 / M1-3 Next 16.3.6; `npm audit` clean at high and above; unused MDX packages and `sharp` removed.
- OBS-1/2 / M1-5 `src/lib/email/send.ts`; `notified_at` / `notify_error` / `resend_id` on leads and quotes; no sandbox sender in production; cron returns 500 when it cannot notify; admin page for leads and quotes (M1-6).
- SEC-08 / M1-7 and the live findings the DB answered: owner PostgREST update policy, public lead insert, anon submission and newsletter inserts, authenticated analytics reads and authenticated storage writes removed; RLS enabled on the three exposed legacy tables; CHECK constraints on state and URL schemes; indexes added (`supabase/migrations/20260924120000_*`).
- M0-4 reconstructed baseline migration, ledger repaired, `database.types.ts` regenerated. M0-1/M0-3 tree committed, Node pinned, CI workflow. M0-2 `npm test` harness with suites for schema, tags, blog, CMS sanitizers, redirects, admin allowlist, city routes, pricing, email, sponsorship, claims, newsletter.
- OBS-16 / M2-2 structured logger, `/api/health`, boot-time env report, `global-error.tsx`, blog error boundary, root layout survives a cities failure, 404 vs outage distinguished. M2-7 `.env.example` and `src/lib/env.ts`.
- SEC-03 / M2-1 per-instance rate limiting on every public write path and search; search caps and CDN caching; Fuse operator stripping.
- Correctness batch: deletion order, price tier preservation, logo replace order, storage-remove logging, deterministic paging, Fuse cache signature, auth redirect loop, cron error propagation, Pacific time zones, revalidation on pricing/about/feed, cache tags from photo and admin actions, request-level memoization of the two hot lookups, client-side image resize.
- Copy and UI: honest dog-city empty state, tier names, newsletter and contact wording, signed unsubscribe route, em dashes removed, accessibility on the filter bar, quote wizard, claim form, search and newsletter inputs, edit-page save state.
- AI pipeline / M2-8: policy in review mode; skill says `request_review`; anatomy rule keys on limb counts; `--pose bipedal`; `scripts/blog-hero-image.py` added; providers load only their own keys; skill tracked in git; Python requirements pinned; `docs/automation/weekly-guides.md` rewritten. DC-01 `llms.txt` pricing fixed. Dead code and retired scripts archived; README rewritten.

**Needs the owner** (cannot be done from this machine):
1. Set `EMAIL_FROM` in Vercel to a verified Resend sender (or keep `QUOTE_FROM_EMAIL`); in production no email is sent without it. Confirm `QUOTE_NOTIFY_EMAIL`, `LISTING_NOTIFY_EMAIL`, `ADMIN_EMAILS`, `CRON_SECRET`, `HOUSE_LISTING_SLUG`, `REVALIDATION_SECRET` are set; `/api/health` reports what is missing by name.
2. Push `main` and deploy from git. Four commits are local only.
3. Sync `skills/hermes-blog-skill/`, `scripts/blog-hero-image.py`, `scripts/image-providers/*`, and `docs/automation/weekly-guides-policy.json` to the receiving Mac (it was unreachable at 192.168.4.38 during this session).
4. Rotate the service-role key on a schedule and move the Google Ads/GSC credentials out of `.env.local` (SEC-22).

**Deliberately not done**: shared-store rate limiting (Upstash) and Turnstile (new services; the in-memory limiter is the hook), `ServiceCityPage` extraction (M2-4), the city/metro table consolidation and remaining duplication sweeps (M2-3 c/d), photo array RPC (C-08), `server-only` package (Node dependency install was done without it; add with the next install), framer-motion removal and other Low performance items, Sentry.

---

## 1. Executive summary

**Health grade: D+.** The app type-checks, has no import cycles, and its auth checks are correct as written, but a stored XSS is reachable on every public listing page by any self-registered account, a consumer-facing pricing promise is contradicted by the ranking code, there are effectively no tests and no CI, nothing observable exists for the money paths, the database schema is not in source, and production has been deployed from an uncommitted working tree for twelve days.

**Top 3 risks**

1. **Stored XSS through JSON-LD on public pages (SEC-01)** combined with **unverified listing claims (SEC-02)**. Anyone can sign up, claim any unclaimed listing, set its name or email to a `</script><script>` payload, and have it execute for every visitor of the profile, city, service, and specialty pages for as long as ISR caches it. Fix is one `jsonLd()` escaping helper plus a claim-verification gate.
2. **Undisclosed paid placement (FE-28).** The pricing FAQ says "Payment never changes your badge or where you appear in the regular list." The server ranks premium first and the client re-sorts `is_featured` to the top of every regular list; the "Sponsored" chip keys on a different column, so an admin-featured or lapsed row is pinned above competitors with no label.
3. **Quote and lead notifications can fail silently, and nothing reads `quote_requests` (OBS-1, OBS-2, CFG-03, CFG-12).** Missing env or a Resend rejection (including the default `onboarding@resend.dev` sender) drops the email with no log while the user sees success. The row is written to a table no page, script, or export reads.

**Top 3 opportunities**

1. **A one-day safety net**: `node:test` + `tsx` already work offline (proven by `scripts/test-cms-content.tsx`). Cover the five pure modules that carry the fix history (`schema.ts`, `tags.ts`, `blog.ts`, `safe-redirect.ts`/`admin.ts`, `city-route.ts`), fix the 4 lint errors, and add a 20-line CI workflow. Every later change gets cheaper.
2. **Collapse duplication that is already causing drift**: one service-role client factory (10 copies), one email sender (5 copies with 4 failure behaviors), one `slugifyCity` (9 copies, 3 algorithms), one metro/city table (9 hand lists that disagree), one `isSponsored()` (4 columns). Most Medium findings are symptoms of these.
3. **Make production reconstructible**: commit the working tree (including the untracked `city-route.ts` that three modified pages import), dump the live schema and policies into a baseline migration, regenerate `database.types.ts`, pin Node, and deploy from git.

---

## 2. Repo map

**Purpose and users.** GroomLocal (`pnw-grooming-directory/`) is a Next.js 16.1.6 App Router + React 19 + Supabase + Tailwind v4 directory of pet groomers in Washington and Oregon, deployed on Vercel. Users: pet parents searching city/service/specialty pages and submitting quote, lead, contact, and newsletter forms; groomers who claim a listing and manage it in a dashboard; the owner (admin) who views analytics, toggles featured listings, and runs outreach and a weekly blog from a second Mac ("Sarah's Hermes", per `AGENTS.md` at the workspace root). Brand was "GroomHub" until 2026-03-03; the Vercel project is still named `groom-hub`.

**Stack and runtimes.** Node 22.14 locally (no pin in repo), Vercel (Node major unknown), Supabase Postgres + Auth + Storage (bucket `groomer-photos`), Resend via raw `fetch`, Snackbox CMS via a vendored 728-line SDK (`src/lib/cms/sdk.ts`), Vercel Analytics, one Supabase Deno edge function, Python tooling for Maui artwork (rembg venv, uv scripts), and an off-repo Hermes skill with GPT-5.4 vision, gpt-image-2, and a TypeSafe Jev gate.

**Entry points.**
- Route handlers: `/api/search` (typeahead), `/api/newsletter`, `/api/quotes`, `/api/revalidate` (CMS webhook, shared secret), `/api/snackbox-edit` (CMS edit session), `/api/cron/refeature-check` (Vercel cron, `CRON_SECRET`), `/api/og/city`, `/api/og/groomer`, `/auth/callback`, `/auth/confirm`, `/blog/feed.xml`.
- Server actions: `claim/actions.ts processClaim`; `dashboard/actions.ts` (unclaim, updatePassword, deleteAccount, updateListing); `dashboard/photos/actions.ts` (5 photo/logo actions); `admin/dashboard/actions.ts` (3) and `admin/dashboard/listings/actions.ts` (2); `get-listed/actions.ts submitListing`; `contact/actions.ts`; `groomer/[slug]/actions.ts sendGroomerMessage`; inline action in `reset-password/page.tsx`.
- Middleware `src/middleware.ts`: session refresh for `/dashboard|/admin|/claim|/login|/signup|/auth`; redirects unauthenticated `/dashboard` and `/admin`, non-admin `/admin`. `/claim/*` matched but not gated (pages self-check).
- Cron: `vercel.json` one entry, `/api/cron/refeature-check` at 15:00 UTC daily.
- Edge function: `supabase/functions/notify-listing-submission` (DB webhook receiver, emails `info@groomlocal.com`; duplicates the app-side notify).
- Pages: ISR `revalidate = 300` on home, groomer profiles, all three city trees (dog/cat/mobile × state × city), services and specialties; dynamic for search, blog, pricing, about, dashboard, claim, admin. Root `layout.tsx:59` awaits `getCities()` on every render.

**Core modules.** `src/lib/supabase/queries.ts` (675 L; all public reads; full-table 1000-row paging under `unstable_cache` 300 s tagged `listings`; in-process Fuse search); `tags.ts` (taxonomy + read-time `normalizeTags`); `schema.ts` (12 JSON-LD builders); `blog.ts` + `cms/*` (Snackbox reads; the 18 MDX files in `src/content/blog/` are dead at runtime); `email/template.ts` (used by 2 of 5 mailers); `pricing.ts`/`tiers.ts` (Free + "Sponsored", DB slug `premium`; `BETA_MODE = true` gives everyone 50 photos); `refeature-trigger.ts`; `listing-review.ts` (hand-kept redirects and exclusions); `city-route.ts` (untracked, canonical city redirects); `database.types.ts` (generated 2026-03-27, zero importers, stale).

**Data flow.** Claim → `processClaim` (service role, atomic `.is("owner_id", null)`) → dashboard edit (service role, ownership re-checked in app code) → `updateTag("listings")` + `revalidatePath` → public profile. Leads/quotes/contact/newsletter: honeypot + 20 KB cap, no rate limit; leads and quotes written with the service role; emails best-effort via Resend. Blog: 100% Snackbox; webhook purges `sbx:groomlocal*` tags. Admin: `ADMIN_EMAILS` allowlist checked in middleware, admin layout, and every action.

**Data layer.** 8 tables in the generated types; only `quote_requests` and `listing_submissions` have CREATE TABLE migrations in the repo. `business_listings`, `cities`, `leads`, `analytics_events`, `search_logs`, `newsletter_subscribers` (only a "run in SQL editor" script), the storage bucket, and every RLS policy on them were created out of band. Six migrations total; the 20260903 trigger guards 8 privileged columns against anon/authenticated updates, but all app writes use the service role, so it only matters for direct PostgREST calls.

**External boundaries.** Service-role client constructed in 10 places (no shared factory, no `server-only`). Resend called from 5 raw `fetch` sites, all defaulting `from` to `onboarding@resend.dev`. Image `remotePatterns` allow whole hosts for unsplash, GCS, and the Supabase project.

**Build, CI, deploy.** No `.github/`, no husky, no CI. `next build` on Vercel type-checks (ESLint no longer runs in `next build` on Next 16) and reaches production Supabase during static generation (`cpus: 2`, `staticGenerationMaxConcurrency: 1` exist to throttle that). Deploys have been made from the working tree via the Vercel CLI; `main` has not moved since 2026-09-12.

**Conventions.** kebab-case files; co-located `page.tsx`/`actions.ts`/`*-client.tsx`; actions return `{ ok }`/`{ error }` or `redirect("?error=")`; `console.error` with `error.code` or `error.message`; shared `clean(value, max)` + `hp_field` honeypot idiom; dated decision comments in code.

**Surprises.** No LLM calls in the app itself (all AI is tooling). Public form actions hold the service-role key. `logSearch` has no callers while the admin dashboard charts `search_logs`. `llms.txt` advertises four pricing tiers that no longer exist. `.env.local` also holds Google Ads and GSC credentials that nothing in this repo reads. The Hermes blog skill that decides which artwork the owner sees is gitignored and untracked, and its mandated art loop calls a script that does not exist in this checkout.

---

## 3. Observed health

| Command | Exit | Key output |
|---|---|---|
| `npx tsc --noEmit -p tsconfig.json` | 0 | clean |
| `npx eslint .` | 1 | 4 errors (`@next/next/no-html-link-for-pages` at `src/app/admin/layout.tsx:57,61`, `src/app/claim/[slug]/page.tsx:172` ×2), 19 warnings (unused `_bc/_il/_fq` in `schema.ts`, `Star`, `size`, 2× `no-img-element`) |
| `npm run test:guides` | 0 | 3 pass, 0 fail, 1 skipped (live route test needs `GUIDES_TEST_URL`). Note: the 3 passing tests fetch the production CMS over the network. |
| `npx tsx --test scripts/test-cms-content.tsx` (run by the tests auditor) | 0 | 2 pass, offline. Not wired to any npm script. |
| `python3 -m unittest skills/hermes-blog-skill/tests/test_helpers.py` | 0 | 16 tests OK (directory is gitignored) |
| `npm audit` | 1 | 17 vulnerabilities: 1 critical, 10 high, 4 moderate, 2 low. Direct: `next` 16.1.6 (30 advisories incl. GHSA-2xp9-vwfh-vxw4 image-optimizer AVIF RCE and GHSA-p293-qw3h-jr36 Windows RCE, fix 16.3.6 non-major), `sharp` 0.34.5 (libvips/libheif, fix 0.35.4 major). Transitive: `ws` 8.19.0 via realtime-js (unused), `postcss` 8.4.31 pinned by next, `yaml`, `js-yaml`, eslint toolchain. |
| `npx madge --circular --extensions ts,tsx src` | 0 | 178 files, no circular dependency |
| `npm outdated` | 1 | failed: local npm cache corruption (ENOENT in `~/.npm-new-cache`); not retried (network) |
| `next build` | skipped | static generation reads production Supabase; forbidden by audit boundary |
| `npm ls --depth=0` | 0 | lockfile v3 in sync; 5 extraneous wasm shim packages |

Git: 63 commits since 2026-02-19; last 2026-09-12. Hotspots by churn × fix commits: `src/lib/schema.ts` (12 commits, 6 fix), `src/app/groomer/[slug]/page.tsx` (11/9), `dog-grooming/[state]/[city]/page.tsx` (11/6), `blog/[slug]/page.tsx` (11/6), `services/[slug]` and `specialties/[slug]` (9/7 each), `queries.ts` (7/3), `pricing.ts` (5/4). No TODO/FIXME/HACK comments anywhere in `src`.

---

## 4. Entry-point security table

| # | Path | Method | Authentication | Authorization | Input validation | Rate limit | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `/api/search` (`route.ts:45`) | GET | none | public | `q` ≥ 2 chars; no max length | none | `force-dynamic`; Fuse over whole table per request; extended-search operators honored |
| 2 | `/api/newsletter` (`:10`) | POST | none | n/a | 20 KB cap, honeypot, email regex | none | anon upsert; needs UPDATE policy for repeat subscribes |
| 3 | `/api/quotes` (`:138`) | POST | none | n/a | 20 KB cap, honeypot, `validate()` | none | service role; PII fallback into `analytics_events`; Resend result never checked |
| 4 | `/api/revalidate` (`:12,16`) | GET/POST | shared secret, `timingSafeEqual` | n/a | path/tag prefix checks | none | correct |
| 5 | `/api/snackbox-edit` (`:23,85`) | POST/GET | token verified server-to-server against CMS | n/a | `return` forced same-origin | none | httpOnly cookie 12 h; no SSRF |
| 6 | `/api/cron/refeature-check` (`:9`) | GET | `Bearer $CRON_SECRET` (plain `!==`) | n/a | none needed | none | fails closed when secret unset (daily 401) |
| 7 | `/api/og/city` (`route.tsx:14`) | GET | none | public | `city`,`state` required, otherwise reflected into image | none | uncached DB read + satori per request |
| 8 | `/api/og/groomer` (`:8`) | GET | none | public | `slug` required | none | echoes `${error}` to client |
| 9 | `/auth/callback` (`:5`) | GET | PKCE code exchange | n/a | `next` via `safeRedirectPath` | Supabase | redirect host from `x-forwarded-host` |
| 10 | `/auth/confirm` (`:6`) | GET | OTP verify | n/a | `next` sanitized | Supabase | same |
| 11 | `/blog/feed.xml` (`:38`) | GET | none | public | CMS data, XML-escaped | none | HEAD to fixed CMS media host only |
| 12 | `processClaim` (`claim/actions.ts:9`) | action | session | only `owner_id IS NULL` | slug mapped/excluded | none | **no proof of ownership** (SEC-02) |
| 13 | `sendContactMessage` (`contact/actions.ts:14`) | action | none | n/a | honeypot, lengths, email regex | none | HTML escaped; fails closed without key |
| 14 | `submitListing` (`get-listed/actions.ts:61`) | action | none | n/a | honeypot, 20 KB, state ∈ {WA,OR}, email | none | anon insert; logs submitter email on honeypot hit |
| 15 | `sendGroomerMessage` (`groomer/[slug]/actions.ts:77`) | action | none | target must have `owner_id` | honeypot, lengths | none | service role; `auth.admin.getUserById`; unauth mail relay (SEC-04) |
| 16 | `unclaimListing` (`dashboard/actions.ts:61`) | action | `requireUser` | `requireOwnership` + `.eq("owner_id")` | slug | none | double-guarded |
| 17 | `updatePassword` (`:90`) | action | `requireUser` | self | min 6 (UI says 8); no re-auth | none | |
| 18 | `deleteAccount` (`:109`) | action | `requireUser` | self | literal `DELETE` | none | release error ignored before `deleteUser` |
| 19 | `updateListing` (`:171`) | action | `requireUser` | `requireOwnership` + `.eq("owner_id")` | lengths, email regex, website protocol, hours shape; `name/phone/address/city/state/zip` unsanitized; `services`/`specialties` raw JSON | none | feeds JSON-LD unescaped (SEC-01) |
| 20 | photo/logo actions (`photos/actions.ts:52,103,142,187,242`) | actions | `requireListingOwnership` | `owner_id === user.id` (single guard) | client-declared MIME, 5 MB, tier cap | none | public bucket; read-modify-write on `images` |
| 21 | admin analytics actions (`admin/dashboard/actions.ts:8,66,225`) | actions | `requireAdmin` | `ADMIN_EMAILS` | `days` unvalidated | none | analytics read with the caller's `authenticated` session, not service role |
| 22 | admin listings actions (`listings/actions.ts:13,31`) | actions | `requireAdmin` | allowlist | slug/bool | none | `toggleFeatured` sets `is_featured` only |
| 23 | inline reset action (`reset-password/page.tsx:19`) | action | session-bound `auth.updateUser` | self | match + min 8, `next` sanitized | none | |
| 24 | `src/middleware.ts` | all matched | session refresh; redirects | | strips inbound `x-sbx-public-view` | | every guarded page/layout/action re-checks auth (defense in depth) |
| 25 | Vercel cron | GET | see #6 | | | | |
| 26 | Edge function `notify-listing-submission` | POST | `verify_jwt = true` (any project JWT incl. the public anon key, INFERRED) | none | none: `req.json()` used as-is | none | emails `info@` from `noreply@groomlocal.com`; duplicates #14 |
| 27 | Storage bucket `groomer-photos` | GET public / writes via #20 | public read | app-side only | see #20 | none | bucket policies not in repo |

---

## 5. Env var inventory

Legend: phase build = inlined by `next build`; runtime = read on Vercel; script = tooling only. "Declared" = name present in `.env.local` (names only; values never read). No `.env.example` exists; `src/lib/cms/index.ts:4` tells the operator to see one.

| Name | Read in | Declared | Documented | Phase | Kind | Note |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/{client,server,browser,middleware}.ts`; 9 service-role sites; `refeature-trigger.ts`; 12 scripts | yes | plan doc only | build+runtime+script | public | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same 4 lib files; 6 scripts | yes | no | build+runtime+script | public by design | |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/quotes/route.ts:10`, `claim/actions.ts:27`, `claim/[slug]/success/page.tsx:28`, `dashboard/actions.ts:12`, `dashboard/photos/actions.ts:11`, `dashboard/inbox/page.tsx:9`, `groomer/[slug]/actions.ts:18`, `admin/dashboard/actions.ts:13`, `admin/dashboard/listings/actions.ts:9`, `lib/refeature-trigger.ts:35`; 7 scripts | yes | plan doc only | runtime+script | secret | 15 `!` assertions, no central validation |
| `RESEND_API_KEY` | 5 app sites + edge function `index.ts:27` | yes | no | runtime | secret | absence silently no-ops 4 of 5 sites |
| `QUOTE_FROM_EMAIL` | all 5 mail sites | yes | no | runtime | not secret | fallback `onboarding@resend.dev` |
| `QUOTE_NOTIFY_EMAIL` | `api/quotes/route.ts:118` | yes | no | runtime | | absence: quote email silently skipped |
| `LISTING_NOTIFY_EMAIL` | `get-listed/actions.ts:29`, cron `:23` | yes | no | runtime | | |
| `CONTACT_NOTIFY_EMAIL` | `contact/actions.ts:46` (default `hello@groomlocal.com`) | yes | no | runtime | | |
| `CRON_SECRET` | cron route `:10` | yes | no | runtime | secret | missing = daily 401 (closed) |
| `HOUSE_LISTING_SLUG` | `refeature-trigger.ts:32` | yes | deliberately not | runtime | sensitive | missing = `configured:false`, never emails |
| `ADMIN_EMAILS` | `lib/admin.ts:2` | yes | no | runtime | sensitive | empty = nobody is admin (closed) |
| `REVALIDATION_SECRET` | `api/revalidate/route.ts:6` | **no** | `docs/cms/snackbox-handoff.md:12` | runtime | secret | read-but-undeclared locally |
| `NEXT_PUBLIC_SNACKBOX_URL` | `cms/index.ts:17` (default), `cms/sdk.ts:166`, `cms/Overlay.tsx:12,23` (no default), `api/snackbox-edit/route.ts:44` (no default) | **no** | no | build+runtime | public | readers disagree on defaults |
| `NEXT_PUBLIC_SNACKBOX_PROJECT` | `cms/index.ts:3` (default `groomlocal`), Overlay, snackbox-edit | **no** | no | build+runtime | public | |
| `SNACKBOX_URL` | `cms/sdk.ts:166` fallback | **no** | no | runtime | | |
| `NEXT_PUBLIC_SHOW_ADS` | `components/ad-slot.tsx:20` | **no** | code comment | build (inlined) | flag | off everywhere; needs redeploy to flip |
| `NODE_ENV` | auth callback/confirm, snackbox-edit | n/a | n/a | runtime | | |
| `FIRECRAWL_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `OPENAI_API_KEY` | `scripts/**` only (+ `config.toml:95` local Studio) | yes | script comments / skill refs | script | secret | |
| `GUIDES_TEST_URL` | `scripts/test-grooming-guides.ts:48` | no | no | test | | |
| `SNACKBOX_GROOMLOCAL_TOKEN`, `TYPESAFE_API_KEY`, `VOICE_TOOLS_OPENAI_KEY`, `MAUI_VISION_MODEL` | gitignored skill scripts | no | skill `setup.md`, `tools.md` | script (remote) | secret | |
| `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_MANAGER_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GSC_SITE_URL` | **nowhere in this repo** | yes | no | none | secret | declared-but-unused; belong to `~/gtm-board` |
| `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN`, `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`, `S3_*` | `supabase/config.toml` disabled blocks | no | no | local CLI | unused | |

Read-but-undeclared: `REVALIDATION_SECRET`, `NEXT_PUBLIC_SNACKBOX_URL`, `NEXT_PUBLIC_SNACKBOX_PROJECT`, `SNACKBOX_URL`, `NEXT_PUBLIC_SHOW_ADS`, `GUIDES_TEST_URL`. Declared-but-unused: the six Google Ads/GSC vars. Secrets wrongly `NEXT_PUBLIC_`: none. Feature flags: `NEXT_PUBLIC_SHOW_ADS` always off; `BETA_MODE` (`lib/tiers.ts:2`) always on in code.

---

## 6. Findings

Worst first within each dimension. Severity shown is post-refutation. "Also:" lists duplicate findings from other dimensions folded into the entry. All paths relative to `src/` unless they start with `scripts/`, `supabase/`, `docs/`, `public/`, `skills/`, or are root files.

### 6.1 Security

**SEC-01. Stored XSS via unescaped JSON-LD on public pages.** High. INFERRED (code path end to end; `node -e` confirms `JSON.stringify` leaves `</script>` intact). Refuter: SURVIVED.
- Where: `app/groomer/[slug]/page.tsx:138-149`; `app/dog-grooming/[state]/[city]/page.tsx:447-452`; `app/cat-grooming/[state]/[city]/page.tsx:225-236`; `app/mobile-grooming/[state]/[city]/page.tsx:225-236`; `app/services/[slug]/page.tsx:99-102`; `app/specialties/[slug]/page.tsx:106-109`; data from `lib/schema.ts:73-88` (`name`, `telephone`, `email`, address) and `:330-360` (`itemListSchema`, up to 20 listings per page); written by `app/dashboard/actions.ts:173-236` with only length checks (email regex admits `</script>`); contrast `app/blog/[slug]/page.tsx` and `app/blog/page.tsx:47`, which apply `.replace(/</g, "\\u003c")`.
- Why: a listing owner (any account, see SEC-02) sets `name` to `x</script><script>...` and gets script execution for every visitor of the profile and every city/service/specialty page that lists it, cached by ISR up to 300 s per page and re-rendered on each revalidation. No `script-src` CSP (`next.config.ts:70,86`).
- Fix: one `jsonLd(obj)` helper that escapes `<`, `>`, `&` to `\u003c` etc., used by every `application/ld+json` site; reject `<`/`>` in `name`, `phone`, `email`, `address`, `city` in `updateListing`.

**SEC-02. Any signed-in account can claim any unclaimed listing.** High. INFERRED. Refuter: SURVIVED (memory records "Owner Confirmed" as a deliberate product choice; that changes wording, not exploitability).
- Where: `app/claim/actions.ts:18-59` (session + `owner_id IS NULL` only); badge rendered on `owner_id` alone (`app/groomer/[slug]/page.tsx:265-278,600-602`; `components/listing-card.tsx:250`); signup open (`app/signup/page.tsx:32`); consequences: contact-field edits (`dashboard/actions.ts:219-236`), lead routing to `listing.email` (`groomer/[slug]/actions.ts:120-158`), lead PII in `dashboard/inbox/page.tsx`.
- Why: bulk takeover of ~1,100 unclaimed scraped listings by script, with a trust badge, redirecting websites/phones/booking links and receiving consumer leads; real owners then hit "already claimed".
- Fix: gate the claim behind at least one signal (email at the listing's website domain, phone OTP, or admin approval queue); add an admin "revoke claim" action; consider not showing the badge until reviewed.

**FE-28. Pricing promise contradicted by ranking; featured rows pinned without a label.** High. OBSERVED. Refuter: SURVIVED and broadened. Also: C8 (arch), C-02 (correctness).
- Where: `app/pricing/pricing-page-client.tsx:26` ("Payment never changes your badge or where you appear in the regular list"); `lib/pricing.ts:36` ("Always labeled Sponsored so pet parents can trust the list"); server tier sort `lib/supabase/queries.ts:83-100` (`applyHierarchy`, applied at `:124,142,221,242,272`); client `components/city-listings-inner.tsx:134` (`result.sort(... is_featured ...)` after any user sort, used by city, service, and specialty pages); chip keyed on `subscription_tier === "premium"` (`components/listing-card.tsx:44,105-106,249`); featured selection keyed on `is_featured` (`queries.ts:282,315,353,389`); decoupled writers `admin/dashboard/listings/actions.ts:31-47` (toggles `is_featured` only), `claim/actions.ts:51-55` (sets tier free), `dashboard/actions.ts:69-73,122-126` (nulls tier, keeps `is_featured`).
- Why: undisclosed paid placement from the consumer's perspective; the admin "Set Featured" button and unclaim/delete paths produce rows pinned above competitors with no Sponsored chip.
- Fix: define `isSponsored(listing)` once (`sponsor_paid_until > now()` or a single column), use it for ordering, labeling, featured slots, and the cron; remove the featured-first sort from the regular list or change the FAQ.

**SEC-09. Next.js 16.1.6 carries 30 advisories including an image-optimizer RCE; fix is a non-major bump.** High. OBSERVED (`npm audit`). Refuter: downgraded to Medium conditional on an RCE existing; the audit output shows GHSA-2xp9-vwfh-vxw4 (critical, AVIF RCE in Image Optimization API, `<16.3.3`), so the orchestrator retains High. Also: DEP-D1.
- Where: `package.json:21` (`"next": "16.1.6"`, exact pin, so `npm audit fix` cannot move it), `:38` (`eslint-config-next` pinned). Reachable surfaces: `next/image` with unrestricted remote hosts (`next.config.ts:20-31`) and owner uploads validated only by client-declared MIME (`dashboard/photos/actions.ts:23-30`), so attacker bytes reach `/_next/image`; server actions everywhere (DoS advisories); middleware-bypass class mitigated by layout/action re-checks (`dashboard/layout.tsx:22-27`, `admin/layout.tsx:16`); CSRF null-origin mitigated by `SameSite=Lax` cookies. Not applicable: rewrites, custom server, PPR, CSP nonce, `beforeInteractive`, Windows.
- Why: cache-poisoning and DoS classes apply now; whether Vercel's hosted optimizer was exposed to the AVIF RCE is unverifiable here.
- Fix: bump `next` and `eslint-config-next` to 16.3.6, `npm install`, `tsc`, `lint`, preview deploy. Then `npm audit fix` for the in-range transitive set.

**OBS-1 / OBS-2 / CFG-12. Quote and lead notifications fail silently; the default sender is Resend's sandbox; nothing reads `quote_requests`.** High for the quotes path, Medium elsewhere. OBSERVED. Refuter: SURVIVED. Also: C2 (arch), C-27, CFG-03, OBS-3.
- Where: `app/api/quotes/route.ts:117-119` (bare return when `RESEND_API_KEY`/`QUOTE_NOTIFY_EMAIL` unset, no log), `:121-130` (never reads `res`); `app/api/cron/refeature-check/route.ts:22-24,49` (`false`, no log; route still 200); `contact/actions.ts:84-87`, `get-listed/actions.ts:58-60`, `groomer/[slug]/actions.ts:70-72` (log status only, no body or message id); `from` fallback `"GroomLocal <onboarding@resend.dev>"` at all five sites (`quotes:125`, `contact:77`, `get-listed:39`, `groomer:63`, `cron:30`); `quote_requests` appears in `src/` only at the insert (`quotes/route.ts:85`).
- Why: a missing env var or a Resend rejection (the sandbox sender delivers only to the account owner) drops the notification while the user sees success; the quote row lands in a table with no reader.
- Fix: one `lib/email/send.ts` that reads the JSON body, logs `{site, status, resendId|error, slug, toDomain}`, and returns the id; persist `notified_at`/`notify_error` on `leads`/`quote_requests`; require `QUOTE_FROM_EMAIL` in production with no `resend.dev` fallback; build a `quote_requests` reader (admin page or export).

**SEC-08. Owner PostgREST writes bypass app validation (conditional on live RLS).** High if an owner UPDATE policy exists (the trigger migration's own comment says it does), Low if not. INFERRED. Refuter: SURVIVED for the owner branch; the anon-write branch moves to Open Questions.
- Where: `supabase/migrations/20260903_protect_listing_privileged_columns.sql:1-4` ("Owners can UPDATE their own business_listings row via RLS ... with a direct PostgREST call"), `:19-25` (guards only 8 columns); unguarded and rendered raw: `href={listing.website}` / `booking_url` at `app/groomer/[slug]/page.tsx:221,514,545`, `components/listing-card.tsx:184`; app-side checks that would be skipped: `dashboard/actions.ts:157-169` (`parseWebsite`), `lib/listing-commerce.ts:4-18`.
- Why: an owner can PATCH `website` to `javascript:` via PostgREST with the browser client's JWT and ship a click-to-execute link; `images`, `rating`, `review_count`, `city_slug`, `state` are also unguarded.
- Fix: export current policies into a migration; revoke anon/authenticated INSERT/UPDATE on `business_listings` entirely (all app writes already use the service role); add CHECK constraints (`website ~ '^https?://'`, `state in ('WA','OR')`); URL-validate hrefs at render.

**SEC-03. No rate limiting or bot control on any public write path.** Medium. OBSERVED. Also: C10, SEC-17.
- Where: newsletter, quotes, get-listed, contact, groomer message, `/api/search`, OG routes; captcha disabled (`supabase/config.toml:196-200`); anon INSERT policies on `listing_submissions` (`20260820:21-25`) and `newsletter_subscribers` bypass even the honeypot.
- Why: trivial loop burns the Resend quota (after which real lead emails no-op) and fills tables the admin dashboard and outreach trust.
- Fix: per-IP token bucket (Upstash/Vercel WAF) on the five submit paths and `/api/search`; Turnstile on forms; drop anon INSERT policies and route those inserts through the service role.

**SEC-04. Groomer contact form is an unauthenticated mail relay.** Medium. INFERRED. `groomer/[slug]/actions.ts:108-158`. Branded email with attacker text to any claimed listing's stored email; no throttle or owner opt-out. Fix: per-listing and per-IP limits; a "disable contact form" flag.

**SEC-05. Edge function invocable with the public anon key; email body from request.** Medium. INFERRED. Also: OBS-5, CFG-11. `supabase/functions/notify-listing-submission/index.ts:18-53`; `config.toml:394-400` (`verify_jwt` accepts any project JWT); duplicates `get-listed/actions.ts:27-59,123`. Fix: delete the function (app already notifies) or require a webhook secret and validate the payload.

**SEC-06. Browser-side anon inserts into `analytics_events`; admin reads imply `authenticated` SELECT.** Medium. INFERRED. Also: D14, D15, OBS-19. `lib/analytics.ts:3-40`; `admin/dashboard/actions.ts:71-90` (cookie session, not service role); PII fallback rows from `api/quotes/route.ts:104-108`. Fix: read analytics with the service role behind `requireAdmin()` (as `getUserSignups` at `:12-14` already does); move event writes server-side with an `event_type` allowlist.

**SEC-11. Uploads trust client-declared MIME; public bucket is an allowed `next/image` origin.** Medium. INFERRED. `dashboard/photos/actions.ts:15-31,71-77,213-219`; `next.config.ts:28-31`. Fix: sniff magic bytes or re-encode via `sharp`; narrow the Supabase `remotePatterns` pathname to `/storage/v1/object/public/groomer-photos/**`.

**SEC-07. PII in non-lead tables and logs.** Low. OBSERVED. Also: C-05, D21. `api/quotes/route.ts:102-108` (full quote payload into `analytics_events.metadata` on ANY insert error, not just "table missing"; returns success); `get-listed/actions.ts:66-70` (submitter email in `console.warn`). Fix: remove the fallback (the migration exists), return 500, hash the email in the warning.

**SEC-12.** Low. `next.config.ts:20-31` whole-host `remotePatterns` make `/_next/image` a proxy for unsplash/GCS/Supabase. `lib/images.ts:5-12` already rejects unsplash for listings. Fix: remove unsplash; add `pathname` restrictions.

**SEC-13.** Low. Also: A3, D26, FE-41, DC open question. `app/dashboard/page.tsx:34-45` builds `.or("slug.eq.${cookieSlug},email.ilike.${user.email}")` from a client cookie and the email unescaped; bounded to public columns of unclaimed rows. Fix: validate the cookie slug `^[a-z0-9-]+$`, run separate `.eq()`/`.ilike()` queries, escape `%`/`_`.

**SEC-14.** Low. No script-restricting CSP (`next.config.ts:65-90`). Add nonce-based `script-src` after the Next upgrade.

**SEC-15.** Low. Also: A1. No `server-only` guard on any module reading `SUPABASE_SERVICE_ROLE_KEY` (`lib/refeature-trigger.ts:33-36`, `dashboard/inbox/page.tsx:6-11`, `claim/[slug]/success/page.tsx:26-29`); `grep server-only src` empty. Fix: `import "server-only"` + one `lib/supabase/admin.ts` factory.

**SEC-16.** Low. OG routes uncached, CPU-heavy, `og/groomer/route.tsx:150-153` echoes `${error}`. Fix: validate inputs against known cities/slugs, `s-maxage`, generic error body.

**SEC-17.** Low. `/api/search` unbounded `q` length; one Fuse `$and` clause per term (`route.ts:46-63`, `queries.ts:640-673`). Cap at ~64 chars / 6 terms.

**SEC-18 / FE-42 / T24 / CFG-10.** Medium (user-facing). OBSERVED. Password min 6 in `dashboard/actions.ts:93` and `settings-client.tsx:58`; 8 in `reset-password/page.tsx:30`, `claim-form.tsx:125`, `signup/page.tsx:120`, `login-form.tsx:131`; no current-password re-auth in `updatePassword`. A 6-7 char password set in Settings cannot pass the login form's `minLength`. Fix: one `PASSWORD_MIN_LENGTH = 8` constant; re-auth before change.

**SEC-19 / FE-40.** Low. `?error=` text rendered verbatim in dashboard banners (`dashboard/page.tsx:51-56`; `listing/[slug]/page.tsx:48-52`; `settings/page.tsx:27-29`); escaped, phishing lever only. Map known codes as `reset-password/page.tsx:12-17` does.

**SEC-20.** Low. Auth callbacks redirect to `x-forwarded-host` (`auth/callback/route.ts:15-24`, `auth/confirm/route.ts:20-29`); safe on Vercel, open redirect elsewhere. Allowlist the host.

**SEC-21 / D17.** Medium. `updateListing` accepts any `state` string (`dashboard/actions.ts:181,231`); state-filtered queries (`queries.ts:115,136,316,354,390,487,556,590`) then drop the listing and `aggregateCities` creates a bogus state. Also raw `services`/`specialties` arrays, unvalidated `zip`/`phone`. Fix: allowlist `state`, element checks, `check (state in ('WA','OR'))`.

**SEC-22.** Low. `.env.local` co-locates Google Ads/GSC/OpenAI credentials with the app secrets; `scripts/test-service-key.js:3-9` parses the whole file and inserts into production. No secrets in tracked files (grep and `git log --all --diff-filter=A` clean). Fix: split files; delete the probe script.

**SEC-23.** Low. Cron secret compared with `!==` (`cron/refeature-check/route.ts:12`); revalidate accepts two header spellings. Reuse `timingSafeEqual`.

Verified not findings: email HTML injection (all sites escape or send text), open redirect (`safe-redirect.ts` at every sink), IDOR on dashboard/claim/inbox/photos/admin, SQL injection (builder calls), shell injection, SSRF (fixed hosts), Snackbox edit token flow, server-action CSRF (origin check + Lax cookies), prompt injection (no model calls in app).

### 6.2 Correctness

**C-01 / D19.** Medium. INFERRED. `deleteAccount` (`dashboard/actions.ts:119-135`) ignores the listing-release error and calls `auth.admin.deleteUser` regardless; no FK from `owner_id` to `auth.users` in the generated types. Result: `owner_id` pointing at a deleted user, "Owner Confirmed" badge stays, leads notify nobody, listing never re-claimable (`claim/actions.ts:45-47`). Fix: check the update error first; `owner_id references auth.users on delete set null`.

**C-02 / C8 / FE-28.** See FE-28 above.

**C-03.** Medium. OBSERVED. `sponsor_paid_until` has one reader (`lib/refeature-trigger.ts:48`); featured queries filter `is_featured` only (`queries.ts:282,315,353,390`). A lapsed sponsor keeps a seat indefinitely. Fix: expiry in the featured queries or a daily job.

**C-04 / D10.** Medium. INFERRED. `getCityRows` pages 1000 rows with `.range()` and no `ORDER BY` (`queries.ts:480-484`; contrast `:176-177`); ~1,141 rows always spans two pages, so counts, header cities, sitemap threshold, and `generateStaticParams` can drift. Fix: `.order("id")`. Same in `scripts/sync-cities-state-aware.ts:43-46`.

**C-05 / D21 / SEC-07.** Medium. `/api/quotes` fails open into `analytics_events` and reports success (`route.ts:100-111,171-181`). See SEC-07.

**C-06 / FE-32.** Medium. INFERRED. Lead notifications go to the scraped `listing.email` first (`groomer/[slug]/actions.ts:138-148`), the owner's verified auth email only as fallback; the contact form success copy (`components/contact-form.tsx:42-45`) overstates delivery. Fix: notify the auth email first.

**C-07.** Medium. INFERRED. `parseListingCommerce` (`lib/listing-commerce.ts:20-26`) writes `price_range: ""` on every save because both price inputs are always present (`edit-listing-client.tsx:580,584`); `normalizeTags` (`lib/tags.ts:375`) coerces to `"$$"`. Every benign edit moves the listing to the `$$` filter bucket. Fix: only clear `price_range` when a numeric price is supplied.

**C-08 / D18.** Medium. INFERRED. Photo `images` array is read-modify-write with no concurrency control (`photos/actions.ts:65-69,88-91,113-117,130-133,149-158,175-178`); the tier cap is enforced only by the racy read. Fix: `array_append` RPC with cardinality guard, or serialize uploads.

**C-09.** Low. `uploadLogo` deletes the old object before the new upload can fail (`photos/actions.ts:200-235`). Reorder.

**C-10 / D28.** Low. Storage `remove()` errors never inspected (`photos/actions.ts:120-128,160-173,200-211,251-261`); orphans accumulate. Check `error`; orphan sweep.

**C-11 / D9 / PERF-05.** Medium. INFERRED. `auth.admin.listUsers()` unpaged (`admin/dashboard/actions.ts:21-25,58`); GoTrue default page 50 (`node_modules/@supabase/auth-js/.../GoTrueAdminApi.js:154-155`). Signup KPIs silently cap. Fix: loop `perPage: 1000`.

**C-12 / D8 / PERF-06.** Medium. INFERRED. Admin analytics selects a 2×window of `analytics_events`/`search_logs` with no limit and ignores `error` (`admin/dashboard/actions.ts:71,80-90`); PostgREST default 1,000-row cap truncates the newest events first. Fix: aggregate in SQL or `.range()`; check `error`.

**C-13 / PERF-02.** Medium. INFERRED. Fuse index cache keyed on row count (`queries.ts:604-638`; `api/search/route.ts:28-43`) serves stale listing objects for up to 5 min after an edit that keeps the count; contradicts the comment at `:8-13`. Fix: key on the cached-rows identity or a version stamp.

**C-14.** Low. Fuse extended-search operators (`!`, `^`, `=`, `'`, `|`) in user queries change semantics (`queries.ts:633,653-671`). Strip or escape.

**C-15.** Low. Dateless published post → NaN sort (`lib/blog.ts:52`) and Invalid Date `lastModified` in `sitemap.ts:91` (would throw on `toISOString`); feed emits "Invalid Date". Validate via `lastModFrom`.

**C-16.** Low. `/login?redirect=/login` loops for a signed-in user (`login/page.tsx:14-21`, `safe-redirect.ts`). Reject auth paths as targets.

**C-17.** Low. `getRefeatureTriggerStatus` treats count errors as zero (`refeature-trigger.ts:59-60`, errors never read `:39-57`). Propagate.

**C-18.** Low. Cross-state metro spillover impossible: Portland cluster lists `vancouver` (`metro-clusters.ts:24-27`) but the neighbor query pins `state` (`queries.ts:349-357`).

**C-19.** Low. `lib/types.ts:17,23,31-34,41-42` claim non-null for columns the DB allows null (`database.types.ts:59,68,70,72,74-75,83,86`); consumers are defensively coded today. Make fields nullable and normalize in `withTags`.

**C-20.** Low. `src/data/city-enrichment.json` has an unreachable `WA:seattle-wa` key (245 keys, one suffixed).

**C-21 / C-30.** Verified OK: `city-route.ts` canonicalization terminates (fixed point), `basePath` matches all six callers, redirect in both `generateMetadata` and page is harmless. Residual: a real city slug ending in `-wa`/`-or` would be mis-stripped (none exists).

**C-22 / D23.** Medium conditional. INFERRED. `updateListing` rewrites `city_slug` from free text (`dashboard/actions.ts:21-26,230`); generated types declare FK `city_slug → cities.slug` (`database.types.ts:186-192`); `scripts/sync-cities-state-aware.ts:32-34,118` writes suffixed slugs to `cities`. If the FK exists, an owner edit whose plain slug has no `cities` row fails with 23503 as "Failed to update listing"; if not, typos silently orphan the listing from its city page. The app never reads `cities`. Fix: validate city+state against known cities; decide whether `cities` and its FK should exist at all.

**C-23 / D22.** Low conditional. Newsletter upsert `onConflict: "email"` under anon (`api/newsletter/route.ts:37-42`) needs an UPDATE policy that the repo's script does not grant (`scripts/create-newsletter-table.sql:15-19`); repeat subscribers may get 500. Use `ignoreDuplicates`.

**C-24.** Low. `calcTrend` returns "+100%" with zero data (`admin/dashboard/actions.ts:181-183`; sibling `:48-50` is right).

**C-25.** Low. Server-side `toLocaleDateString` without `timeZone` in dashboard, inbox, account, admin buckets, and city "Last updated" (which is the render date, FE-03). Pass `America/Los_Angeles`; derive from data.

**C-26.** Low. `readCollection` paging stops on `batch.length < 100` (`cms/content.ts:23-37`); a lower API cap silently truncates. Stop on empty batch.

**C-28.** Verified OK: `readFetch` retry is GET-only (`lib/supabase/client.ts:7-16`); no write retried. HEAD count queries could safely be included.

**C-29.** Verified OK: `processClaim`'s `.is("owner_id", null)` update is the atomic guard; the loser sees "claim-failed" instead of "already-claimed" (minor).

### 6.3 Data layer

**D1.** Medium (refuter downgraded from High). OBSERVED. Core tables have no DDL in the repo: 23 SQL files exist but the only CREATE TABLEs are `quote_requests`, `listing_submissions`, `newsletter_subscribers`; `business_listings`, `cities`, `leads`, `analytics_events`, `search_logs`, the bucket, and all their RLS are out of band; `supabase/config.toml:63` seeds from a nonexistent `supabase/seed.sql`. Blocks disaster recovery and every authorization question below. Fix: `supabase db dump --schema public` (with policies) once, commit as a baseline migration.

**D2 / DC-06.** Medium. OBSERVED. `lib/database.types.ts` (2026-03-27) has zero importers and lacks `quote_requests`, `listing_submissions`, `logo_url`, `sponsor_paid_until`, `claimed_at`, `updated_at`; declares dead `listings`/`listings_staging`. No client is typed with `Database`. Fix: regenerate and thread the generic through the three client factories.

**D3.** Medium. OBSERVED/INFERRED. `claimed_at` is written (`claim/actions.ts:54`), ordered by (`queries.ts:428`), and guarded by the trigger (`20260903:24`), but no migration adds it (only `data/cleanup_go_live.sql:14-15`, a gitignored-directory file). A fresh environment fails on the first claim.

**D6.** Medium. OBSERVED. No down migrations; `20260820_create_listing_submissions.sql:21-31` is not idempotent; files are backdated relative to authoring and were applied by hand/MCP, so `supabase db push` is unusable until the ledger is reconciled.

**D13.** Medium. OBSERVED. Authorization for listings, leads, analytics, cities, and storage is handler-only; every write and every owner/admin read is service role (10 sites); a single missed `.eq("owner_id")` in a future action is a full-table write with no backstop. Photo actions are single-guarded (refuter). Fix: export policies into the repo; centralize ownership in one helper (C7).

**D14.** Medium conditional / Open Question. Admin analytics reads use the caller's `authenticated` session (`admin/dashboard/actions.ts:71,80-90`) while the sibling action uses the service role: either a broad SELECT policy exists (any signed-up groomer can read those tables) or the dashboard shows zeros. Fix: one-line swap to the service client.

**D16.** Medium. OBSERVED. The privileged-column trigger guards only direct PostgREST updates by an owner and omits `rating`, `review_count`, `images`, `city_slug`, `state`; `rating` drives ordering (`queries.ts:98,176,283`).

**D4.** Low. `sitemap.ts:112,131` reads `updated_at`, which nothing declares or maintains; lastmod may be uniform.

**D5.** Low. `hours` is `Json[]` in DB, `DayHours[]` in app; seed wrote `[record.hours]` (`scripts/seed-supabase-js.js:67-68`); only owner edits are shape-checked.

**D7.** Low. Only three indexes in the repo, none on `slug`, `city_slug`+`state`, `is_featured`, `owner_id`, `rating`, `claimed_at`, `sponsor_paid_until`, `leads(listing_id, created_at)`, `analytics_events(created_at)`. Unique `slug` index almost certainly exists (seed upserts on it).

**D11 / PERF-08.** Low. `getCityBySlug` called twice per city-page render (metadata + page) with no `React.cache`; cat/mobile pages 5-6 round trips per regeneration.

**D12.** Low. `fetchAllListingRows` caches every column of every row under one key; `/api/search` scans it per keystroke. Consider a projection or `pg_trgm` RPC.

**D15.** Low. Anon INSERT policy on `analytics_events` (required for the tracker) accepts arbitrary rows.

**D20.** Low. `leads`/`analytics_events` FK delete rules undeclared; 37 out-of-band listing deletes happened on 2026-09-16 (memory) and either blocked or cascaded lead PII.

**D24.** Medium. INFERRED. `scripts/seed-supabase-js.js` upserts both tables with the anon key and no dry run; with a capable key it clobbers `name/description/images/hours/rating` for every slug. Delete or quarantine; confirm anon write policies are gone (`scripts/discover-groomers.js:93-94,516-518` suggests they are).

**D25.** Low. Constraints only in handlers: email regex ×5, photo cap, single claim, tier vocabulary, `price_range`, lengths, state, hours. Scripts bypass all via service role.

**D27.** Low. `getListingsByOwner` (`queries.ts:426`) hides excluded/redirected slugs from their owner; `requireOwnership` does not.

**D29 / DC-07 / OBS-19.** Medium. OBSERVED. `logSearch` (`lib/analytics.ts:30-40`) has no callers; admin "Top Searches" and "Search-to-Action" (`admin/dashboard/actions.ts:87-90,154-175`; `analytics-dashboard.tsx:374-381`) read a table nothing writes; `directions_click`/`phone_click` also never emitted. Wire server-side or remove the panels.

**D30 / C11 / PERF-03.** Low. Photo/logo actions and `toggleFeatured` never call `updateTag("listings")` (`photos/actions.ts:98-99,137-138,182-183,237-238,270-271`; `listings/actions.ts:31-47`); list pages show old images up to 5 min; direct-DB pages (dog city, homepage featured) refresh only on the 300 s window.

**D31 / B1.** Low. Dead query exports `getListingsByState :129`, `getListingsByFilters :245`, `getListingCountByCity :579`, `LISTINGS_CACHE_TAG :14` (callers use the literal `"listings"`).

**D32 / C9.** Low. `scripts/normalize-tags.ts:52-60` writes `service_tags`/`specialty_tags`/`feature_tags`/`price_tag` columns the app never reads (tags are computed at read time in `queries.ts:21-32`).

### 6.4 Architecture

**C1.** Medium. OBSERVED. Service-role client built in 10 places with no factory, no `persistSession:false`, no `server-only` (list in the env table). Fix: `lib/supabase/admin.ts`; lint-ban raw `@supabase/supabase-js` imports outside `lib/supabase/`.

**C2.** Medium. OBSERVED. Resend via five raw `fetch` sites with four failure behaviors; a sixth copy in Deno; template used by 2 of 5. See OBS-1. Fix: `lib/email/send.ts`.

**C3.** Medium. OBSERVED. Three description sanitizers that disagree (`queries.ts:17-19`; `schema.ts:36-44`; `groomer/[slug]/page.tsx:54-62` + `seo-utils.ts:26`): meta description and JSON-LD description of the same page come from different pipelines. One `lib/text/clean-description.ts`.

**C4 / T8.** Medium. OBSERVED. `slugifyCity` in nine copies with three algorithms (`dashboard/actions.ts:21-26` claims to match `scripts/discover-groomers.js:162-169`, which also strips apostrophes and maps `&`; `generate-master-csv.js:226,327` and `firecrawl-enrich.js:885,927,966` skip the dash trim); legacy suffix strip in five places. `city_slug` is the join key for every city page. One `lib/slugs.ts` imported by scripts too (`scripts/normalize-tags.ts:11` already imports from `src`).

**C5.** Medium. OBSERVED. Nine hand-made city lists; three metro taxonomies disagree (`city-faqs.ts:3-27` vs `city-pricing.ts:16-29` vs `metro-clusters.ts:11-46`: Tacoma is "Seattle Metro" for spillover but South Sound for FAQs/pricing; Vancouver is Portland Metro vs MIDSIZE_WA). One `lib/geo/metros.ts`.

**C7.** Medium. OBSERVED. Ownership checked six ways with three outcomes (`dashboard/actions.ts:39-59`; `photos/actions.ts:33-50`; `dashboard/listing/[slug]/page.tsx:18-30`; `claim/[slug]/success/page.tsx:17-45`; `claim/[slug]/plans/page.tsx:14-30`; `inbox/page.tsx:28-39`). One `getOwnedListing()`.

**A1 / SEC-15.** Medium. No `server-only`; two client components import the 728-line CMS SDK for a one-line helper (`components/about-content.tsx:10`, `home-hero.tsx:11`).

**A3.** Medium. Pages bypass the query layer with raw clients (`dog-grooming/[state]/page.tsx:8,151-156` without `PUBLIC_EXCLUDED_FILTER`; `dashboard/page.tsx:41-47`; `inbox/page.tsx:6-11,35-63`; `claim/[slug]/success/page.tsx:26-34`).

**B1.** Medium. `queries.ts` mixes seven concerns; `.not("slug","in",PUBLIC_EXCLUDED_FILTER)` hand-repeated 13 times (`:111,135,151,175,281,314,352,388,426,483,552,573,586`); a new query that forgets it leaks an excluded listing.

**B2.** Medium. `groomer/[slug]/page.tsx` (647 L, 9 fix commits): metadata algorithm and owner-gated rules inline in JSX.

**B3.** Medium. `edit-listing-client.tsx` (999 L): 31 `useState` hooks (`:82-129`); client restates server limits.

**D2 (arch).** Medium. Business rules inside pages: pending-claim recovery (`dashboard/page.tsx:30-48`), index/no-index and title algorithms (`dog city page :36-98`), sort semantics (`city-listings-inner.tsx:120-134`).

**E1 / DEP-D13.** Medium. `lib/cms/sdk.ts` is an unversioned vendored copy of `@snackbox/sdk` whose header (`:23-27`) says tag drift is silent; webhook hardcodes the prefix separately (`api/revalidate/route.ts:21-22`). Record provenance; add a contract test that `cacheTags.project("groomlocal")` equals the accepted prefix.

**F1.** Medium. OBSERVED. cat and mobile city trees are copy-paste (244/244 lines, 28 differ per side; state 120/120; hubs 87/87); dog tree is a third diverged implementation (455 L, different queries, prebuilds 30 cities vs `[]`, only dog has `AdSlot`, empty state differs, FE-02). Same for `services/[slug]` (272) vs `specialties/[slug]` (242). One `ServiceCityPage` driven by a services config.

**A2, B4, C6, C10, D1 (arch), G1, G2.** Low. `components/` importing `app/` actions; near-duplicate schema builders; state-name ternary in seven places despite `geography.stateNameFromAbbr`; form idiom copied per endpoint; business constants as prose and numbers (photo caps, 3 seats, thresholds); ten zero-importer modules (see DC-08/09); one-caller modules noted.

### 6.5 Configuration and deploy

**CFG-05 / DC-02.** Medium (refuter downgraded DC-02 from High). OBSERVED. Production deployed from an uncommitted tree; `src/lib/city-route.ts` is untracked while `dog-grooming`, `cat-grooming`, and `mobile-grooming` `[state]/[city]/page.tsx:5` (all modified) import it; `main` = `origin/main` = 942e561 (2026-09-12). A partial commit pushed to GitHub fails the Vercel build; today CLI deploys upload the working tree so production is fine. No `engines`, `packageManager`, `.nvmrc`; local Node 22 with `@types/node` 20. Fix: `git add src/lib/city-route.ts` with the three pages, commit the tree, pin Node, deploy from git.

**CFG-04.** Medium. OBSERVED. No CI; Next 16 no longer lints in `next build`; the 4 lint errors, the test script, and `npm audit` never gate anything; the only check is `tsc` inside the Vercel build, which also loads production Supabase.

**CFG-01.** Medium. No `.env.example`, no env docs, `.gitignore:33` (`.env*`) would swallow one; `cms/index.ts:4` points at a file that does not exist (and its throw is unreachable because `:3` defaults the project).

**CFG-03.** Medium. Six vars whose absence silently disables a feature with no health signal (see env table): quotes and cron notify silently; `HOUSE_LISTING_SLUG` missing → never emails; `ADMIN_EMAILS` empty → no admin, no message; `CRON_SECRET` missing → daily 401. Fix: `lib/env.ts` validator at boot; expose `configured` booleans.

**CFG-10.** Medium. `supabase/config.toml` governs only local dev; hosted auth settings unverifiable and drift from app rules: `minimum_password_length = 6` (`:175`) vs 8 in forms; `additional_redirect_urls = ["https://127.0.0.1:3000"]` (`:156`) vs the port-3005 convention; `sql_paths` to a missing seed; edge function `verify_jwt = true` means the DB webhook must carry a JWT.

**CFG-13.** Medium. `.vercelignore` and `.gitignore` disagree; `outreach/contacted-list.md` (business contacts) is untracked and not ignored, one `git add -A` from history; four `temp_scripts/*.py` tracked despite `.gitignore:62` (one of them, `apply_scale.py:7`, rewrites a Maui asset in place on every run, DC-19); 48 multi-MB opaque masters tracked (`public/` 179 MB, `docs/` 65 MB).

**CFG-06 / DC-11.** Low. `images.localPatterns` (`next.config.ts:7-17`) is an exact query-string allowlist; only `?v=maui-20260904-alpha1` is used in `src`; lines 8-10,12-14,16 match nothing; an unmatched `?v=` yields a 400 from `/_next/image` at request time (`node_modules/next/dist/server/image-optimizer.js:520-523`). Drop the list or use hashed filenames.

**CFG-08.** Low. Cron production-only, no `maxDuration`, silent in both directions (`emailed:false` with 200). **CFG-09.** Low. `https://groomlocal.com` hardcoded in 10 modules plus Supabase config, template, and edge function; no `NEXT_PUBLIC_SITE_URL`. **CFG-11 / SEC-05.** Low. Two notify paths for one insert with different senders and inboxes. **CFG-15.** Low. `NEXT_PUBLIC_SHOW_ADS` is compile-time; flipping in Vercel without redeploy does nothing. **CFG-16.** Low. Supabase host literal in `next.config.ts:28-31`, project ref in tracked `.mcp.json`, Vercel IDs in `scripts/publish-weekly-guide.py:10`. **CFG-17.** Low. Eight bespoke `.env.local` parsers in scripts. **CFG-18.** Low. 15 `process.env.X!` assertions on Supabase env. **CFG-07, CFG-14.** Verified OK: `experimental` keys valid for 16.1.6; `tsbuildinfo` untracked.

### 6.6 Observability

**OBS-16.** High as a theme. OBSERVED. No error tracking, no structured logging, no correlation ids, no health endpoint; 43 `console.*` calls, 0 of 39 server-side ones include a slug, id, or user (OBS-17); `error.tsx` discards the error prop; no `global-error.tsx`. Every incident ends in "search Vercel logs by timestamp and guess".

**OBS-1, OBS-2, OBS-3, OBS-4.** See 6.1 (quote/lead notification). OBS-4: `groomer/[slug]/actions.ts:143-145` logs "Owner email lookup failed" with no identifier.

**OBS-6 / FE-01 / PERF-04.** Medium (refuter downgraded from High; scope narrowed). OBSERVED/INFERRED. Root `layout.tsx:59` awaits `getCities()`, which throws on any Supabase error (`queries.ts:492-495,529-533`), no try/catch, no `global-error.tsx`, so `error.tsx` cannot catch it. `unstable_cache` serves stale on revalidation error (`unstable-cache.js:170-187`), so only a true miss propagates (after `updateTag("listings")`, the webhook's `expire: 0`, or a key change on deploy); ISR pages keep serving the last good copy; blast radius is dynamic routes (dashboard, blog, search, login, admin) during an outage that coincides with a miss. Also ships all ~245 cities to the client header to render 16. Fix: `getCities().catch(() => [])` in the layout; add `global-error.tsx`; pass only the top-8-per-state list.

**OBS-7.** Medium. `error.tsx:7-12` never logs `error.message`/`digest`; no `global-error.tsx`.

**OBS-8.** Medium. Ten `queries.ts` loggers print `error.message` only; retries in `client.ts:7-16` unlogged; no durations.

**OBS-9.** Medium. `getListingBySlug` turns any Supabase error into `null` → `notFound()` (`queries.ts:155-158`; `groomer/[slug]/page.tsx:116-119`); an outage 404 can be ISR-cached for 5 min.

**OBS-10.** Medium. Middleware `getUser()` unguarded (`lib/supabase/middleware.ts:52-54`); auth outage yields raw edge 500s on protected routes.

**OBS-11.** Medium (downgraded). `claim/actions.ts:36-39,61-64` log fixed strings with `fetchError`/`updateError` in scope and unused, no slug or user id.

**OBS-12, OBS-13, OBS-14.** Medium. Dashboard writes log the error but never slug/owner (`dashboard/actions.ts:80,102,133,243`; `!updated` prints `null`); several photo/logo failures return with no log (`photos/actions.ts:135,180,235,268`); `requireOwnership`/`requireListingOwnership` swallow the lookup error and say "not authorized" during a transient failure.

**OBS-15 / FE-07 / FE-08.** Medium. Admin analytics `Promise.all().then()` has no `.catch` (spinner forever); queries ignore `error` and render zeros with "+100%" (C-24); tab bar markup is broken (ternary inside the template literal, `analytics-dashboard.tsx:145-159`) and tabs have no handlers.

**OBS-18.** Medium. Cron always returns 200; `met && !emailed` never logged. **OBS-5.** Low. Two senders for `listing_submissions`. **OBS-20, OBS-21, OBS-22.** Low. No custom Vercel Analytics events; Snackbox `traceId` captured (`cms/sdk.ts:225`) but never logged; no runbook.

### 6.7 Performance

**PERF-01.** Medium. INFERRED. Typeahead re-normalizes all 1,141 rows per keystroke before it can check the Fuse cache (`queries.ts:649,611-619,34-36`); `/api/search` is `force-dynamic` with no response cache; debounce 300 ms. Cache the normalized array or the index under the same tag; `s-maxage=60`.

**PERF-02 / C-13.** Medium. Fuse cache keyed on row count (above).

**PERF-04 / OBS-6.** Medium. Root layout blocks on cities and ships the full list.

**PERF-05 / C-11, PERF-06 / C-12.** Medium. Admin unpaged reads (above).

**PERF-07.** Medium. OBSERVED. `lib/resize-image.ts` has zero callers; the edit client posts originals up to 5 MB (`edit-listing-client.tsx:75,187-195,264-267`), stored unchanged, rendered by raw `<img>` on cards and gallery; city pages show up to 36 cards. Largest LCP lever on the money pages. Call `resizeImage` before upload or re-encode with `sharp`; render Supabase-hosted images through `next/image`.

**PERF-03 / D30.** Low. Asymmetric invalidation (above). **PERF-08 / D11.** Low. Double lookups per render. **PERF-09.** Low. Build throttling is serial; only ~60 pages prebuilt, so first visitors and Googlebot pay full SSR for ~1,900 cold URLs. **PERF-10.** Low. RSS fully dynamic with a HEAD per post on miss; export `revalidate = 900`. **PERF-11.** Low. framer-motion above the fold on marketing pages for fade-ins CSS could do; two icon libraries (`lucide-react` in 2 admin files). **PERF-12, PERF-13, PERF-14, PERF-15.** Low. Whole-city payload to client (fine today); lead submit awaits email inline (use `after()`); `/pricing` and `/about` run DB counts per request (add `revalidate`); stale cache comment and a second hardcoded CMS client.

Verified OK: `updateTag` in actions / `revalidateTag(..., {expire: 0})` in the route handler match Next 16.1.6 semantics; tags in use are consistent with the webhook prefix; cache key cardinality is fixed (two entries); city pages use DB-side filters.

### 6.8 Dependencies

**DEP-D1 / SEC-09.** High. See 6.1.

**DEP-D8.** Medium. OBSERVED. `components/mdx-components.tsx:1` imports `mdx/types`, which resolves only through the unused `next-mdx-remote` → `@mdx-js/*` → `@types/mdx`; removing the MDX packages (the obvious cleanup) breaks `tsc` and the build. Add `@types/mdx` to devDependencies (or a local type) first.

**DEP-D2.** Medium. `sharp` 0.34.5 (two high advisories, fix 0.35.4 is 0.x-major) is a direct dep used only by `scripts/verify-weekly-guide.mjs:6`; `next` carries its own optional `^0.34.4`; bumping only the direct dep would nest a second vulnerable copy. Let it follow the `next` upgrade; move to devDependencies.

**DEP-D13 / E1.** Medium. Vendored SDK (above). **DEP-D14.** Medium. Python tooling has no manifest: `.venv_rembg` (Python 3.9, ~686 MB, described only by a docstring), uv scripts with lower bounds only, `scripts/capture_screenshots.py:1` imports `playwright` that nothing provides. Add `scripts/requirements-maui.txt` pinned to the working venv; upper-bound the PEP 723 blocks.

**DEP-D9 / DC-04.** Low. `next-mdx-remote`, `gray-matter`, `remark-gfm`, `sharp` in prod deps are script-only; `unified` and `remark-parse` ARE live (`components/cms-content.tsx:2-3,53`) so a naive prune breaks table rendering. **DEP-D3.** Low. `ws` advisory reachable only via Realtime, unused; in-range fix. **DEP-D4, D5, D6, D7.** Low. `postcss` duplicated (8.4.31 pinned by next), `yaml`, `js-yaml` 3.x via `gray-matter`, eslint toolchain: build/script/dev only, all `npm audit fix`-able. **DEP-D10.** Low. Two icon libraries. **DEP-D11.** Low. Mixed pinning, no `engines`. **DEP-D12.** Low. Five extraneous wasm shims; corrupted npm cache (`npm cache verify`, then `npm ci`). **DEP-D15.** Low. Edge function `deno.json` caret range, no `deno.lock`. **DEP-D16.** Licenses: no conflicts (two MPL-2.0 packages used unmodified). **DEP-D17.** INFERRED. Only `gray-matter` looks unmaintained.

### 6.9 AI and tooling paths

The app makes no model calls. All findings are in the gitignored `skills/hermes-blog-skill/` (present on disk; canonical runtime is Sarah's Mac), `scripts/image-providers/*.py`, and `docs/automation/`.

**AI-2 / DC-03 / AI-11.** Medium conditional (refuter downgraded from High; restore High if the CMS `requireReview` flag is off). OBSERVED. Tracked `docs/automation/weekly-guides-policy.json:2,13,18` says `mode: publish`, `publication_authorized: true`, `publisher: scripts/publish-weekly-guide.py` (the retired MDX/Vercel publisher with hardcoded `projectName: 'groom-hub'` and `vercel deploy --prod`); `skills/hermes-blog-skill/SKILL.md:12,80` and `references/snackbox-publishing.md:68` say call `publish_draft` in publish mode; `scripts/cms-preflight.py:13-19` reads that mode with no override; `docs/automation/weekly-guides.md`, `weekly-guides-job.json:4`, `hermes-weekly-prompt.txt:1`, and the tracked `docs/automation/hermes-skill/SKILL.md` all still describe the legacy path. The workspace `AGENTS.md` requires `request_review` and no publishing. Enforcement today is a CMS collection flag that appears in no tracked artifact (`docs/cms/groomlocal-schema.json`: 0 occurrences). **This is a stated project rule in conflict with checked-in configuration; the audit reports it rather than recommending around it.** Fix: set `mode` to `review`, `publication_authorized: false`, delete `publisher`; replace `publish_draft` with `request_review` in the skill; re-export the schema with `requireReview`; archive the legacy publisher and docs.

**AI-1.** Medium (downgraded: this checkout only). OBSERVED. The mandated art loop (`SKILL.md:68`) resolves its generator solely as `<checkout>/scripts/blog-hero-image.py` (`maui-art-loop.py:65-67`) with no fallback or env override; the file does not exist anywhere under the workspace; neither transfer manifest lists it; the existing helper `scripts/image-providers/gpt-image.py:44-76` has incompatible flags. Any fresh checkout or manifest-based transfer fails at the first attempt. Memory records the loop running on Sarah's Mac, so the helper exists there untracked. Fix: commit it (or point `generate()` at `gpt-image.py` with the right flags) and add an offline test asserting the path exists.

**AI-3.** Medium (refuter: survived, suggested Medium). OBSERVED. `maui-jev-gate.py:319-326` forces `anatomy = 0.0` whenever the observer reports `raised_paw`, defined at `:180` as any paw "lifted off the ground, waving, pointing, resting on or holding an object"; no `bipedal`/stance field; `--no-anatomy-guard`/`--pose` only change the prompt, not `decide()`. The owner's standing rule is that apron Maui is bipedal holding a jar (feedback memory, 2026-09-15), which necessarily observes as `raised_paw: true`, so every apron scene burns up to four paid generations and ends `exhausted`. Fix: key the hard rule on `front_paws_visible > 2` / `visible_limbs_total > 4` only; add a `--pose bipedal` mode.

**AI-4.** Medium. Uncommitted `weekly-guides-policy.json:12` moves `output_root` outside the checkout; `maui-art-loop.py:103-106` requires the master inside the checkout (`relative_to` raises) → `needs_export_review` after one paid generation. **AI-5.** Medium. INFERRED. Observer refusals (`content: null`) and truncation (`max_completion_tokens: 1800` for a 36-key object) escape the CLI's catch list; inner retry budget 727 s exceeds the outer 600 s cap; `subprocess.TimeoutExpired` kills the loop without a final save. **AI-6.** Medium. Re-running in the same run dir can consume a stale gate JSON (`:144-147` ignores the return code; master-stage decision not bound to the image hash). **AI-8.** Medium. `jev-latest` floating alias with a fixed 0.85 threshold; silent gpt-image-2 → 1.5 downgrade on 403; Gemini preview model without fallback. **AI-9.** Medium. Maui standard in four places with three margin thresholds (3% / 2% / 10-15%); gate JSON records no criteria hash. **AI-12.** Medium. The live skill is gitignored; the tracked copy is the pre-CMS version; the Sep 21 gating logic has no history. **AI-13.** Medium. 16 offline tests cover only pure decision functions; `observe()`, `judge()`, retries, margins, loop `main`, export, seeds, preflight happy path untested. **AI-17.** Medium. The 2026-09-14 run record says `live: false` and "already published" at once; the skill has no `owner_published` state. **AI-7, AI-10, AI-14, AI-18, AI-19, AI-20.** Low. Seed classification fails open to zero seeds; no cost ceiling beyond 4 attempts; `_load_env_local` exports the entire `.env.local` (including the service-role key) into the image helper's process; the REST upload path never worked live; `maui-blog-image.sh` exits 0 on total failure; schema snapshot predates `requireReview`. **AI-15.** Positive: no key values in any tracked file or run artifact. **AI-16.** Validator inventory: all gates fail closed except seed classification; `requireReview` is enforced by the CMS only; the Studio Publish button bypasses the skill's gates.

### 6.10 Tests

**T26 / T1.** High as a plan item (T1 downgraded to a theme). OBSERVED. Two `node:test` files with 6 cases total (not five as first reported); one is wired and needs the production CMS (T2); the other (`scripts/test-cms-content.tsx`, 2 offline cases incl. the only XSS-relevant test) is wired to nothing. No framework, no CI, no `test` script. `node:test` + `tsx` resolve `@/` paths offline today.

**T2.** Medium (downgraded). INFERRED. `scripts/test-grooming-guides.ts:8` → `getBlogPosts` → `cms/content.ts:19` (hardcoded `https://snackboxcms.com`, no env override on this path) → `sdk.ts:212` raw `fetch`. The three passing tests assert properties of live editorial content (a post without a topic, or a topic with fewer than 4 posts, fails them), not code.

**T8.** Medium (downgraded). Ownership gates untested; listing edits are double-guarded (`.eq("owner_id")` at `dashboard/actions.ts:75,238`) but the five photo/logo writes are single-guarded (`photos/actions.ts:89-91,131-133,176-178,231-233,264-266`); `slugifyCity` already diverges from the scripts it claims to match.

**T14.** Medium (downgraded). `queries.ts` cannot be unit-tested: `unstable_cache` throws `Invariant: incrementalCache missing` outside Next (probed), `client.ts` reads env at import, and the pure helpers (`citySlugVariants :67`, `dedupeBySlug :74`, `applyHierarchy :87`, `aggregateCities :443`) are private. Extract `lib/listing-filters.ts`.

**T15.** Medium (downgraded; 6 fix commits, not 8). `lib/schema.ts` is pure (type imports + `getServiceTag`) and untested; its output is the JSON-LD on every page.

**T3, T4, T7, T9, T10, T11, T12, T13, T16, T17, T18, T19, T20, T21, T22, T23.** Medium/Low. `test-cms-content.tsx` unwired; the only rendering test skipped by default; `processClaim` untestable without injection; `isAdminEmail` and `safeRedirectPath` pure and untested; `/api/revalidate` and `/api/quotes` validators private; `normalizeTags` untested (a test would expose the unvalidated `price_range` cast at `tags.ts:376` and a duplicate alias at `:19`/`:53`); `city-route.ts` testable in plain node (probed); `listing-price.ts`/`pricing.ts` untested (annual price 41 vs 40.83); CMS sanitizers `imageUrl`/`safeContentHref` covered by one indirect case; `escapeHtml` untested and `renderBrandedEmail` leaves `cta.url`/`footerNote`/`unsubscribeUrl` unescaped by design (constants only today); `extractFaqs`/`formatBlogDate` untested; hotspot pages have no seam; Python skill tests off-repo; three `scripts/test-*.js` are live probes, one of which (`test-service-key.js`) inserts into production. **T5, T6, T24, T25.** Low. Guides test compares two CMS perspectives; static `GUIDE_TOPICS` dead; password rule copy-pasted three ways; `scripts/**` excluded from ESLint.

### 6.11 Dead code and drift

**DC-01.** Medium (downgraded). OBSERVED. `public/llms.txt:65-70` advertises Free / Standard $39 / Featured $89 / Premium $179 to AI crawlers; the product is Free + Sponsored $49 since 2026-09-04 (`lib/pricing.ts:3-5`). Also "1,000+ in 109 cities" (`:7`). Regenerate from `pricingTiers`.

**DC-02.** Medium. See CFG-05.

**DC-03 / AI-2.** See 6.9. **DC-04 / DEP-D9.** Medium. 18 MDX files and three prod packages dead at runtime; `docs/cms/snackbox-handoff.md:8` says editing them no longer publishes (a memory note plans to edit one in October, which would be a no-op). **DC-06 / D2.** Medium. Stale unused generated types. **DC-07 / D29.** Medium. `logSearch` uncalled. **DC-12.** Medium. README is the create-next-app template (port 3000 vs the owner's port-3005 rule, wrong font, wrong path, no env list). **DC-20 / FE-29.** Medium. `BETA_MODE = true` gives everyone 50 photos while the pricing page sells Free = 10 and Sponsored = 50; no beta end date.

**DC-05, DC-08, DC-09, DC-10, DC-11, DC-13, DC-14, DC-15, DC-16, DC-17, DC-18, DC-19, DC-21, DC-22, DC-23.** Low. Dead `src/data/blog/posts.json` (says GroomHub); seven zero-importer components incl. a second `WaveDivider` with a different API and `review-card.tsx` after reviews were removed; dead `profile-quality.ts` ("featured quality gate" never enforced) and `resize-image.ts`; unused type fields and a 3-vs-4-level price type; stale `localPatterns`; `LAUNCH-CHECKLIST.md` (Feb) lists done work as open; `RESTRUCTURE-CHANGELOG.md` describes a taxonomy that changed; content logs and `PROMPT.md` cite MDX line numbers; `/resources` stub; 9 old-brand references (the Vercel project really is `groom-hub`); eight scripts require gitignored `data/groomers_enriched.json` and three read non-existent columns; four tracked files in gitignored `temp_scripts/`; 19 lint warnings; tracked pre-CMS skill snapshot; hand-bumped `unstable_cache` key (`queries.ts:198`, uncommitted) used to bust cache after manual DB edits.

**Uncommitted drift (13 modified + 3 untracked).** FAQPage JSON-LD on blog posts (`blog/[slug]/page.tsx`, `lib/blog.ts extractFaqs`, `lib/schema.ts faqPageSchema` alias); canonical city redirects in three city pages via untracked `lib/city-route.ts`; 14-day `gl_pending_claim` cookie (`claim-form.tsx`) and pending-claim recovery in `dashboard/page.tsx` (with the `.or()` interpolation); legacy state-page redirects switched to 308; honeypot hit now logs name+email (`get-listed/actions.ts`); `beast-brush` redirect added to `listing-review.ts`; cache-key bump; policy `output_root` made absolute. All production behavior since about 2026-09-16 with no commit.

### 6.12 Frontend

**FE-28.** High. See 6.1.

**FE-02.** Medium. OBSERVED. Dog city pages with zero listings say "No groomers match your filters / Try adjusting your filters" with no filter active and "X has 0 dog groomers listed" (`dog-grooming/[state]/[city]/page.tsx:141-173,418-419`; `city-listings-inner.tsx:200-232`); cat/mobile pages have a real empty state (`:179-196`). This is the quiet fallback the strategy docs say to avoid.

**FE-04.** Medium. Blog has no `error.tsx`; a Snackbox failure surfaces the generic site error on `/blog`, every post, and the feed (`DEFAULT_REVALIDATE = 15`, no long-TTL fallback).

**FE-05 / FE-06.** Medium. DB errors render as empty states on owner and admin dashboards ("No listing found", "No messages yet", "No claimed listings yet"); inbox copy for a signed-in owner with no listing says they lack access.

**FE-07 / FE-08 / FE-09.** Medium. Admin analytics spinner never resolves on error; broken tab-bar markup; featured toggle fails silently.

**FE-10 / FE-11.** Medium. Edit listing shows stale "Saved successfully" while new edits are unsaved (`edit-listing-client.tsx:356,963-979`); photo/logo uploads persist immediately yet arm the unsaved-changes warning via form `onChange` bubbling.

**FE-12 / FE-16 / FE-17.** Medium. Accessibility: clickable `div` logo zone, hover-only controls with no focus reveal, toggles without `aria-pressed`, unlabeled time inputs, no live region (edit page); unlabeled sort select, no `aria-expanded`, colour-only pills, unnamed remove buttons, h2→h4 skip (tag filter bar, on every list page); dangling labels and colour-only selection (quote wizard).

**FE-29 / DC-20.** Medium. Photo limit copy vs `BETA_MODE`. **FE-30.** Medium. OBSERVED. The embeddable badge `public/verified-badge.svg` reads "VERIFIED" after a self-attested claim while the product says "Owner Confirmed" and "not a credential check" (`pricing-page-client.tsx:22`). **FE-31.** Medium. Newsletter promises weekly sends and "no spam" with no sender, no unsubscribe route, `unsubscribed_at` never written, `unsubscribeUrl` zero callers. **FE-32 / C-06.** Medium. Contact-form success overstates delivery. **FE-42 / SEC-18.** Medium. Password minimum mismatch.

**FE-03, FE-13, FE-14, FE-15, FE-18, FE-19, FE-20, FE-21, FE-22, FE-24, FE-26, FE-27, FE-33 to FE-41, FE-43.** Low. "Last updated" is render date; dead gallery placeholder branch and metadata promising absent hours; leading comma on empty address; two em dashes in UI copy (violates the content rule); unlabeled search/newsletter inputs; search hero swallows fetch errors; nested `<main>` in dashboard/admin layouts, mobile nav is a `div`, heading order in claim pages; admin sidebar hidden on mobile with plain anchors (the 4 lint errors); claim form error not announced; no reduced-motion config and a card stagger that leaves the 36th card invisible ~5.4 s; one `useSearchParams` outside Suspense; filter state not synced with history (`router.replace("")`); "within 48 hours" is manual; privacy page names no processors; raw tier slug shown; "Change Plan" only re-confirms Free; "Directory order" sorts by a removed rating column; "join the waitlist" with no waitlist; "Real-time insights" with a hard-coded trend; `?error=` banners; `.or()` interpolation; eslint hits are `no-img-element` with alts present, and trailing-slash hrefs are a non-issue.

**FE-25, FE-44.** Verified OK: no hydration/boundary defects found; search zero-results state, get-quotes copy, and card badges are honest.

---

## 7. Themes and improvement strategy

**Theme 1: Owner-controlled strings reach the page and the ranking without a single choke point.** (SEC-01, SEC-02, SEC-08, SEC-21, FE-28, C-02, C-03, C-07, C8.)
Target state: every listing field that can be written by a claimant passes through one validation module on write, one escaping helper on any HTML/JSON-LD sink, and one `isSponsored()` predicate on any ranking or label; claims require one verification signal.
Principle: trust boundaries are functions, not conventions.
Done when: `grep -rn 'JSON.stringify' src/app | grep ld+json` returns only calls through `jsonLd()`; a node test asserts `jsonLd({name:"</script>"})` contains no `<`; `tests/listing-validation.test.ts` passes; `processClaim` cannot succeed for a fixture user without a matching domain or admin approval; the pricing FAQ sentence and `sortListings()` agree in a test.

**Theme 2: The same concern is implemented N ways, and the copies have already diverged.** (C1, C2, C3, C4, C5, C7, C10, F1, D2 arch, CFG-09, CFG-17, DC-11.)
Target state: one service-role factory, one `sendEmail()`, one `slugifyCity`, one metro table, one description cleaner, one ownership helper, one `ServiceCityPage`, one `SITE_URL`.
Principle: a rule that must "stay in sync" with another file is a bug waiting for a deploy.
Done when: `grep -rn 'createClient(process.env' src` returns one file; `grep -rn 'api.resend.com' src supabase` returns one; `grep -rn 'replace(/\[^a-z0-9\]+/g' src scripts` returns one; the three city page files are each under 40 lines; `madge` still reports no cycles.

**Theme 3: Nothing tells you when the money paths break.** (OBS-1 to OBS-22, CFG-03, CFG-08, CFG-12, C-05, C-17, FE-05, FE-07.)
Target state: a `log(event, fields)` helper emitting JSON with route, actor, slug, code, message, and duration; an error tracker; `/api/health` reporting env presence and a Supabase ping; `notified_at`/`notify_error` on `leads` and `quote_requests`; an admin view of unnotified rows; the cron returns non-200 when it should have emailed and could not.
Principle: a saved row nobody is told about is a lost lead.
Done when: `grep -rn 'console\.\(error\|warn\)' src` returns zero outside `lib/log.ts`; `curl /api/health` returns JSON with `supabase: ok` and booleans for the seven notification vars; a test submits a quote with `RESEND_API_KEY` unset and asserts a `notify_error` row.

**Theme 4: Production is not reconstructible from source.** (D1, D2, D3, D6, CFG-04, CFG-05, DC-02, DC-23, AI-12, CFG-10, DEP-D11, DEP-D14.)
Target state: a baseline migration with tables, indexes, policies, and bucket; regenerated typed clients; Node pinned; every deploy from a commit; CI running `tsc`, `eslint`, `npm test`, `npm audit --audit-level=high`; the Hermes skill tracked.
Principle: if `git clone && npm ci && supabase db reset` cannot produce the site, there is no rollback.
Done when: `git status --porcelain` is empty after a deploy; `supabase migration list` shows local = remote; `npx supabase gen types typescript --linked | diff - src/lib/database.types.ts` is empty; a GitHub Actions run is green on `main`; `package.json` has `engines`.

**Theme 5: The AI blog pipeline's authority and its executable contract disagree.** (AI-1, AI-2, AI-3, AI-4, AI-8, AI-9, AI-11, AI-12, DC-03, DC-22.)
Target state: policy says review; the skill calls `request_review`; the loop's generator path exists in the repo; the hard anatomy rule keys on limb counts, not raised paws; criteria carry a version hash; the skill is tracked.
Principle: a gate the owner relies on must be in source, versioned, and testable offline.
Done when: `jq .mode docs/automation/weekly-guides-policy.json` prints `"review"`; `grep -c publish_draft skills/hermes-blog-skill/SKILL.md` is 0; `python3 -m unittest` in the skill dir includes a test that `generate()`'s helper path exists; the loop approves a fixture bipedal observation with four limbs.

**Recommend NOT fixing now**
- The three city page trees' visual duplication beyond extracting `ServiceCityPage` (Theme 2): a full design-system refactor is not justified at zero claimed-listing revenue.
- Moving owner writes off the service role onto RLS: the app-side double guards are correct; exporting and reviewing policies (Theme 4) is enough until there are many owners.
- framer-motion removal, icon-library consolidation, RSS caching, `/pricing` counts: real but Low; batch into a hygiene pass.
- Rewriting the admin analytics dashboard: fix the broken tab bar and error path (FE-07/08) and stop reading `search_logs` (D29), but do not invest in a metrics product before there is traffic that is not bots.
- Python venv reproducibility beyond a pinned requirements file: the runtime is on another machine; pin, document, stop.

---

## 8. Task plan

Each task is a self-contained brief. Size S under a day, M two to five days, L more than a week, XL means split. Acceptance criteria are runnable where possible. Order: M0 safety net → M1 critical fixes → M2 high-leverage → M3 quality.

### Quick wins (under two hours each, no dependencies)
- QW-1 Escape JSON-LD (M1-1 below) is the single highest-value edit in the repo.
- QW-2 `git add src/lib/city-route.ts` and commit the working tree with a descriptive message (M0-1 first step).
- QW-3 Fix the 4 ESLint errors (`<a>` → `<Link>` in `admin/layout.tsx:57,61` and `claim/[slug]/page.tsx:172`) and add `varsIgnorePattern: "^_"` so `npx eslint .` exits 0.
- QW-4 Rewrite `public/llms.txt` "For Groomers" from `lib/pricing.ts`.
- QW-5 `docs/automation/weekly-guides-policy.json`: `mode: "review"`, `publication_authorized: false`, remove `publisher`, restore relative `output_root`.
- QW-6 Add `/outreach/contacted-list.md` to `.gitignore`; `git rm --cached temp_scripts/*.py`.
- QW-7 `admin/dashboard/actions.ts:71`: use the service-role client for the analytics reads (one line), and add `.catch` to the dashboard `Promise.all`.
- QW-8 `api/quotes/route.ts`: delete the `analytics_events` fallback, return 500 on persist failure, check `res.ok` and log the Resend body.

### M0 Safety net

**M0-1 Commit the tree and pin the toolchain.** Size S. Risk low. Deps none.
Context: production has been deployed from an uncommitted tree since about 2026-09-16; three modified pages import an untracked module. Files: everything in `git status`, `package.json`, new `.nvmrc`. Steps: review the 16 entries, `git add` all including `src/lib/city-route.ts`, commit; add `"engines": {"node": "22.x"}` and `"packageManager": "npm@10.9.2"`; `.nvmrc` = 22. Acceptance: `git status --porcelain` empty; `npx tsc --noEmit` exit 0; `git ls-files src/lib/city-route.ts` prints the path.

**M0-2 Test harness and first five pure-module suites.** Size M. Risk low. Deps M0-1.
Context: `node:test` + `tsx` work offline (proven by `scripts/test-cms-content.tsx`); `unstable_cache` and the Supabase singleton cannot be imported in tests. Files: `package.json` (`"test": "tsx --test 'tests/**/*.test.ts' scripts/test-cms-content.tsx"`), new `tests/setup-env.ts` (dummy Supabase env via `--import`), new `tests/{schema,tags,blog,cms-sanitizers,safe-redirect,admin,city-route,listing-price}.test.ts`. Assertions: from findings T9, T10, T13, T15, T16, T17, T18, T20 (e.g. `http://` image → `https://`, `javascript:` dropped, hours `"9am"` dropped, `itemListSchema` caps at 20; `normalizeTags` default `full-groom`, alias uniqueness within `SERVICE_TAGS` (will fail on `tags.ts:19`/`:53`, fix or document); `imageUrl` rejects `https://media.snackboxcms.com.evil.com`; `safeRedirectPath("//evil")` → fallback; `isAdminEmail` with empty env → false; `ensureCanonicalCityRoute("/dog-grooming","WA","seattle")` throws a 308 digest). Acceptance: `npm test` exit 0 offline with network disabled; at least 40 assertions.

**M0-3 CI gate.** Size S. Risk low. Deps M0-2, QW-3.
Files: new `.github/workflows/ci.yml`. Steps: on push and PR run `npm ci`, `npx tsc --noEmit`, `npx eslint .`, `npm test`, `npm audit --audit-level=high` (allow-fail until M1-3). Move `test:guides` to `test:content` and document it as network-dependent. Acceptance: workflow green on `main`.

**M0-4 Schema baseline and typed clients.** Size M. Risk medium (needs credentials; read-only). Deps none.
Context: no DDL for core tables; types stale and unused. Steps: `supabase db dump --schema public` (tables, indexes, policies) and `select * from pg_policies` plus `storage.policies` into `supabase/migrations/<ts>_baseline.sql` with a `-- reconstructed` header; `supabase migration repair` to match the ledger; `supabase gen types typescript --linked > src/lib/database.types.ts`; pass `Database` to `createClient` in `client.ts`, `server.ts`, `browser.ts`. Acceptance: `supabase migration list` local = remote; `npx tsc --noEmit` exit 0 with the generic applied; the answers to Open Questions 1 to 5 are now in the repo.

### M1 Critical fixes

**M1-1 Escape every JSON-LD sink.** Size S. Risk low. Deps none.
Files: new `src/lib/json-ld.ts` (`export const jsonLd = (o: unknown) => JSON.stringify(o).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026")`); the six sites in SEC-01 plus the two blog sites (replace their inline `.replace`). Also reject `<`/`>` in `name`, `phone`, `email`, `address`, `city` in `updateListing`. Acceptance: `grep -rn 'ld+json' -A3 src/app | grep JSON.stringify` returns nothing; `tests/json-ld.test.ts` asserts no `<` in output for a `</script>` payload.

**M1-2 Claim verification gate and revoke.** Size M. Risk medium (product decision). Deps M0-4.
Context: any account can claim any unclaimed listing; the badge is trust copy. Files: `claim/actions.ts`, `claim/[slug]/page.tsx`, new `admin/dashboard/claims/*`, migration adding `claim_status` (`pending|approved|revoked`) and `claim_evidence` to `business_listings` or a `claim_requests` table. Behavior: auto-approve when the claimant's email domain equals the listing website's domain; otherwise queue for admin; badge and contact-field edits only after approval; admin "revoke" nulls `owner_id` and restores the pre-claim contact fields (store them). Acceptance: a fixture user with a non-matching domain cannot see "Owner Confirmed" on the public page; admin queue lists the pending claim; revoke returns the listing to claimable.

**M1-3 Upgrade Next.js and clear the audit.** Size S. Risk medium (framework bump). Deps M0-3.
Files: `package.json` (`next`, `eslint-config-next` → 16.3.6), `package-lock.json`. Steps: `npm cache verify`, bump, `npm install`, `npm audit fix` (no `--force`), verify `sharp` range from the new `next`, then move `next-mdx-remote`, `gray-matter`, `remark-gfm`, `sharp` to devDependencies after adding `@types/mdx` explicitly (DEP-D8). Preview deploy; check `/_next/image` still serves listing photos. Acceptance: `npm audit --audit-level=high` exit 0; `npx tsc --noEmit` and `npm test` exit 0; CFG-07 experimental keys re-validated against the new config schema.

**M1-4 Make sponsorship one predicate and honor the pricing promise.** Size M. Risk medium. Deps M0-4 (to know whether `is_featured` and tier disagree in prod).
Files: new `lib/listing-rules.ts` (`isSponsored(l) = l.sponsor_paid_until && l.sponsor_paid_until > now` or a chosen single column), `queries.ts:83-100` and `:282,315,353,389`, `components/city-listings-inner.tsx:134`, `listing-card.tsx:44,249`, `admin/dashboard/listings/actions.ts`, `claim/actions.ts`, `dashboard/actions.ts` (unclaim/delete), `refeature-trigger.ts:48,65`, `pricing-page-client.tsx:26`. Decide with the owner: either the regular list is genuinely unaffected (remove both tier sort and featured-first sort; sponsors get only the labeled featured block) or the FAQ is rewritten. Acceptance: a test renders a fixture city with one sponsored and two free listings and asserts the regular-list order matches the FAQ sentence; every row with `isSponsored` true carries the chip; `toggleFeatured` cannot produce an unlabeled pinned row.

**M1-5 One email sender with observable outcomes.** Size M. Risk low. Deps none.
Files: new `lib/email/send.ts`; the five call sites; migration adding `notified_at timestamptz`, `notify_error text`, `resend_id text` to `leads` and `quote_requests`; `lib/env.ts` requiring `QUOTE_FROM_EMAIL` (renamed `EMAIL_FROM`) in production with no `resend.dev` fallback; cron returns 500 when `met && !emailed`. Acceptance: with `RESEND_API_KEY` unset a quote POST still 200s and writes `notify_error = 'missing RESEND_API_KEY'`; the log line for any send includes `site`, `status`, `resendId|error`, `slug`; `grep -rn 'api.resend.com' src supabase` returns one file.

**M1-6 A reader for quote requests and unnotified leads.** Size S. Risk low. Deps M1-5.
Files: new `admin/dashboard/leads/page.tsx` (service role behind `requireAdmin`) listing `quote_requests` and `leads` with `notified_at IS NULL` first. Acceptance: page renders rows from a fixture; a quote submitted with email disabled appears with its error.

**M1-7 Lock the write surface.** Size S. Risk medium (needs policy knowledge from M0-4). Deps M0-4.
Files: migration revoking anon/authenticated INSERT/UPDATE on `business_listings` (all app writes use the service role), adding CHECK constraints (`state in ('WA','OR')`, `website ~ '^https?://'`, `booking_url ~ '^https?://'`), dropping the anon INSERT policies on `listing_submissions` and `newsletter_subscribers` and routing those inserts through the service role (`ignoreDuplicates` for newsletter); URL-validate `href` at the four raw render sites. Acceptance: a PostgREST PATCH with a user JWT to `business_listings` returns 42501; `tests/listing-validation.test.ts` rejects `javascript:` and `state = "Washington"`.

### M2 High-leverage changes

**M2-1 Rate limiting and bot control.** Size M. Deps M1-5. Upstash `@upstash/ratelimit` (or Vercel WAF rules) on the five submit paths and `/api/search`; Turnstile on forms; cap `q` at 64 chars / 6 terms; `s-maxage` on search and OG responses. Acceptance: 30 quote POSTs from one IP in a minute yield 429 after the limit; `/api/search?q=<10KB>` returns 400.

**M2-2 Structured logging, error tracking, health.** Size M. Deps M1-5. `lib/log.ts`, `@sentry/nextjs` (or equivalent), `src/app/global-error.tsx`, `error.tsx` logging `digest`, `/api/health` (Supabase ping with 2 s timeout, env-presence booleans), `getCities().catch(() => [])` in the root layout, `getListingBySlug` returning null only on `PGRST116`, middleware `getUser()` in try/catch. Acceptance: `grep -rn 'console\.\(error\|warn\)' src | grep -v lib/log.ts` empty; `curl /api/health` JSON; a forced Supabase error on a dynamic route shows the branded error page and a Sentry event with `route` and `slug`.

**M2-3 Single sources for duplicated concerns.** Size L (split into five S tasks). Deps M0-2. (a) `lib/supabase/admin.ts` + `server-only` on all server modules; (b) `lib/slugs.ts` used by app and scripts; (c) `lib/geo/metros.ts` replacing nine city lists; (d) `lib/text/clean-description.ts` replacing three sanitizers; (e) `lib/auth/ownership.ts` replacing six checks, with the photo actions gaining the `.eq("owner_id")` double guard. Acceptance per sub-task: the grep in Theme 2 "Done when"; `npm test` green; `madge` no cycles.

**M2-4 One `ServiceCityPage`.** Size M. Deps M2-3(c). `components/city-page/ServiceCityPage.tsx` + `lib/services-config.ts`; the three city `page.tsx` become thin wrappers; dog page gains the cat/mobile honest empty state (FE-02); `React.cache` on `getCityBySlug`/`getListingBySlug`. Acceptance: `diff` of the three wrappers differs only in the config key; a fixture city with zero listings renders "No groomers listed yet" on all three; render count of `getCityBySlug` per request is 1.

**M2-5 Extract `listing-filters.ts` and test search/ranking.** Size M. Deps M0-2. Move `citySlugVariants`, `dedupeBySlug`, `applyHierarchy` (post M1-4), `aggregateCities`, Fuse query building out of `queries.ts`; add `.order("id")` to `getCityRows`; key the Fuse cache on the cached-rows identity; strip Fuse operators from user terms; call `updateTag("listings")` from photo and admin actions. Acceptance: `tests/listing-filters.test.ts` covers the assertions in T14; after an edit that keeps row count, a search fixture returns the new name.

**M2-6 Correctness batch.** Size M. Deps M0-4. `deleteAccount` checks the release error first (C-01); `sponsor_paid_until` enforced in featured queries (C-03); `parseListingCommerce` keeps `price_range` when no numeric price is supplied (C-07); atomic `images` update via RPC (C-08); `uploadLogo` order (C-09); storage `remove` errors logged (C-10); paged `listUsers` and SQL aggregation for analytics (C-11, C-12); `calcTrend` (C-24); `PASSWORD_MIN_LENGTH = 8` everywhere plus re-auth in `updatePassword` (SEC-18); lead notification to the auth email first (C-06). Acceptance: one test per item where pure; `npm test` green.

**M2-7 Env contract.** Size S. Deps M1-5. `.env.example` (names, purpose, phase) with `!.env.example` in `.gitignore`; `lib/env.ts` validated from `instrumentation.ts`; Snackbox vars resolved once; the six Google Ads/GSC vars moved out of `.env.local`; standardize scripts on `dotenv`. Acceptance: a fresh clone with the example filled boots; missing `ADMIN_EMAILS` in production fails the deploy with a named error.

**M2-8 Blog pipeline contract.** Size M. Deps QW-5. Commit `scripts/blog-hero-image.py` (or repoint `generate()` at `gpt-image.py`); change the hard anatomy rule to `front_paws_visible > 2 || visible_limbs_total > 4` and add `--pose bipedal`; replace `publish_draft` with `request_review` in `SKILL.md` and `snackbox-publishing.md`; pin `JEV_MODEL`, add `criteria_sha256` to gate JSON; catch refusals/timeouts (AI-5, AI-6); un-ignore `skills/hermes-blog-skill/{scripts,tests}`; delete `publish-weekly-guide.py`, `verify-weekly-guide.mjs`, `weekly-guides-preflight.py`, the tracked pre-CMS skill copy, and the MDX archive (move to `docs/archive/`); re-export `docs/cms/groomlocal-schema.json`. Note the workspace `AGENTS.md` rule: the receiving host is Sarah's Mac; sync there after the owner confirms. Acceptance: Theme 5 "Done when"; `python3 -m unittest` in the skill dir passes including a fixture bipedal approval and a missing-helper failure.

### M3 Quality

**M3-1 Frontend states and accessibility.** Size M. `blog/error.tsx`; dashboard/admin "could not load" states; edit page: clear `saveResult` on change, stop file-input propagation, `aria-pressed`, labels, live region; tag filter bar and quote wizard labels; nested `<main>` → `div`; heading order; `MotionConfig reducedMotion="user"` and capped stagger; wrap the last `useSearchParams`; sync filters with history. Acceptance: axe run on `/dog-grooming/wa/seattle`, `/get-quotes`, `/dashboard/listing/<slug>` reports zero serious violations.

**M3-2 Copy that matches behavior.** Size S. Re-cut `verified-badge.svg` as "Owner Confirmed"; newsletter copy softened until a sender and unsubscribe route exist (add the route, write `unsubscribed_at`); contact-form success wording; privacy page names Resend, Snackbox, Vercel Analytics, Supabase, Google Maps embed; tier display names via `pricingTiers`; "Change Plan" → contact; "Directory order" → stable; remove em dashes; `BETA_MODE` end date or pricing copy says "during beta". Acceptance: `grep -rn '—' src` empty; the badge SVG contains no "VERIFIED".

**M3-3 Dead code and doc drift sweep.** Size S. Delete the seven zero-importer components, `profile-quality.ts` (or enforce it), `resize-image.ts` (or wire it in M3-4), dead query exports, `posts.json`, unused types; archive `LAUNCH-CHECKLIST.md`, `RESTRUCTURE-CHANGELOG.md`, `PROMPT.md`, content logs, `docs/superpowers/plans/2026-03-28-resources-page.md`; delete or quarantine the eight `data/`-dependent scripts and `test-service-key.js`; trim `localPatterns` to lines 11 and 15; real README (port 3005, env, deploy, Snackbox). Acceptance: `npx ts-prune -p tsconfig.json | grep -v 'used in module'` lists only intentional public exports; README instructions work on a fresh clone.

**M3-4 Image pipeline.** Size M. Resize client-side (or `sharp` server-side, magic-byte sniff, always write JPEG/WebP) before upload; render Supabase-hosted images through `next/image` with `sizes`; narrow `remotePatterns` pathnames; drop unsplash. Acceptance: an uploaded 5 MB PNG is stored under 400 KB; Lighthouse LCP on a 36-card city page improves versus baseline (record the baseline first).

**M3-5 Performance batch.** Size S. `revalidate` on `/pricing`, `/about`, feed; `after()` for lead emails; prebuild cities above the index threshold for all three trees; CSS transitions for hero/sections; remove `lucide-react`. Acceptance: build log shows the extra prerendered routes; `npm ls lucide-react` empty.

**M3-6 Python and Deno manifests.** Size S. `scripts/requirements-maui.txt` pinned to the working venv; upper bounds on PEP 723 blocks; declare or delete `capture_screenshots.py`; commit `deno.lock`. Acceptance: `uv run` of each script resolves without network surprises; `deno cache --lock` passes.

---

## 9. Coverage ledger

| Dimension | Examined | Not examined and why | Commands (exit) |
|---|---|---|---|
| Architecture | All `src/lib/*`, `src/lib/supabase/*`, `src/lib/cms/*`, all three city trees (full diffs), `groomer/[slug]`, dashboard/claim/admin actions and pages, import graph via a scratch Node script, `scripts/normalize-tags.ts`, slugify sites in 5 scripts | Client bundle size (needs build); `edit-listing-client.tsx` body beyond declarations; Snackbox CMS-side tag names (external) | `madge --circular` (0, no cycles); grep sweeps |
| Correctness | All actions, routes, `queries.ts`, `client.ts`, `refeature-trigger.ts`, `listing-commerce.ts`, `blog.ts`, `city-route.ts`, `safe-redirect.ts`, `tags.ts` normalize, migrations, `sync-cities-state-aware.ts`, `create-newsletter-table.sql`, `city-enrichment.json` key scan | `cms/sdk.ts` outside cited ranges; `quote-wizard.tsx` beyond grep; OG routes; pipeline scripts other than the two city-slug ones | greps for `catch`, `void`, `after(`, date/money math; node key scan (245 keys) |
| Data layer | 6 migrations, `database.types.ts`, `config.toml`, edge function, all `.from(` sites in src and scripts, seed/sync/migrate scripts | Live DB: `pg_policies`, `pg_constraint`, `pg_indexes`, `schema_migrations`, bucket policies (credentials forbidden) | `grep -rn '\.from('`; `git log` on migrations; `tsc` (0) |
| Security | All 12 route files, 8 actions files, reset-password action, middleware, supabase clients, admin/safe-redirect/analytics/refeature/commerce/tiers/review/images/schema libs, email template, cms index/content/sdk slice, next.config, vercel.json, migrations, edge function, config.toml auth block, dashboard/claim/admin/login/signup pages, JSON-LD sinks, `.env.local` names only | Build/dev server; HTTP to prod; DB policy query; GHSA advisory bodies (titles only); Storage bucket policies; Vercel WAF/env | `npm audit` (1); secret-pattern grep over `git ls-files` (0 hits); `git log --all --diff-filter=A` for env files (none) |
| AI/LLM | Entire gitignored skill (SKILL.md, 7 scripts, 8 references, tests), image providers, `maui-blog-image.sh`, `maui-remove-background.py`, legacy publisher and preflight, `docs/automation/*`, `docs/cms/*` (schema grepped), one run directory under `output/` | No script executed; no API/CMS/GTM calls; `~/.hermes/.env` and `.env.local` contents; Sarah's Mac | `ls scripts/blog-hero-image.py` (absent); diffs of standard copies (identical); SHA of skill copies (differ); key-pattern greps (0) |
| Tests | Both node:test files, Python tests, three `test-*.js` probes, all modules named in findings, `tsconfig.json`, `eslint.config.mjs` | `npm run test:guides` not re-run (hits prod CMS); `next build`; `revalidateTag` behavior outside Next; `renderBrandedEmail` callers for user input | `find` for test configs (none); `npx tsx --test scripts/test-cms-content.tsx` (0, 2 pass); `python3 -m unittest` (0, 16 OK); `node -e` probes for `permanentRedirect`, `NextResponse`, `unstable_cache` (throws) |
| Performance | `queries.ts` full, search route, layout, city/service/specialty/groomer/blog/pricing/about pages, cache and tag usage, `unstable-cache.js` and `revalidate.js` in node_modules, GoTrue admin API, image components, `resize-image.ts`, dependency `sideEffects` flags | Serialized cache entry size, Fuse memory, bundle size, TTFB/LCP (need build/server/DB) | `grep -rn '"use client"' src \| wc -l` (36); `du -sh` deps and `public/` (179 MB) |
| Config/deploy | `package.json`, lockfile header, `vercel.json`, `.vercelignore`, `.gitignore`, `next.config.ts`, `tsconfig.json`, `.mcp.json`, `.vercel/project.json`, `config.toml`, edge function, `ad-slot.tsx`, cron/revalidate/snackbox-edit/auth routes, `refeature-trigger.ts`, `cms/index.ts`, `Overlay.tsx`, Next config schema, `match-local-pattern.js`, `image-optimizer.js`, `build/index.js` (lint grep) | Vercel dashboard (Node, plan, env, cron logs, `.vercelignore` on git deploys); hosted Supabase auth settings and webhooks; Resend domain state | env-name greps; `ls .nvmrc .github .husky supabase/seed.sql` (absent); `node --version` (22.14.0) |
| Observability | All 5 mail sites, edge function, template, layout, error/not-found, `queries.ts` loggers, `client.ts` retry, middleware, claim/dashboard/photo actions, inbox/listing pages, analytics lib and trackers, admin actions and dashboard component, cms sdk error slice, `unstable-cache.js` | Vercel/Supabase/Resend dashboards; log retention; edit client beyond grep | `grep -rc console.*` (43); greps for sentry/instrumentation/health (none) |
| Dependencies | `package.json`, lockfile, npm-audit JSON (parsed), `npm ls` traces, node_modules package.json fields for direct deps and key transitives, import sweeps per dependency, Python script headers, venv listing, `deno.json` | `npm outdated`/`license-checker`/`npm-check-updates` (network + corrupted cache); transitive licenses; `next@16.3.6`'s `sharp` range; Vercel image mode | `npm ls --depth=0` (0, 5 extraneous); `npm audit` (1) |
| Dead code/drift | ts-prune output, importer script over all components and libs, every root `.md`, `docs/automation/*`, both SKILL.md copies, `docs/cms/*`, `llms.txt`, `posts.json`, `next.config.ts`, `.gitignore`/`.vercelignore`, script heads, `temp_scripts` heads, full `git diff` | Database (`search_logs` emptiness, `beast-brush-wa` row); Vercel; Snackbox; Sarah's Mac | `npx ts-prune` (0); `npx eslint` (1); `git ls-files temp_scripts` (4) |
| Frontend | Search, all three city page types, groomer page, dashboard (overview, inbox, listing edit, settings), admin (layout, analytics, listings), blog index, claim flow (page, form, plans, success), copy badge, contact/newsletter/get-listed/quote/search-hero/site-header components, listing card/image/gallery, ad-slot, motion components, pricing, login/signup/reset, `globals.css` motion block, `verified-badge.svg` text | State pages, services/specialties bodies, about/contact/get-listed pages, terms, marketing `[slug]`, home page (beyond greps); no browser rendering, axe, or Lighthouse (servers forbidden); no DB (badges, empty addresses, newsletter RLS) | `find` for loading/error/global-error (3 files, no global-error); `npx eslint src` (1); trailing-slash grep (0) |
| Repo map / history | Two mapping agents over `src/`, `supabase/`, `scripts/`, `docs/`, config; `git log`, churn, fix-commit counts, blame for TODOs (none) | `pawfect-pnw-find/` (outside this repo) | `git status` (16 entries); `git log --oneline \| wc -l` (63) |

Skipped or failed commands: `next build` (skipped: production DB traffic); `npm outdated` (failed: local npm cache ENOENT, not retried); `npm run test:guides` (run once by the orchestrator, exit 0, 3 pass 1 skip; not re-run by auditors because it fetches the production CMS); `npx license-checker` (skipped: network); any Supabase SQL (skipped: production API); SSH to Sarah's Mac (skipped: outside the repo boundary for this audit).

---

## 10. Open questions (each names a decision you need to make)

1. **RLS policies on `business_listings`, `cities`, `leads`, `analytics_events`, `search_logs`, `newsletter_subscribers`, and `storage.objects`.** Run `select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies;` and `select * from storage.policies;` (read-only). This settles SEC-08 (owner PostgREST writes), SEC-06/D14 (whether any signed-up groomer can read analytics), D15, D22/C-23, and D24. Decision: commit the result as the M0-4 baseline and revoke anon/authenticated writes on `business_listings` (M1-7).
2. **Does `business_listings_city_slug_fkey` still exist, and with what `ON DELETE`?** Decides whether owner city edits can fail today (C-22/D23) and whether the `cities` table should exist at all (the app never reads it).
3. **Which env vars are set on Vercel production and preview** (`CRON_SECRET`, `HOUSE_LISTING_SLUG`, `QUOTE_FROM_EMAIL`, `QUOTE_NOTIFY_EMAIL`, `LISTING_NOTIFY_EMAIL`, `CONTACT_NOTIFY_EMAIL`, `ADMIN_EMAILS`, `REVALIDATION_SECRET`, `NEXT_PUBLIC_SNACKBOX_*`)? Every silent-disable path (CFG-03, OBS-2) hinges on this. Decision: adopt `lib/env.ts` (M2-7) so the question cannot recur.
4. **Is the Resend sender domain verified and DMARC-aligned, and is `QUOTE_FROM_EMAIL` set to it in production?** If not, CFG-12 is live now and groomer lead emails are being rejected silently.
5. **Deploy path: `vercel --prod` from the working tree, or git integration?** If git, DC-02 is already broken in production. Decision: M0-1 and switch to git deploys.
6. **Which Node major does the Vercel project use?** Needed for `engines` and `@types/node`.
7. **Is the `notify-listing-submission` edge function deployed with a DB webhook?** Decides whether submissions email twice (SEC-05/CFG-11) or the function is dead. Decision: keep one path.
8. **Is `requireReview: true` live on the Snackbox `blogPost` collection, and does `publish_draft` queue there?** If off, AI-2 returns to High: the tracked policy and skill both say publish. Decision: QW-5 regardless.
9. **Does `scripts/blog-hero-image.py` exist on Sarah's Mac?** If not, the Sep 21 art loop has never generated an image anywhere (AI-1). Decision: commit it either way (M2-8).
10. **Was the Sep 21 blog self-block caused by the raised-paw rule (AI-3), the missing helper (AI-1), or the absolute `output_root` (AI-4)?** Read that run's artifacts on Sarah's Mac before changing the gate.
11. **Are there production rows where `is_featured` and `subscription_tier` disagree?** Makes FE-28's unlabeled-pinning branch OBSERVED rather than INFERRED and sets the M1-4 migration plan.
12. **Have any `analytics_events` rows with `event_type = 'quote_request'` ever been written?** Decides whether there is quote PII to purge (SEC-07).
13. **Does Vercel's hosted image optimizer share the AVIF RCE exposure of GHSA-2xp9-vwfh-vxw4 for a 16.1.6 app?** Only affects whether SEC-09 was ever Critical; the upgrade (M1-3) is warranted either way.
14. **Do you want claims to require verification (M1-2), and which signal?** Email-domain match auto-approves most legitimate owners; phone OTP costs money; admin queue costs your time. The "Owner Confirmed" badge copy depends on the answer.
15. **Should the regular list be genuinely unaffected by payment (remove both sorts), or should the FAQ change?** M1-4 cannot proceed without this.
16. **`BETA_MODE` end date**, or should the pricing page say "during beta" (FE-29/DC-20)?
17. **Is the MDX weekly-guide path officially retired?** `docs/automation/weekly-guides.md` still names it. Decides whether DEP-D9's packages move to devDependencies or are deleted with the scripts.
18. **What is the PostgREST `max-rows` on the hosted project?** If under 1000, `fetchAllListingRows` and `getCityRows` stop after one page (their `data.length === pageSize` check never fires), silently truncating search and city counts.
19. **Should `/claim/*` be gated in middleware?** It is matched but not checked; pages self-check. Document the intent either way (T9).
20. **Is `lib/profile-quality.ts` an abandoned idea or a rule you expect enforced for Sponsored listings?**
