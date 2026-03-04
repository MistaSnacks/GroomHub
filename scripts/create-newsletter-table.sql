-- Run this in Supabase SQL Editor to create the newsletter subscribers table

create table if not exists newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz,
  source text default 'website'
);

-- Enable RLS
alter table newsletter_subscribers enable row level security;

-- Allow anonymous inserts (for the subscribe form)
create policy "Allow anonymous inserts"
  on newsletter_subscribers
  for insert
  to anon
  with check (true);

-- Only authenticated users (you) can read subscribers
create policy "Only authenticated can read"
  on newsletter_subscribers
  for select
  to authenticated
  using (true);

-- Create index on email for fast lookups
create index if not exists idx_newsletter_email on newsletter_subscribers (email);
