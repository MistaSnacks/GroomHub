-- Stores "add my business" submissions from the /get-listed form
-- (src/app/get-listed/actions.ts). The form writes with the anon/session
-- client, so anon + authenticated need insert; reads stay owner-only.

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

alter table public.listing_submissions enable row level security;

create policy "Anyone can submit a listing request"
  on public.listing_submissions
  for insert
  to anon, authenticated
  with check (true);

create policy "Only authenticated can read listing submissions"
  on public.listing_submissions
  for select
  to authenticated
  using (true);

create index if not exists idx_listing_submissions_created_at
  on public.listing_submissions (created_at desc);
