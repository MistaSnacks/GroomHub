# Dashboard Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable claimed business owners to upload photos/logos, edit services/specialties/hours, and fix profile display issues (reviews, website gating, verified badges, contact form gating).

**Architecture:** Supabase Storage for photos. Server actions for all mutations. Tier config coded but dormant (`BETA_MODE = true`). Display fixes are isolated edits to groomer profile and listing card components.

**Tech Stack:** Next.js 16 App Router, Supabase Storage + Admin Client, TypeScript, Tailwind CSS, Phosphor Icons

---

## Task 1: Foundation - Tier Config + Type Updates

**Files:**
- Create: `src/lib/tiers.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/tiers.ts`**

```typescript
// src/lib/tiers.ts
export const BETA_MODE = true;

export const TIER_LIMITS = {
  free: { photos: 3, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  standard: { photos: 10, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  featured: { photos: 50, logo: true, services: true, specialties: true, hours: true, contactForm: true },
  premium: { photos: 50, logo: true, services: true, specialties: true, hours: true, contactForm: true },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function getLimits(tier: string | null | undefined) {
  if (BETA_MODE) return TIER_LIMITS.premium;
  return TIER_LIMITS[(tier as TierName) ?? "free"] ?? TIER_LIMITS.free;
}
```

- [ ] **Step 2: Add `logo_url` to `BusinessListing` in `src/lib/types.ts`**

Add after line 43 (`booking_url?: string;`):

```typescript
  logo_url?: string;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/tiers.ts src/lib/types.ts
git commit -m "feat: add tier config and logo_url type"
```

---

## Task 2: Supabase Migration - Storage Bucket + Column

**Files:**
- Create: `supabase/migrations/20260326_add_logo_url_and_storage.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add logo_url column
ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Storage bucket will be created via Supabase CLI or dashboard
-- The bucket 'groomer-photos' should be public with authenticated write access
```

- [ ] **Step 2: Run migration via Supabase CLI**

```bash
cd pnw-grooming-directory
npx supabase db push
```

If the CLI is not linked, run the ALTER TABLE directly:

```bash
npx supabase db execute --project-ref afnkgwbajztnfkpijtcl "ALTER TABLE business_listings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;"
```

- [ ] **Step 3: Create storage bucket**

Go to Supabase Dashboard > Storage > Create bucket named `groomer-photos`, set to **Public**.

Or via CLI if available:

```bash
npx supabase storage create groomer-photos --public
```

- [ ] **Step 4: Add storage RLS policies**

In Supabase Dashboard > Storage > groomer-photos > Policies:

**SELECT policy** (public read):
- Name: `Public read access`
- Policy: `true` (allow all)

**INSERT policy** (authenticated users):
- Name: `Authenticated upload`
- Policy: `auth.role() = 'authenticated'`

**DELETE policy** (authenticated users):
- Name: `Authenticated delete`
- Policy: `auth.role() = 'authenticated'`

- [ ] **Step 5: Commit migration**

```bash
git add supabase/migrations/
git commit -m "feat: add logo_url column and storage migration"
```

---

## Task 3: Photo Upload Server Actions

**Files:**
- Create: `src/app/dashboard/photos/actions.ts`

- [ ] **Step 1: Create the upload actions file**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getLimits } from "@/lib/tiers";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_SIZE) {
    return "File must be under 5MB.";
  }
  return null;
}

async function requireListingOwnership(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" } as const;

  const admin = getAdmin();
  const { data: listing } = await admin
    .from("business_listings")
    .select("id, slug, owner_id, subscription_tier, images, logo_url")
    .eq("id", listingId)
    .single();

  if (!listing || listing.owner_id !== user.id) {
    return { error: "Not authorized" } as const;
  }

  return { user, listing, admin } as const;
}

