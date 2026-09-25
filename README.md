# GroomLocal

A directory of dog and cat groomers in Washington and Oregon. Next.js 16 (App Router) on Vercel, Supabase (Postgres, Auth, Storage), Resend for email, and Snackbox CMS for the blog and marketing pages.

`AUDIT.md` is the current work queue: findings, themes, and the milestone plan.

## Run it locally

```bash
npm ci
cp .env.example .env.local   # fill in the values; names are documented in src/lib/env.ts
npm run dev -- -p 3005       # this project always uses port 3005
```

Node 22 (`.nvmrc`). Open http://localhost:3005.

## Checks

```bash
npx tsc --noEmit        # types
npx eslint .            # lint (0 errors required)
npm test                # offline unit tests (tests/*.test.ts + scripts/test-cms-content.tsx)
npm run test:content    # content lint against the live CMS; needs network
npm audit --audit-level=high
```

CI (`.github/workflows/ci.yml`) runs the same four on every push and pull request.

## Where things live

| Area | Path |
|---|---|
| Public pages | `src/app/` (city trees under `dog-grooming`, `cat-grooming`, `mobile-grooming`; `services`, `specialties`, `groomer/[slug]`) |
| Owner dashboard | `src/app/dashboard/` (server actions in `actions.ts`, photos in `photos/actions.ts`) |
| Claims | `src/app/claim/`, rules in `src/lib/claims.ts`, admin queue at `src/app/admin/dashboard/claims/` |
| Admin | `src/app/admin/dashboard/` (allowlist in `ADMIN_EMAILS`) |
| API routes | `src/app/api/` (`search`, `quotes`, `newsletter`, `revalidate`, `snackbox-edit`, `cron/refeature-check`, `health`, `og/*`) |
| Data access | `src/lib/supabase/queries.ts` (public reads), `src/lib/supabase/admin.ts` (the only service-role client) |
| Business rules | `src/lib/listing-rules.ts` (sponsorship), `src/lib/tags.ts` (taxonomy), `src/lib/tiers.ts`, `src/lib/pricing.ts` |
| Email | `src/lib/email/send.ts` (the only Resend call), `src/lib/email/template.ts` |
| JSON-LD | `src/lib/schema.ts`, emitted only through `src/lib/json-ld.ts` |
| CMS | `src/lib/cms/` (vendored Snackbox SDK), `src/lib/blog.ts` |
| Database | `supabase/migrations/` (baseline reconstructed 2026-09-24; earlier hand-applied files in `_applied_before_baseline/`) |
| Data pipeline | `scripts/` (discovery and enrichment; read `.env.local`; retired ones in `scripts/archive/`) |
| Maui artwork | `docs/maui/`, `public/maui-assets/`, `scripts/maui-*` |

## Conventions that matter

- All writes go through server actions or route handlers using the service-role client after app-side validation. Row-level security only allows public reads and the browser analytics insert. Do not add anon or authenticated write policies.
- Every inline `<script type="application/ld+json">` uses `jsonLd()`. Never `JSON.stringify` into `dangerouslySetInnerHTML`.
- Paid placement is decided only by `isSponsored()`. The regular list never reflects payment; sponsors appear in the labeled Featured block.
- Claims auto-approve when the account email domain matches the listing website; everything else waits in the admin claim queue.
- Notification emails record their outcome (`notified_at`, `notify_error`, `resend_id`) on the `leads` and `quote_requests` rows. `/api/health` reports which env vars are missing (names only).
- No em dashes in copy. "Dog", not "furry friend".

## Database changes

```bash
supabase migration new <name>       # writes supabase/migrations/<timestamp>_<name>.sql
supabase db push --linked           # applies pending migrations to the linked project
supabase gen types typescript --linked > src/lib/database.types.ts
```

The project is linked to `afnkgwbajztnfkpijtcl`. `supabase db dump` needs Docker; the reconstructed baseline was assembled from `information_schema` and `pg_policies` instead.

## Deploy

Vercel project `groom-hub`. Deploy from git, not from a dirty working tree, so every production build maps to a commit. Environment variables are listed in `.env.example`; `EMAIL_FROM` must be a verified Resend sender in production or no notification email is sent.

## Weekly blog automation

Runs on a separate machine (see the workspace `AGENTS.md`). The policy in `docs/automation/weekly-guides-policy.json` is `review` mode: the skill saves a Snackbox draft and calls `request_review`; nothing publishes without the owner.
