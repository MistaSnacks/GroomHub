-- Baseline reconstructed from the live project (afnkgwbajztnfkpijtcl) on 2026-09-24.
--
-- The core tables, policies, storage buckets and the privileged-column trigger were
-- created out of band (SQL editor, MCP, seed scripts) before this repo tracked
-- migrations. This file records that state so a fresh environment can be rebuilt and
-- so later migrations have a reviewable starting point. It was marked APPLIED in the
-- remote ledger without being executed there; the six earlier date-named files were
-- moved to supabase/migrations/_applied_before_baseline/ for history.
--
-- Sources: information_schema.columns, pg_constraint, pg_indexes, pg_policies,
-- pg_get_functiondef, pg_trigger, storage.buckets (all read 2026-09-24).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- cities (referenced by business_listings.city_slug; the app derives city data
-- from listings and never reads this table directly)
-- ---------------------------------------------------------------------------
create table if not exists public.cities (
  slug text primary key,
  name text not null,
  state text not null,
  state_abbr text not null,
  groomer_count integer default 0,
  image text not null,
  description text not null,
  popular_breeds text[] default '{}'::text[],
  created_at timestamptz not null default timezone('utc'::text, now())
);
alter table public.cities enable row level security;
create policy "Public profiles are viewable by everyone." on public.cities for select using (true);

-- ---------------------------------------------------------------------------
-- business_listings
-- ---------------------------------------------------------------------------
create table if not exists public.business_listings (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  short_description text not null,
  address text not null,
  city text not null,
  city_slug text not null references public.cities(slug),
  state text not null,
  zip text not null,
  phone text not null,
  website text,
  email text,
  rating numeric default 0,
  review_count integer default 0,
  price_range text not null,
  price_min integer not null,
  price_max integer not null,
  transparent_pricing boolean default false,
  grooms_cats boolean default false,
  accepts_new_clients boolean default false,
  waitlist_status text,
  services text[] default '{}'::text[],
  service_categories text[] default '{}'::text[],
  pet_types text[] default '{}'::text[],
  hours jsonb[] default '{}'::jsonb[],
  images text[] default '{}'::text[],
  badges text[] default '{}'::text[],
  is_featured boolean default false,
  is_paw_verified boolean default false,
  is_best_in_show boolean default false,
  year_established integer,
  team_size integer,
  specialties text[] default '{}'::text[],
  breeds text[] default '{}'::text[],
  lat numeric,
  lng numeric,
  booking_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  owner_id uuid references auth.users(id) on delete set null,
  subscription_tier text default 'free',
  claimed_at timestamptz,
  logo_url text,
  sponsor_paid_until timestamptz
);
comment on column public.business_listings.sponsor_paid_until is 'Paid-through date for a Sponsored seat; null when not sponsored';
alter table public.business_listings enable row level security;
create policy "Public profiles are viewable by everyone." on public.business_listings for select using (true);
-- Removed by 20260924120000: owners could UPDATE their own row directly via PostgREST.
create policy "Owners can update their own listings" on public.business_listings for update using (auth.uid() = owner_id);

create or replace function public.protect_listing_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.owner_id           is distinct from old.owner_id
  or new.subscription_tier  is distinct from old.subscription_tier
  or new.is_featured        is distinct from old.is_featured
  or new.is_paw_verified    is distinct from old.is_paw_verified
  or new.badges             is distinct from old.badges
  or new.claimed_at         is distinct from old.claimed_at
  or new.slug               is distinct from old.slug
  or new.sponsor_paid_until is distinct from old.sponsor_paid_until
  then
    raise exception 'Cannot change protected listing columns'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists protect_listing_privileged_columns on public.business_listings;
create trigger protect_listing_privileged_columns
  before update on public.business_listings
  for each row execute function public.protect_listing_privileged_columns();

-- ---------------------------------------------------------------------------
-- leads (contact-form messages to a claimed listing)
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.business_listings(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  sender_phone text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz default now()
);
alter table public.leads enable row level security;
-- Removed by 20260924120000.
create policy "Public can insert leads" on public.leads for insert with check (true);
create policy "Owners can view their leads" on public.leads for select
  using (exists (select 1 from public.business_listings where business_listings.id = leads.listing_id and business_listings.owner_id = auth.uid()));
