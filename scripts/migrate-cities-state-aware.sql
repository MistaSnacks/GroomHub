-- Normalize the cities table to state-aware slugs and derived counts.
-- Run in the Supabase SQL Editor if you want a pure-SQL repair path.

with city_rollup as (
  select
    lower(regexp_replace(city_slug, '-(wa|or)$', '')) || '-' || lower(state) as slug,
    city as name,
    case
      when upper(state) = 'WA' then 'Washington'
      when upper(state) = 'OR' then 'Oregon'
      else state
    end as state_name,
    upper(state) as state_abbr,
    count(*) as groomer_count
  from public.business_listings
  where city is not null
    and city <> 'Unknown'
    and city_slug is not null
    and city_slug <> 'unknown'
  group by 1, 2, 3, 4
),
existing_city_metadata as (
  select
    lower(regexp_replace(slug, '-(wa|or)$', '')) || '-' || lower(state_abbr) as normalized_slug,
    image,
    description,
    popular_breeds
  from public.cities
)
insert into public.cities (slug, name, state, state_abbr, groomer_count, image, description, popular_breeds)
select
  rollup.slug,
  rollup.name,
  rollup.state_name,
  rollup.state_abbr,
  rollup.groomer_count,
  coalesce(meta.image, ''),
  coalesce(meta.description, 'Find professional pet groomers in ' || rollup.name || ', ' || rollup.state_abbr || '.'),
  coalesce(meta.popular_breeds, array[]::text[])
from city_rollup rollup
left join existing_city_metadata meta
  on meta.normalized_slug = rollup.slug
on conflict (slug) do update
set
  name = excluded.name,
  state = excluded.state,
  state_abbr = excluded.state_abbr,
  groomer_count = excluded.groomer_count,
  image = excluded.image,
  description = excluded.description,
  popular_breeds = excluded.popular_breeds;

delete from public.cities
where slug not in (
  select lower(regexp_replace(city_slug, '-(wa|or)$', '')) || '-' || lower(state)
  from public.business_listings
  where city is not null
    and city <> 'Unknown'
    and city_slug is not null
    and city_slug <> 'unknown'
);
