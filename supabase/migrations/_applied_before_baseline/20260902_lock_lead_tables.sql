-- Drop SELECT-all policies so authenticated users cannot read lead PII.
-- Service-role writes and existing insert policies are unchanged.
-- (quote_requests is created without a select policy in 20260706.)

drop policy if exists "Only authenticated can read listing submissions"
  on public.listing_submissions;

drop policy if exists "Only authenticated can read"
  on public.newsletter_subscribers;
