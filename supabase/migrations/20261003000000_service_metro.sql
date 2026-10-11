-- Service areas for mobile groomers. A mobile groomer picks one metro area
-- (an id from METRO_CLUSTERS in src/lib/metro-clusters.ts) and is shown on every
-- city page in it, in a labeled "travels to" section. The app validates the value;
-- owners set it from their dashboard through the service-role update action.

alter table public.business_listings
  add column if not exists service_metro text;
comment on column public.business_listings.service_metro is 'Metro area a mobile groomer travels across (METRO_CLUSTERS slug, e.g. salem-metro); null for none';
create index if not exists business_listings_service_metro_idx
  on public.business_listings (service_metro) where service_metro is not null;