create policy "Owners can update their leads" on public.leads for update
  using (exists (select 1 from public.business_listings where business_listings.id = leads.listing_id and business_listings.owner_id = auth.uid()))
  with check (exists (select 1 from public.business_listings where business_listings.id = leads.listing_id and business_listings.owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- analytics_events, search_logs (browser-side tracking)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  event_type text not null,
  listing_id text references public.business_listings(id) on delete cascade,
  session_id text,
  url text,
  metadata jsonb
);
alter table public.analytics_events enable row level security;
-- Both replaced by 20260924120000.
create policy "Allow public insert to analytics" on public.analytics_events for insert with check (true);
create policy "Allow authenticated read to analytics" on public.analytics_events for select using (auth.role() = 'authenticated'::text);

create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  query text not null,
  location text,
  results_count integer,
  session_id text
);
alter table public.search_logs enable row level security;
-- Both removed by 20260924120000.
create policy "Allow public insert to search_logs" on public.search_logs for insert with check (true);
create policy "Allow authenticated read to search_logs" on public.search_logs for select using (auth.role() = 'authenticated'::text);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz,
  source text default 'website'
);
create index if not exists idx_newsletter_email on public.newsletter_subscribers (email);
alter table public.newsletter_subscribers enable row level security;
-- Removed by 20260924120000.
create policy "Allow anonymous inserts" on public.newsletter_subscribers for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- quote_requests (2026-07-06), listing_submissions (2026-08-20)
-- ---------------------------------------------------------------------------
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pet_type text not null,
  pet_name text,
  pet_breed text,
  pet_size text,
  services text[] not null default '{}'::text[],
  city text not null,
  preferred_date text,
  preferred_time text,
  name text not null,
  email text not null,
  phone text,
  notes text,
  status text not null default 'new'
);
create index if not exists idx_quote_requests_created_at on public.quote_requests (created_at desc);
alter table public.quote_requests enable row level security; -- deliberately no policies

create table if not exists public.listing_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_name text not null,
  contact_name text,
  city text not null,
  state text not null,
  email text not null,
  phone text,
  website text,
  notes text,
  status text not null default 'new'
);
create index if not exists idx_listing_submissions_created_at on public.listing_submissions (created_at desc);
alter table public.listing_submissions enable row level security;
-- Removed by 20260924120000.
create policy "Anyone can submit a listing request" on public.listing_submissions for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------------------
-- Legacy / archive tables (no app reader). RLS enabled by 20260924120000.
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  slug text not null unique,
  name text not null,
  description text, short_description text, address text, city text, state text, zip text,
  phone text, website text, email text, rating numeric, review_count integer default 0,
  price_range text, price_min integer, price_max integer, transparent_pricing boolean default false,
  grooms_cats boolean default false, accepts_new_clients boolean default true,
  waitlist_status text check (waitlist_status = any (array['immediate','short','long','closed'])),
  services text[], service_categories text[], specialties text[], breeds text[], images text[], badges text[],
  hours jsonb, booking_url text, is_featured boolean default false, is_paw_verified boolean default false,
  is_best_in_show boolean default false, year_established integer, team_size integer, lat numeric, lng numeric
);
create table if not exists public.listings_staging (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  source_url text,
  scraped_data jsonb,
  status text default 'pending' check (status = any (array['pending','approved','rejected'])),
  notes text
);
-- business_listings_removed_20260916: an archive copy of business_listings columns plus
-- removed_at timestamptz and reason text, created during the 2026-09-16 out-of-region cleanup.
create table if not exists public.business_listings_removed_20260916 (like public.business_listings including defaults);
alter table public.business_listings_removed_20260916
  add column if not exists removed_at timestamptz,
  add column if not exists reason text;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('groomer-photos', 'groomer-photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true) on conflict (id) do nothing; -- legacy, empty
create policy "Public read access" on storage.objects for select using (bucket_id = 'groomer-photos');
create policy "Public can view listing images" on storage.objects for select using (bucket_id = 'listing-images');
-- The following five are removed by 20260924120000 (writes use the service role).
create policy "Authenticated upload" on storage.objects for insert with check (bucket_id = 'groomer-photos' and auth.role() = 'authenticated');
create policy "Authenticated delete" on storage.objects for delete using (bucket_id = 'groomer-photos' and auth.role() = 'authenticated');
create policy "Authenticated users can upload images" on storage.objects for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');
create policy "Authenticated users can update images" on storage.objects for update using (bucket_id = 'listing-images' and auth.role() = 'authenticated');
create policy "Authenticated users can delete images" on storage.objects for delete using (bucket_id = 'listing-images' and auth.role() = 'authenticated');