export async function uploadPhoto(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const file = formData.get("file") as File;

  if (!file || !listingId) return { error: "Missing file or listing ID" };

  const fileError = validateFile(file);
  if (fileError) return { error: fileError };

  const result = await requireListingOwnership(listingId);
  if ("error" in result) return { error: result.error };
  const { listing, admin } = result;

  const limits = getLimits(listing.subscription_tier);
  const currentImages = listing.images || [];
  if (currentImages.length >= limits.photos) {
    return { error: `Photo limit reached (${limits.photos} photos).` };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${listingId}/${timestamp}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from("groomer-photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { error: "Failed to upload photo." };
  }

  const { data: urlData } = admin.storage
    .from("groomer-photos")
    .getPublicUrl(path);

  const { error: dbError } = await admin
    .from("business_listings")
    .update({ images: [...currentImages, urlData.publicUrl] })
    .eq("id", listingId);

  if (dbError) {
    console.error("DB update error:", dbError);
    return { error: "Failed to save photo." };
  }

  revalidatePath(`/groomer/${listing.slug}`);
  revalidatePath("/dashboard/photos");
  return { success: true };
}

export async function deletePhoto(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const imageUrl = formData.get("imageUrl") as string;

  if (!listingId || !imageUrl) return { error: "Missing data" };

  const result = await requireListingOwnership(listingId);
  if ("error" in result) return { error: result.error };
  const { listing, admin } = result;

  const currentImages = listing.images || [];
  const newImages = currentImages.filter((img: string) => img !== imageUrl);

  // Try to delete from storage (extract path from URL)
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/groomer-photos\/(.+)$/);
    if (pathMatch) {
      await admin.storage.from("groomer-photos").remove([pathMatch[1]]);
    }
  } catch {
    // If URL parsing fails or storage delete fails, still remove from DB
  }

  const { error: dbError } = await admin
    .from("business_listings")
    .update({ images: newImages })
    .eq("id", listingId);

  if (dbError) return { error: "Failed to delete photo." };

  revalidatePath(`/groomer/${listing.slug}`);
  revalidatePath("/dashboard/photos");
  return { success: true };
}

export async function uploadLogo(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const file = formData.get("file") as File;

  if (!file || !listingId) return { error: "Missing file or listing ID" };

  const fileError = validateFile(file);
  if (fileError) return { error: fileError };

  const result = await requireListingOwnership(listingId);
  if ("error" in result) return { error: result.error };
  const { listing, admin } = result;

  // Delete old logo if exists
  if (listing.logo_url) {
    try {
      const url = new URL(listing.logo_url);
      const pathMatch = url.pathname.match(/\/groomer-photos\/(.+)$/);
      if (pathMatch) {
        await admin.storage.from("groomer-photos").remove([pathMatch[1]]);
      }
    } catch {
      // Continue even if old delete fails
    }
  }

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${listingId}/logo-${timestamp}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("groomer-photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    return { error: "Failed to upload logo." };
  }

  const { data: urlData } = admin.storage
    .from("groomer-photos")
    .getPublicUrl(path);

  const { error: dbError } = await admin
    .from("business_listings")
    .update({ logo_url: urlData.publicUrl })
    .eq("id", listingId);

  if (dbError) return { error: "Failed to save logo." };

  revalidatePath(`/groomer/${listing.slug}`);
  revalidatePath("/dashboard/photos");
  return { success: true };
}

export async function deleteLogo(formData: FormData) {
  const listingId = formData.get("listingId") as string;

  if (!listingId) return { error: "Missing listing ID" };

  const result = await requireListingOwnership(listingId);
  if ("error" in result) return { error: result.error };
  const { listing, admin } = result;

  if (listing.logo_url) {
    try {
      const url = new URL(listing.logo_url);
      const pathMatch = url.pathname.match(/\/groomer-photos\/(.+)$/);
      if (pathMatch) {
        await admin.storage.from("groomer-photos").remove([pathMatch[1]]);
      }
    } catch {
      // Continue
    }
  }

  const { error: dbError } = await admin
    .from("business_listings")
    .update({ logo_url: null })
    .eq("id", listingId);

  if (dbError) return { error: "Failed to remove logo." };

  revalidatePath(`/groomer/${listing.slug}`);
  revalidatePath("/dashboard/photos");
  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/photos/actions.ts
git commit -m "feat: add photo and logo upload server actions"
```

---

## Task 4: Dashboard Photos Page - Real Uploads

**Files:**
- Rewrite: `src/app/dashboard/photos/page.tsx`

- [ ] **Step 1: Rewrite the photos page with real file upload UI**

Replace the entire file. Key changes:
- Remove mock upload/delete functions
- Import real actions from `./actions`
- Add logo upload section at top
- Use `<input type="file">` with client-side preview
- Remove tier-based limit display (beta mode: all features unlocked)
- Keep grid layout for gallery images
- Use `useActionState` for form submission feedback

The page must be split: server component fetches data, client component handles file inputs. Create a client component `photos-client.tsx` for the interactive parts.

- [ ] **Step 1a: Create `src/app/dashboard/photos/photos-client.tsx`**

```typescript
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Image as ImageIcon, Plus, Trash, Upload, User } from "@phosphor-icons/react/dist/ssr";
import { uploadPhoto, deletePhoto, uploadLogo, deleteLogo } from "./actions";

