# Dashboard Enrichment: Photos, Editing, and Profile Cleanup

**Date**: 2026-03-26
**Status**: Approved

## Overview

Enable claimed business owners to fully enrich their profiles: upload photos and logos, edit services/specialties/hours, and clean up profile display issues (reviews, website link gating, verified badges, contact form gating). Tier-based limits are coded but dormant during beta (all claimed owners get full access).

This spec addresses three of the pre-outreach blockers from the grill-me takeaways: real photo upload, self-service services/specialties editing, and several display fixes needed before April 15 outreach.

---

## 1. Photo & Logo Uploads

### Supabase Storage Bucket

- Single public bucket: `groomer-photos`
- Path structure:
  - Gallery: `groomer-photos/{listing_id}/{timestamp}-{filename}`
  - Logo: `groomer-photos/{listing_id}/logo-{timestamp}.{ext}`
- Public read access (images served via Supabase CDN URL)
- Write access restricted to authenticated users via RLS policy

### Storage RLS Policy

- **SELECT**: Public (anyone can view uploaded images)
- **INSERT**: Authenticated users can upload to paths matching their owned listing IDs
- **DELETE**: Authenticated users can delete from paths matching their owned listing IDs

Policy enforcement: Server action verifies `owner_id === user.id` before initiating upload. The storage path includes the `listing_id`, scoping files to the correct listing.

### Database Changes

Add one column to `business_listings`:

```sql
ALTER TABLE business_listings ADD COLUMN logo_url TEXT DEFAULT NULL;
```

Gallery photos continue using the existing `images` text array column, but with real Supabase Storage URLs instead of placeholder URLs.

### File Validation

- **Max size**: 5MB per file
- **Accepted types**: JPEG, PNG, WebP
- **Validation**: Server-side in the upload action (do not trust client-side checks alone)
- **Logo**: Single file. Uploading a new one replaces the old one (old file deleted from storage).
- **Gallery**: Multiple files. Each upload appends the URL to the `images` array.

### Upload Server Actions

Create `src/app/dashboard/photos/actions.ts`:

**`uploadPhoto(formData)`**:
1. Verify user is authenticated
2. Verify user owns the listing (`owner_id === user.id`)
3. Validate file (size, type)
4. Upload to Supabase Storage at `groomer-photos/{listing_id}/{timestamp}-{sanitized_name}`
5. Get public URL from Supabase
6. Append URL to `business_listings.images` array using admin client
7. Revalidate `/groomer/{slug}` and `/dashboard/photos`

**`uploadLogo(formData)`**:
1. Verify user is authenticated
2. Verify user owns the listing
3. Validate file (size, type)
4. If existing `logo_url`, delete old file from storage
5. Upload to `groomer-photos/{listing_id}/logo-{timestamp}.{ext}`
6. Update `business_listings.logo_url` with public URL
7. Revalidate `/groomer/{slug}` and `/dashboard/photos`

**`deletePhoto(formData)`** (already partially exists):
1. Verify ownership
2. Remove URL from `images` array
3. Delete file from Supabase Storage
4. Revalidate paths

### Dashboard Photos Page UI (`/dashboard/photos/page.tsx`)

**Logo Section** (top of page):
- Heading: "Business Logo"
- Current logo preview (64px rounded square) or "No logo" placeholder
- File input button: "Upload Logo"
- Replace/remove buttons if logo exists
- Accepted formats note

**Gallery Section** (below logo):
- Heading: "Gallery Photos"
- Existing grid layout (responsive columns)
- Real file input replacing mock "Add Photo"
- Multiple file selection supported
- Upload progress/status feedback
- Delete button on hover (existing pattern, now also removes from storage)

### Logo Display

**Groomer Profile Hero** (`/groomer/[slug]/page.tsx`):
- Logo displayed as a 64px rounded square with a subtle border
- Positioned to the left of the business name
- Falls back gracefully (no logo = no element, not a placeholder)

**Listing Cards** (`/components/listing-card.tsx`):
- Small logo (32-40px rounded square) in the top-left corner of the card
- Positioned as an overlay on the image area with a white background/border for contrast
- Falls back gracefully (no logo = nothing shown)

**Gallery Section** on profile:
- No changes needed; already renders from `images` array
- "Photo here" placeholders only show when `images` is empty

### Image Optimization

- No server-side resizing for v1
- Next.js `<Image>` component handles responsive sizing and format optimization
- Supabase Storage CDN handles caching

---

## 2. Services & Specialties Self-Service Editing

### Current State

Services and specialties are locked on the edit page with "Contact support to update." The tag taxonomy already exists in `src/lib/tags.ts` with 15 service tags and 15 specialty tags, each with slugs, labels, descriptions, and aliases.

### Approach

Add a toggle-based picker to the dashboard edit page. Owners select from the existing tag pool. Selections are saved back to the raw `services` and `specialties` arrays in `business_listings`. The existing normalization pipeline (`withTags()`) handles mapping at query time, so no changes needed to the display layer.

### UI

**Services Section** on edit page:
- Heading: "Services Offered"
- Grid of toggleable chips/buttons, one per service tag (15 total)
- Each chip shows the tag label (e.g., "Full Groom", "Cat Grooming", "Mobile Grooming")
- Selected chips highlighted with brand color, unselected chips muted
- Chips are toggle on/off, no limit on selections

**Specialties Section** on edit page:
- Same pattern as services, one per specialty tag (15 total)
- Heading: "Specialties"

### Save Behavior

When the form is submitted, the selected tag slugs are converted to their canonical label strings and saved to the `services` and `specialties` arrays on `business_listings`. The normalization layer already maps these back to tags at query time.

### Server Action

