-- Claim verification (AUDIT.md M1-2). A claim is auto-approved when the claimant's
-- email domain matches the listing's website domain; otherwise it waits here for
-- admin review. Only the service role reads or writes this table.

create table if not exists public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.business_listings(id) on delete cascade,
  listing_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked')),
  verification text not null check (verification in ('domain_match', 'admin_review')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);
alter table public.claim_requests enable row level security; -- no policies: service role only
create unique index if not exists claim_requests_one_pending_per_listing
  on public.claim_requests (listing_id) where status = 'pending';
create index if not exists claim_requests_user_idx on public.claim_requests (user_id, created_at desc);
create index if not exists claim_requests_status_idx on public.claim_requests (status, created_at desc);
comment on table public.claim_requests is 'Listing ownership claims and their verification outcome';
