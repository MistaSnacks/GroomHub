-- Owners can UPDATE their own business_listings row via RLS, but nothing stopped
-- them from changing paid/privileged columns (subscription_tier, is_featured,
-- badges, owner_id, etc.) with a direct PostgREST call. RLS is row-level, so this
-- has to be a trigger. Server actions use the service-role key and are exempt.

create or replace function public.protect_listing_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only guard requests coming through PostgREST as anon/authenticated.
  -- service_role, postgres, and dashboard SQL pass straight through.
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.owner_id          is distinct from old.owner_id
  or new.subscription_tier is distinct from old.subscription_tier
  or new.is_featured       is distinct from old.is_featured
  or new.is_paw_verified   is distinct from old.is_paw_verified
  or new.badges            is distinct from old.badges
  or new.claimed_at        is distinct from old.claimed_at
  or new.slug              is distinct from old.slug
  then
    raise exception 'Cannot change protected listing columns'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_listing_privileged_columns on public.business_listings;

create trigger protect_listing_privileged_columns
  before update on public.business_listings
  for each row
  execute function public.protect_listing_privileged_columns();
