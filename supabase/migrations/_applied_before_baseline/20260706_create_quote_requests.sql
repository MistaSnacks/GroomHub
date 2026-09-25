-- Run this in the Supabase SQL Editor.
-- Stores submissions from the /get-quotes wizard. Until this table exists,
-- the /api/quotes route falls back to inserting a serialized record into `leads`.

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pet_type text not null,
  pet_name text,
  pet_breed text,
  pet_size text,
  services text[] not null default '{}',
  city text not null,
  preferred_date text,
  preferred_time text,
  name text not null,
  email text not null,
  phone text,
  notes text,
  status text not null default 'new'
);

alter table public.quote_requests enable row level security;

-- No policies at all: the API route writes with the service role key and
-- admin reads use the service role. Lead PII must never be readable with
-- the anon or authenticated roles.

create index if not exists idx_quote_requests_created_at
  on public.quote_requests (created_at desc);