Extend `updateListing` in `src/app/dashboard/actions.ts` (or create a new action) to accept `services` and `specialties` arrays. Same ownership verification pattern as existing updates.

---

## 3. Business Hours Editing

### Current State

Hours are stored as `hours: Json[] | null` on `business_listings`. The profile page renders them as a day-by-day table if present. No editing UI exists.

### UI

**Hours Section** on edit page:
- Heading: "Business Hours"
- 7 rows, one per day (Monday through Sunday)
- Each row: Day label | Open time input | Close time input | "Closed" toggle
- When "Closed" is toggled on, time inputs are disabled/hidden for that day
- Time inputs use native time pickers or simple HH:MM text inputs

### Data Shape

Each entry in the `hours` array:
```json
{ "day": "Monday", "open": "09:00", "close": "17:00", "closed": false }
```

### Server Action

Extend `updateListing` to accept the `hours` array. Validate that open/close times are valid and open is before close. Same ownership verification.

---

## 4. Tier-Based Limits (Coded but Dormant)

### Philosophy

During beta (barter program), all claimed owners get full access to all features. Tier limits are implemented in code with a configuration constant that controls enforcement. When beta ends and paid tiers launch, flip the constant.

### Tier Configuration

```typescript
// src/lib/tiers.ts
export const BETA_MODE = true; // Set to false when paid tiers launch

export const TIER_LIMITS = {
  free: { photos: 3, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  standard: { photos: 10, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  featured: { photos: 50, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  premium: { photos: 50, logo: true, services: true, specialties: true, hours: true, contactForm: true },
} as const;

// When BETA_MODE is true, all limits use the premium tier values
export function getLimits(tier: string) {
  if (BETA_MODE) return TIER_LIMITS.premium;
  return TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.free;
}
```

Server actions check `getLimits(listing.subscription_tier)` before allowing uploads. During beta this always returns premium limits. When beta ends, the real tier kicks in.

The UI should still show the tier name and a note like "Beta: all features unlocked" so owners understand they're getting extra value.

---

## 5. Website Link Gating

### Current State

Website links are clickable on both claimed and unclaimed listings (profile page and listing cards). No distinction.

### Change

- **Unclaimed listings**: Show website URL as plain text (not a hyperlink). Visible but not clickable.
- **Claimed listings**: Website is a clickable link (current behavior).
- **Listing cards**: "Visit Website" button only appears on claimed listings (check `owner_id`).

### Why

- Unclaimed groomers didn't opt in. Driving traffic to their site from a directory they don't know about is a gray area.
- Clickable website link becomes a tangible benefit of claiming (even on free tier).
- The URL is still visible as text, so it's informational, just not a direct link.

---

## 6. Remove Review Display Code

### Current State

Rating and review_count conditionals exist on the groomer profile page and listing cards. Data was nulled in the March 2026 cleanup, so nothing renders, but the code is still there.

### Change

Per `reviews-decision.md`: Remove all review-related display code.

- **Groomer profile**: Remove rating/review_count display block, remove aggregateRating from JSON-LD schema
- **Listing cards**: Remove star rating display block
- **Sidebar**: Remove review_count from "Why Pet Parents Trust Them" section

Keep the database columns (`rating`, `review_count`) for potential future use. Only remove the rendering code.

---

## 7. Verified Badge on All Claimed Listings

### Current State

Listing cards show "Verified" badge only if `is_paw_verified` OR `subscription_tier === 'premium'` OR `subscription_tier === 'featured'`.

### Change

Per `claimed-listing-visibility.md`: Show "Verified" badge on any listing with `owner_id !== null`.

- **Listing cards**: Check `owner_id` instead of tier/badge flags
- **Visual hierarchy**:
  - Unclaimed: No badge
  - Claimed (any tier): "Verified" checkmark
  - Featured/Premium: Additional badges as they exist today

---

## 8. Contact Form on All Claimed Listings

### Current State

Contact form only renders if `subscription_tier === 'premium'`.

### Change

Per `contact-form-scope.md`: Show contact form on any claimed listing (`owner_id !== null`). Unclaimed listings do not show a contact form.

This aligns with the pre-outreach blocker: working contact form is needed before April 15. The form already exists, it just needs the gating condition changed.

---

## Security Summary

- Server actions verify authentication and listing ownership before any mutation
- File type and size validated server-side
- Storage paths scoped by listing ID
- Admin client (service role key) used for DB updates, never exposed to client
- No direct client-to-storage uploads (all go through server actions)
- Tier limits enforced server-side (not just UI)

---

## Files to Create or Modify

### New Files
- `src/app/dashboard/photos/actions.ts` - Upload/delete server actions
- `src/lib/tiers.ts` - Tier limits config with beta mode toggle

### Modified Files
- `src/app/dashboard/photos/page.tsx` - Real file inputs, logo section
- `src/app/dashboard/listing/[slug]/edit-listing-client.tsx` - Services/specialties picker, hours editor, remove "Contact support" locks
- `src/app/dashboard/actions.ts` - Extend updateListing for services, specialties, hours
- `src/app/groomer/[slug]/page.tsx` - Logo in hero, remove review code, contact form gating change, website link gating
- `src/components/listing-card.tsx` - Logo overlay, remove review code, verified badge on all claimed, website button gating
- `src/lib/database.types.ts` - Add `logo_url` to `business_listings` type
- `src/lib/supabase/queries.ts` - Ensure `logo_url` is selected in queries
- `src/lib/schema.ts` - Remove aggregateRating from JSON-LD

### Supabase Setup (via CLI migration)
- Create `groomer-photos` storage bucket with RLS policies
- Add `logo_url` column to `business_listings` table