interface PhotosClientProps {
  listingId: string;
  currentImages: string[];
  logoUrl: string | null;
  maxPhotos: number;
}

export function PhotosClient({ listingId, currentImages, logoUrl, maxPhotos }: PhotosClientProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("listingId", listingId);
      formData.set("file", file);
      const result = await uploadPhoto(formData);
      if (result.error) {
        setError(result.error);
        break;
      }
    }

    setUploading(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("file", file);
    const result = await uploadLogo(formData);
    if (result.error) setError(result.error);

    setUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleDeletePhoto(imageUrl: string) {
    setError(null);
    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("imageUrl", imageUrl);
    const result = await deletePhoto(formData);
    if (result.error) setError(result.error);
  }

  async function handleDeleteLogo() {
    setError(null);
    const formData = new FormData();
    formData.set("listingId", listingId);
    const result = await deleteLogo(formData);
    if (result.error) setError(result.error);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
          {error}
        </div>
      )}

      {uploading && (
        <div className="p-3 text-sm text-brand-primary bg-brand-secondary/10 rounded-xl border border-brand-secondary/30">
          Uploading...
        </div>
      )}

      {/* Logo Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50/50 flex items-center gap-3">
          <User className="w-5 h-5 text-brand-secondary" weight="duotone" />
          <h2 className="font-heading text-lg font-bold text-brand-primary">
            Business Logo
          </h2>
        </div>
        <div className="p-6 flex items-center gap-6">
          {logoUrl ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
              <Image src={logoUrl} alt="Business logo" fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-surface to-brand-secondary/5 flex items-center justify-center border border-border shrink-0">
              <User weight="duotone" className="w-8 h-8 text-text-muted/25" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary/90 transition-all disabled:opacity-50"
              >
                <Upload weight="bold" className="w-3.5 h-3.5" />
                {logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold text-text-muted hover:text-[#C2185B] hover:border-[#C2185B] transition-all disabled:opacity-50"
                >
                  <Trash weight="bold" className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-text-muted">JPEG, PNG, or WebP. Max 5MB.</p>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Gallery Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-gray-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-brand-secondary" weight="duotone" />
            <h2 className="font-heading text-lg font-bold text-brand-primary">
              Gallery Photos
            </h2>
          </div>
          <div className="text-sm font-medium text-text-muted bg-white px-3 py-1 rounded-full border border-border shadow-sm">
            {currentImages.length} photos
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border relative group">
                <Image src={img} alt={`Gallery ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(img)}
                    className="p-2 bg-white text-red-600 rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    <Trash weight="bold" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {currentImages.length < maxPhotos && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all disabled:opacity-50"
              >
                <Plus weight="bold" className="w-8 h-8" />
                <span className="text-sm font-bold">Add Photo</span>
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 1b: Rewrite `src/app/dashboard/photos/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLimits } from "@/lib/tiers";
import { PhotosClient } from "./photos-client";

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("business_listings")
    .select("id, slug, images, logo_url, subscription_tier, owner_id")
    .eq("owner_id", user.id);

  if (params.id) {
    query = query.eq("id", params.id);
  }

  const { data: listings } = await query;
  const listing = listings?.[0];

  if (!listing) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <h2 className="text-xl font-bold text-brand-primary mb-2">No listing found</h2>
          <p className="text-text-muted">You do not have access to edit this listing, or it does not exist.</p>
        </div>
      </div>
    );
  }

  const limits = getLimits(listing.subscription_tier);
  const currentImages = (listing.images || []).filter(
    (img: string) =>
      !img.includes("unsplash.com") &&
      !img.includes("pexels.com") &&
      !img.includes("placehold.co") &&
      !img.includes("placeholder")
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
          Photos
        </h1>
        <p className="text-text-muted">
          Manage your business logo and gallery images.
        </p>
      </div>

      <PhotosClient
        listingId={listing.id}
        currentImages={currentImages}
        logoUrl={listing.logo_url || null}
        maxPhotos={limits.photos}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/photos/
git commit -m "feat: real photo and logo upload UI"
```

---

## Task 5: Dashboard Edit Page - Services, Specialties, Hours

**Files:**
- Modify: `src/app/dashboard/listing/[slug]/edit-listing-client.tsx`
- Modify: `src/app/dashboard/listing/[slug]/page.tsx`
- Modify: `src/app/dashboard/actions.ts`

- [ ] **Step 1: Extend `updateListing` in `src/app/dashboard/actions.ts`**

Add services, specialties, and hours to the update action. After the existing `website` extraction (line 126), add:

```typescript
  const servicesRaw = formData.get("services") as string;
  const specialtiesRaw = formData.get("specialties") as string;
  const hoursRaw = formData.get("hours") as string;

  const services = servicesRaw ? JSON.parse(servicesRaw) : undefined;
  const specialties = specialtiesRaw ? JSON.parse(specialtiesRaw) : undefined;
  const hours = hoursRaw ? JSON.parse(hoursRaw) : undefined;
```

And include them in the update object (add to the `.update({...})` call):

```typescript
      ...(services !== undefined ? { services } : {}),
      ...(specialties !== undefined ? { specialties } : {}),
      ...(hours !== undefined ? { hours } : {}),
```

- [ ] **Step 2: Pass `hours` to `EditListingClient` in `page.tsx`**

In `src/app/dashboard/listing/[slug]/page.tsx`, add `hours` to the props:

```typescript
        hours={listing.hours || []}
```

- [ ] **Step 3: Rewrite `edit-listing-client.tsx` with services/specialties/hours editing**

Full rewrite of the client component. Add:
- `hours` to the props interface (type `DayHours[]`)
- Import `SERVICE_TAGS` and `SPECIALTY_TAGS` from `@/lib/tags`
- Import `DayHours` from `@/lib/types`
- `selectedServices` state (Set of service tag labels, initialized from `props.services`)
- `selectedSpecialties` state (Set of specialty tag labels, initialized from `props.specialties`)
- `editHours` state (array of `DayHours`, initialized from `props.hours` or defaults for all 7 days)
- Hidden inputs for `services`, `specialties`, `hours` that serialize to JSON on form submit
- Replace the read-only services/specialties section with toggleable chip grids
- Add hours editing section with day rows, open/close time inputs, and closed toggles
- Keep existing basic info and contact info sections unchanged
- Keep location read-only

Key pattern for service/specialty chips:

```tsx
{SERVICE_TAGS.map((tag) => {
  const isSelected = selectedServices.has(tag.label);
  return (
    <button
      key={tag.slug}
      type="button"
      onClick={() => {
        const next = new Set(selectedServices);
        if (isSelected) next.delete(tag.label);
        else next.add(tag.label);
        setSelectedServices(next);
      }}
      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
        isSelected
          ? "bg-brand-accent/10 text-brand-accent border-brand-accent/30"
          : "bg-white text-text-muted border-border hover:border-brand-accent/30"
      }`}
    >
      {tag.label}
    </button>
  );
})}
```

Key pattern for hours:

```tsx
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Initialize hours state from props or defaults
const defaultHours: DayHours[] = DAYS.map((day) => {
  const existing = props.hours.find((h) => h.day === day);
  return existing || { day, open: "09:00", close: "17:00", closed: false };
});
```

Hidden inputs before the submit button:

```tsx
<input type="hidden" name="services" value={JSON.stringify([...selectedServices])} />
<input type="hidden" name="specialties" value={JSON.stringify([...selectedSpecialties])} />
<input type="hidden" name="hours" value={JSON.stringify(editHours)} />
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/listing/ src/app/dashboard/actions.ts
git commit -m "feat: editable services, specialties, and business hours"
```

---

## Task 6: Groomer Profile - Logo, Reviews Removal, Gating Fixes

**Files:**
- Modify: `src/app/groomer/[slug]/page.tsx`

- [ ] **Step 1: Add logo to hero section**

After the badges div (line 170) and before the `<h1>` (line 171), wrap the name area with a flex container that includes the logo:

```tsx
<div className="flex items-center gap-3">
  {listing.logo_url && (
    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
      <Image src={listing.logo_url} alt={`${listing.name} logo`} fill className="object-cover" sizes="64px" />
    </div>
  )}
  <div>
    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-primary">
      {listing.name}
    </h1>
  </div>
</div>
```

Add `Image` to the imports from `next/image`.

- [ ] **Step 2: Remove rating display from hero**

Delete lines 175-187 (the `listing.rating > 0` block in the hero).

- [ ] **Step 3: Gate website links by claim status**

In the hero contact block (lines 206-222), change the website link to show as plain text when unclaimed:

```tsx
{listing.website ? (
  listing.owner_id ? (
    <a
      href={listing.website}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-brand-accent hover:underline"
    >
      <Globe weight="bold" className="h-4 w-4" />
      Website
      <ArrowSquareOut weight="bold" className="h-3 w-3" />
    </a>
  ) : (
    <span className="flex items-center gap-1.5 text-text-muted">
      <Globe weight="bold" className="h-4 w-4" />
      {listing.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
    </span>
  )
) : (
  <span className="flex items-center gap-1.5 text-text-muted/50">
    <Globe weight="bold" className="h-4 w-4" />
    Website not available
  </span>
)}
```

Apply the same gating pattern to the sidebar website link (lines 511-523).

- [ ] **Step 4: Remove rating from "About" stats grid**

Delete the rating stat block (lines 389-395, the `listing.rating > 0` div in the stats grid).

- [ ] **Step 5: Remove Reviews section entirely**

Delete lines 452-462 (the entire Reviews section with the "No reviews yet" placeholder).

- [ ] **Step 6: Remove review_count from sidebar Trust Points**

Delete lines 605-608 (the `listing.review_count > 0` trust point).

- [ ] **Step 7: Change contact form gating to all claimed listings**

Change line 484 from:
```tsx
{listing.subscription_tier === 'premium' && (
```
To:
```tsx
{listing.owner_id && (
```

- [ ] **Step 8: Commit**

```bash
git add src/app/groomer/
git commit -m "feat: logo in hero, remove reviews, gate website links and contact form"
```

---

## Task 7: Listing Card - Logo, Reviews Removal, Verified Badge, Website Gating

**Files:**
- Modify: `src/components/listing-card.tsx`

- [ ] **Step 1: Add logo overlay to vertical card image area**

After the image/placeholder block (line 62, closing `}`), add logo overlay inside the `rounded-xl overflow-hidden` container:

```tsx
{listing.logo_url && (
  <div className="absolute top-2 left-2 z-10 w-9 h-9 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-white">
    <Image src={listing.logo_url} alt="" fill className="object-cover" sizes="36px" />
  </div>
)}
```

The image/placeholder parent div needs `relative` class (already has it via the placeholder, but the image wrapper needs it on the parent). Wrap both image and placeholder in a `relative` container if not already.

Add `Image` from `next/image` to imports.

- [ ] **Step 2: Remove rating block from vertical card**

Delete lines 92-111 (the `listing.rating > 0` star rating block).

- [ ] **Step 3: Change verified badge to check `owner_id`**

Change line 82 from:
```tsx
{(listing.is_paw_verified || listing.subscription_tier === 'premium' || listing.subscription_tier === 'featured') && (
```
To:
```tsx
{listing.owner_id && (
```

- [ ] **Step 4: Gate "Visit Website" button by claim status**

Change line 188 from:
```tsx
{listing.website && (
```
To:
```tsx
{listing.website && listing.owner_id && (
```

- [ ] **Step 5: Apply same fixes to HorizontalCard**

- Remove rating display (lines 271-279)
- Change verified badge condition (lines 250-252) to check `listing.owner_id`
- Add logo overlay to horizontal card image area (same pattern, smaller size w-8 h-8)

- [ ] **Step 6: Commit**

```bash
git add src/components/listing-card.tsx
git commit -m "feat: logo on cards, verified for all claimed, remove reviews, gate website"
```

---

## Task 8: Schema Cleanup - Remove aggregateRating

**Files:**
- Modify: `src/lib/schema.ts`

- [ ] **Step 1: Remove aggregateRating from `localBusinessSchema`**

Delete lines 90-102 (the entire `aggregateRating` block in `localBusinessSchema`).

- [ ] **Step 2: Remove aggregateRating from `itemListSchema`**

Delete lines 312-323 (the `aggregateRating` block in `itemListSchema`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/schema.ts
git commit -m "fix: remove aggregateRating from JSON-LD schemas"
```

---

## Task 9: Queries Update - Select logo_url

**Files:**
- Modify: `src/lib/supabase/queries.ts`

- [ ] **Step 1: Ensure logo_url is included in query results**

The queries use `.select("*")` which automatically includes `logo_url` since it's a column on the table. No query changes needed.

However, verify the `BusinessListing` type in `src/lib/types.ts` has `logo_url` (done in Task 1). The `withTags` function spreads the entire listing, so `logo_url` will pass through to `NormalizedListing` automatically.

- [ ] **Step 2: Verify by building**

```bash
cd pnw-grooming-directory && npx next build
```

- [ ] **Step 3: Commit any fixes and push**

```bash
git push origin main
```
