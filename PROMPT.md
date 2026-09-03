# Week 1: Listing Enrichment for SEO

## Project Overview
Enrich groomer listing profile pages and listing cards on GroomLocal (a Next.js pet grooming directory) to surface existing data that is currently hidden from users and search engines. This work prepares the site for a backlink outreach campaign by making listing pages more valuable and informative.

## Tech Stack
- Next.js 16 (App Router, Server Components)
- TypeScript (strict)
- Tailwind CSS v4
- Phosphor Icons (`@phosphor-icons/react/dist/ssr`)
- Supabase (data source)

## Design System
- **Brand primary**: #1E293B (dark slate)
- **Brand secondary**: #4ECDC4 (teal)
- **Brand accent**: #FF7E67 (coral)
- **Fonts**: Fredoka (headings via `font-heading`), Inter (body)
- **Cards**: `rounded-2xl border border-border bg-white p-6`
- **Section headings**: `font-heading text-xl font-semibold text-brand-primary mb-4`
- **Tag pills (service)**: `rounded-full bg-brand-secondary/10 px-4 py-2 text-sm font-medium text-brand-secondary border border-brand-secondary/20`
- **Tag pills (specialty)**: `rounded-full bg-brand-accent/10 px-4 py-2 text-sm font-medium text-brand-accent border border-brand-accent/20`
- **Muted text**: `text-sm text-text-muted`
- Teal sections use dark text (slate-900/700/600), NOT white

## Rules
- NO em dashes anywhere. Use periods, commas, colons, parentheses, or hyphens instead.
- NO AI slop phrases: "game-changer", "seamless", "navigate the", "delve", "leverage", "elevate", "robust", "holistic", "it's worth noting", "furry friend", "four-legged friend", "unleash"
- Use "dog" or "pet" instead of "furry friend" etc.
- Do NOT add new npm packages
- Do NOT change any existing data queries or Supabase schema
- Do NOT modify the listing card washi-tape rotation or animation behavior
- Do NOT touch the nav, footer, or any page other than the groomer profile page and listing card
- Keep all existing functionality intact
- Use existing Phosphor icons only (already imported: Star, MapPin, Phone, Globe, Clock, Users, Calendar, ArrowSquareOut, PawPrint, ShieldCheck, ImageSquare, CaretRight, ArrowRight, CheckCircle)
- Additional Phosphor icons may be imported from `@phosphor-icons/react/dist/ssr` as needed (e.g., CurrencyDollar, Hourglass, CalendarCheck, Dog, Cat, Scissors)

## File Structure

All changes happen in these existing files:

### Phase 1: Service & Specialty Descriptions on Profile Page
- `src/app/groomer/[slug]/page.tsx` - Add descriptions under each service and specialty tag

### Phase 2: Pricing Display on Profile Page
- `src/app/groomer/[slug]/page.tsx` - Show price_min/price_max in the About section and add a Pricing card

### Phase 3: Waitlist/Booking Status
- `src/app/groomer/[slug]/page.tsx` - Show waitlist_status and booking_url in hero and sidebar

### Phase 4: Listing Card Enrichment
- `src/components/listing-card.tsx` - Add waitlist indicator and price range to horizontal cards

### Phase 5: Schema.org Enhancement
- `src/lib/schema.ts` - Add hasOfferCatalog with services to LocalBusiness schema

## Detailed Specs

### Phase 1: Service & Specialty Descriptions on Profile Page

In `src/app/groomer/[slug]/page.tsx`, modify the Services section (around line 251-277).

**Current behavior**: Service tags render as plain pills with just the label.
**New behavior**: Each service tag renders as a small card with the label AND its description from `tags.ts`.

Import `getServiceTag` and `getSpecialtyTag` from `@/lib/tags` (these functions already exist and return `TagDefinition | undefined` which includes a `description` field).

Replace the service tags flex-wrap with a grid layout:

```tsx
{listing.service_tags.length > 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {listing.service_tags.map((slug) => {
      const tag = getServiceTag(slug);
      return (
        <div key={slug} className="rounded-xl bg-brand-secondary/5 border border-brand-secondary/15 p-3">
          <span className="text-sm font-semibold text-brand-primary">
            {getServiceLabel(slug)}
          </span>
          {tag?.description && (
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              {tag.description}
            </p>
          )}
        </div>
      );
    })}
  </div>
) : /* keep existing fallbacks */ }
```

Do the same for the Specialties section (around line 280-296), using `getSpecialtyTag` instead, and using `bg-brand-accent/5 border-brand-accent/15` colors.

The sidebar "Services Offered" and "Specialties" sections (lines 448-483) should remain as compact pills (no descriptions there).

### Phase 2: Pricing Display on Profile Page

In the About section of `src/app/groomer/[slug]/page.tsx` (around line 299-334):

1. Replace the simple price_range display in the info grid with actual dollar amounts when available:

```tsx
<div className="rounded-xl bg-surface p-3 text-center">
  <CurrencyDollar weight="fill" className="h-4 w-4 text-brand-accent mx-auto mb-1" />
  <p className="text-xs text-text-muted">Starting at</p>
  {listing.price_min > 0 ? (
    <p className="text-sm font-semibold text-brand-primary">
      ${listing.price_min} - ${listing.price_max}
    </p>
  ) : (
    <p className="text-sm font-semibold text-brand-primary">{listing.price_range || "$$"}</p>
  )}
</div>
```

