-- Owner website badges and monthly owner reports (2026-10-05).

-- One row per (listing, website) that shows the listing's badge image. The badge
-- route records the host from the Referer header each time a browser loads the
-- image, so the console and the owner dashboard can show where the badge is live.
create table if not exists public.badge_installs (
  listing_id text not null references public.business_listings(id) on delete cascade,
  host text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  hits integer not null default 1,
  primary key (listing_id, host)
);
alter table public.badge_installs enable row level security; -- no policies: service role only
comment on table public.badge_installs is 'Websites that display a listing''s GroomLocal badge, from the Referer of badge image loads';

-- PostgREST upserts cannot increment, so the badge route calls this instead.
create or replace function public.record_badge_hit(p_listing_id text, p_host text)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.badge_installs (listing_id, host)
  values (p_listing_id, p_host)
  on conflict (listing_id, host)
  do update set last_seen = now(), hits = public.badge_installs.hits + 1;
$$;
revoke all on function public.record_badge_hit(text, text) from public, anon, authenticated;
grant execute on function public.record_badge_hit(text, text) to service_role;

-- Monthly reports share the owner email log. Drop the old kind check by definition,
-- not by name, so this works whatever name Postgres gave the inline constraint.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.owner_email_log'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.owner_email_log drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.owner_email_log
  add constraint owner_email_log_kind_check check (kind in ('claim_approved', 'profile_reminder', 'monthly_report'));

-- The month a report covers ('YYYY-MM'); null for other kinds. One report per listing per month.
alter table public.owner_email_log add column if not exists period text;
create unique index if not exists owner_email_log_monthly_once
  on public.owner_email_log (listing_id, period) where kind = 'monthly_report';

comment on table public.owner_email_optouts is 'Owners who turned off profile reminders and monthly reports from the link in an email';
