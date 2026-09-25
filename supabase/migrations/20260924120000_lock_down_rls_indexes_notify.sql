-- 2026-09-24 audit remediation (AUDIT.md M1-7, M1-5, D7, D14, D15, SEC-06, SEC-08).
--
-- Principle: every write the app makes goes through a server action or route
-- handler using the service role, after app-side validation. Row-level security
-- therefore only needs to allow public reads (and the browser analytics insert).
-- Policies that let anon or authenticated JWTs write directly through PostgREST
-- bypass that validation and are removed here.

-- analytics: admin reads now use the service role behind requireAdmin().
drop policy if exists "Allow authenticated read to analytics" on public.analytics_events;
drop policy if exists "Allow authenticated read to search_logs" on public.search_logs;

-- The browser page-view tracker still inserts with the anon key; restrict what it may write.
drop policy if exists "Allow public insert to analytics" on public.analytics_events;
create policy "Public can insert allowed analytics events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (
    event_type in ('page_view', 'website_click', 'phone_click', 'directions_click')
    and metadata is null
  );

-- search_logs has no browser writer; server-side logging uses the service role.
drop policy if exists "Allow public insert to search_logs" on public.search_logs;

-- leads, listing submissions and newsletter signups are inserted by the app with the service role.
drop policy if exists "Public can insert leads" on public.leads;
drop policy if exists "Anyone can submit a listing request" on public.listing_submissions;
drop policy if exists "Allow anonymous inserts" on public.newsletter_subscribers;

-- Owner edits go through updateListing (validated, service role). A direct PostgREST
-- UPDATE with the owner's JWT skipped URL and state validation.
drop policy if exists "Owners can update their own listings" on public.business_listings;

-- Legacy and archive tables had RLS disabled, which exposes them fully to the anon key.
alter table public.listings enable row level security;
alter table public.listings_staging enable row level security;
alter table public.business_listings_removed_20260916 enable row level security;

-- Storage: uploads and deletes happen through server actions with the service role.
-- Any authenticated user could previously upload to or delete from both buckets.
drop policy if exists "Authenticated upload" on storage.objects;
drop policy if exists "Authenticated delete" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Authenticated users can update images" on storage.objects;
drop policy if exists "Authenticated users can delete images" on storage.objects;

-- Data integrity that previously lived only in handlers. Verified against live data on 2026-09-24
-- (states are WA/OR only; no website or booking_url without an http(s) scheme).
alter table public.business_listings
  add constraint business_listings_state_check check (state in ('WA', 'OR'));
alter table public.business_listings
  add constraint business_listings_website_scheme_check
  check (website is null or website = '' or website ~* '^https?://');
alter table public.business_listings
  add constraint business_listings_booking_url_scheme_check
  check (booking_url is null or booking_url = '' or booking_url ~* '^https?://');

-- Notification outcome tracking so a lead or quote whose email failed is queryable.
alter table public.leads
  add column if not exists notified_at timestamptz,
  add column if not exists notify_error text,
  add column if not exists resend_id text;
alter table public.quote_requests
  add column if not exists notified_at timestamptz,
  add column if not exists notify_error text,
  add column if not exists resend_id text;
comment on column public.leads.notified_at is 'When the owner notification email was accepted by Resend; null means not sent';
comment on column public.quote_requests.notified_at is 'When the admin notification email was accepted by Resend; null means not sent';

-- Indexes on the columns the app filters and orders by.
create index if not exists business_listings_owner_id_idx on public.business_listings (owner_id) where owner_id is not null;
create index if not exists business_listings_state_city_slug_idx on public.business_listings (state, city_slug);
create index if not exists business_listings_featured_idx on public.business_listings (state, city_slug) where is_featured = true;
create index if not exists business_listings_rating_idx on public.business_listings (rating desc nulls last, id);
create index if not exists leads_listing_created_idx on public.leads (listing_id, created_at desc);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);
create index if not exists analytics_events_type_created_idx on public.analytics_events (event_type, created_at);
create index if not exists analytics_events_listing_idx on public.analytics_events (listing_id) where listing_id is not null;