Import `CurrencyDollar` from `@phosphor-icons/react/dist/ssr`.

2. Add a new "Pricing" card AFTER the About section and BEFORE the Hours section. Only render if `listing.price_min > 0`:

```tsx
{listing.price_min > 0 && (
  <div className="rounded-2xl border border-border bg-white p-6">
    <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
      Pricing
    </h2>
    <div className="flex items-baseline gap-2 mb-2">
      <span className="text-2xl font-bold text-brand-primary">${listing.price_min}</span>
      <span className="text-text-muted">to</span>
      <span className="text-2xl font-bold text-brand-primary">${listing.price_max}</span>
    </div>
    <p className="text-sm text-text-muted">
      Prices vary by breed, coat type, and services requested. Contact {listing.name} for an exact quote.
    </p>
    {listing.transparent_pricing && (
      <p className="text-xs text-brand-secondary font-medium mt-2 flex items-center gap-1">
        <ShieldCheck weight="fill" className="w-3.5 h-3.5" />
        This business offers transparent, upfront pricing
      </p>
    )}
  </div>
)}
```

### Phase 3: Waitlist/Booking Status

Add a status indicator in the hero section of `src/app/groomer/[slug]/page.tsx`, right after the address/phone/website row (after line 198, before the claim CTA).

Import `CalendarCheck` and `Hourglass` from `@phosphor-icons/react/dist/ssr`.

```tsx
{/* Availability Status */}
{listing.waitlist_status && (
  <div className="flex items-center gap-2 mt-2">
    {listing.waitlist_status === "immediate" && (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
        <CalendarCheck weight="fill" className="w-3.5 h-3.5" />
        Accepting new clients
      </span>
    )}
    {listing.waitlist_status === "short" && (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
        <Hourglass weight="fill" className="w-3.5 h-3.5" />
        Short waitlist
      </span>
    )}
    {listing.waitlist_status === "long" && (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
        <Hourglass weight="fill" className="w-3.5 h-3.5" />
        Long waitlist
      </span>
    )}
    {listing.waitlist_status === "closed" && (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">
        <Hourglass weight="fill" className="w-3.5 h-3.5" />
        Not accepting new clients
      </span>
    )}
  </div>
)}
```

In the sidebar, add a "Book Now" button IF `listing.booking_url` exists. Add it inside the Location card, after the map embed:

```tsx
{listing.booking_url && (
  <a
    href={listing.booking_url}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 flex items-center justify-center w-full px-4 py-2.5 rounded-full cta-gradient text-brand-primary font-semibold text-sm hover:opacity-90 transition-opacity"
  >
    <CalendarCheck weight="bold" className="w-4 h-4 mr-2" />
    Book an Appointment
  </a>
)}
```

### Phase 4: Listing Card Enrichment

In `src/components/listing-card.tsx`:

1. In the **HorizontalCard** component, after the rating/location row and before the tags, add a waitlist status pill (compact version):

```tsx
{/* Waitlist status */}
{listing.waitlist_status === "immediate" && (
  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 mb-2">
    Accepting clients
  </span>
)}
{listing.waitlist_status === "closed" && (
  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 mb-2">
    Waitlist closed
  </span>
)}
```

2. In the **vertical ListingCard**, the price range display already exists (lines 77-81) showing `$price_min - $price_max` when available. No changes needed there.

3. In the **HorizontalCard**, add the price range after the location in the rating/location row:

```tsx
{(listing.price_min > 0) && (
  <span className="text-xs font-semibold text-text">
    ${listing.price_min}-${listing.price_max}
  </span>
)}
```

### Phase 5: Schema.org Enhancement

In `src/lib/schema.ts`, enhance `localBusinessSchema()` to include service offerings:

Import `getServiceTag` from `./tags`.

After the openingHoursSpecification in the return object, add:

```tsx
// Add services as offers
...(listing.service_tags && listing.service_tags.length > 0 && {
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Grooming Services",
    itemListElement: listing.service_tags.map((slug) => {
      const tag = getServiceTag(slug);
      return {
        "@type": "OfferCatalog",
        name: tag?.label || slug,
        ...(tag?.description && { description: tag.description }),
      };
    }),
  },
}),
// Add price range as offers if available
...(listing.price_min > 0 && {
  makesOffer: {
    "@type": "Offer",
    priceSpecification: {
      "@type": "PriceSpecification",
      minPrice: listing.price_min,
      maxPrice: listing.price_max,
      priceCurrency: "USD",
    },
  },
}),
```

## Validation

After each phase, run:
```bash
cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory"
npx tsc --noEmit
```

After all phases, also run:
```bash
npm run build
```

## Completion Criteria

Output `RALPH_COMPLETE` when ALL of the following are true:
1. `npx tsc --noEmit` passes with zero errors
2. `npm run build` succeeds
3. Services section on groomer profile shows tag descriptions from tags.ts
4. Specialties section on groomer profile shows tag descriptions from tags.ts
5. Pricing card appears on groomer profile when price_min > 0
6. Waitlist status badge appears in groomer hero when waitlist_status is set
7. Booking URL button appears in sidebar when booking_url exists
8. Horizontal listing cards show waitlist status and price range
9. LocalBusiness schema includes hasOfferCatalog with service descriptions
10. LocalBusiness schema includes makesOffer with price range when available
11. No em dashes exist in any modified content strings
12. No AI slop phrases exist in any modified content strings
