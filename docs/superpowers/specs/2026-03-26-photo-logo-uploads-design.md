# Photo & Logo Uploads for Business Profiles

**Date**: 2026-03-26
**Status**: Approved

## Overview

Allow claimed business owners to upload gallery photos and a logo through the existing dashboard photos page. Images stored in Supabase Storage, displayed on groomer profiles and listing cards.

## Storage

### Supabase Storage Bucket

- Single public bucket: `groomer-photos`
- Path structure:
  - Gallery: `groomer-photos/{listing_id}/{timestamp}-{filename}`
  - Logo: `groomer-photos/{listing_id}/logo-{timestamp}.{ext}`
- Public read access (images served via Supabase CDN URL)
- Write access restricted to authenticated users via RLS policy

### RLS Policy

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

## File Validation

- **Max size**: 5MB per file
- **Accepted types**: JPEG, PNG, WebP
- **Validation**: Server-side in the upload action (do not trust client-side checks alone)
- **Logo**: Single file. Uploading a new one replaces the old one (old file deleted from storage).
- **Gallery**: Multiple files. Each upload appends the URL to the `images` array.

## Upload Flow

### Server Actions (in dashboard actions or a new upload actions file)

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

## No Tier Limits

All claimed owners get the same upload access regardless of subscription tier. The existing tier-based photo limits in the dashboard UI will be removed. Limits can be reintroduced later if needed.

## UI Changes

### Dashboard Photos Page (`/dashboard/photos/page.tsx`)

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

### Groomer Profile Page (`/groomer/[slug]/page.tsx`)

**Hero Section**:
- Logo displayed as a 64px rounded square with a subtle border
- Positioned to the left of the business name
- Falls back gracefully (no logo = no element, not a placeholder)

**Gallery Section**:
- No changes needed; already renders from `images` array
- "Photo here" placeholders only show when `images` is empty

### Listing Cards (`/components/listing-card.tsx`)

- Small logo (32-40px rounded square) in the top-left corner of the card
- Positioned as an overlay on the image area with a white background/border for contrast
- Falls back gracefully (no logo = nothing shown)

## Image Optimization

- No server-side resizing for v1
- Next.js `<Image>` component handles responsive sizing and format optimization
- Supabase Storage CDN handles caching

## Security Summary

- Server actions verify authentication and listing ownership before any upload
- File type and size validated server-side
- Storage paths scoped by listing ID
- Admin client (service role key) used for DB updates, never exposed to client
- No direct client-to-storage uploads (all go through server actions)

## Files to Create or Modify

### New Files
- `src/app/dashboard/photos/actions.ts` - Upload/delete server actions

### Modified Files
- `src/app/dashboard/photos/page.tsx` - Real file inputs, logo section, remove tier limits
- `src/app/groomer/[slug]/page.tsx` - Logo in hero section
- `src/components/listing-card.tsx` - Logo overlay on cards
- `src/lib/database.types.ts` - Add `logo_url` to `business_listings` type
- `src/lib/supabase/queries.ts` - Ensure `logo_url` is selected in queries

### Supabase Setup (manual or migration)
- Create `groomer-photos` storage bucket
- Add RLS policies for authenticated upload/delete
- Add `logo_url` column to `business_listings` table
