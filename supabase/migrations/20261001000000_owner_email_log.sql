-- Owner emails after a claim is accepted: the approval email and up to three profile
-- reminders. The log is what the daily cron reads to decide who is due, so it must
-- record every send. Only the service role reads or writes these tables.

create table if not exists public.owner_email_log (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.business_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('claim_approved', 'profile_reminder')),
  sent_at timestamptz not null default now()
);
alter table public.owner_email_log enable row level security; -- no policies: service role only
create index if not exists owner_email_log_listing_idx on public.owner_email_log (listing_id, sent_at desc);
comment on table public.owner_email_log is 'One row per email sent to a listing owner (approval and profile reminders)';

create table if not exists public.owner_email_optouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.owner_email_optouts enable row level security; -- no policies: service role only
comment on table public.owner_email_optouts is 'Owners who turned off profile reminders from the link in the email';
