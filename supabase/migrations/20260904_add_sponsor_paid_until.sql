-- Applied to prod 2026-09-04 via Supabase MCP (apply_migration "add_sponsor_paid_until").
-- Records through when a listing's Sponsored placement is paid for.
-- NULL means not a paying sponsor (free, beta, or lapsed). Admin-only; owners cannot set it.
alter table public.business_listings
  add column if not exists sponsor_paid_until timestamptz;

comment on column public.business_listings.sponsor_paid_until is
  'Paid Sponsored placement is valid through this timestamp. NULL = not paying (free, beta, or lapsed). Set by admin only.';

create or replace function public.protect_listing_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;
