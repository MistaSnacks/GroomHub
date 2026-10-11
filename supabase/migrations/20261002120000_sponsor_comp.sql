-- Free promotional Sponsored spots (docs/free-promo-spot-2026.md).
--
-- A comped spot is featured with a sponsor_paid_until end date so it expires on its
-- own, but nobody paid for it. sponsor_comp marks it so the re-feature trigger
-- (src/lib/refeature-trigger.ts) counts only real paying sponsors.

alter table public.business_listings
  add column if not exists sponsor_comp boolean not null default false;
comment on column public.business_listings.sponsor_comp is 'True when the Sponsored spot is a free promotion, not a paid seat; excluded from the paying-sponsor count';

-- Same protected-columns trigger as before, with sponsor_comp added so an owner
-- session can never turn a free spot into one that looks paid, or the reverse.
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
  or new.sponsor_comp       is distinct from old.sponsor_comp
  then
    raise exception 'Cannot change protected listing columns'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;
