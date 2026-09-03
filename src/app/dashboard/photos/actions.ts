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
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
  const ext = EXT_BY_MIME[file.type] || "jpg";
  const path = `${listingId}/${timestamp}.${ext}`;

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
  revalidatePath(`/dashboard/listing/${listing.slug}`);
  return { success: true, url: urlData.publicUrl };
}

export async function deletePhoto(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const imageUrl = formData.get("imageUrl") as string;

  if (!listingId || !imageUrl) return { error: "Missing data" };

  const result = await requireListingOwnership(listingId);
  if ("error" in result) return { error: result.error };
  const { listing, admin } = result;

  const currentImages = listing.images || [];
  if (!currentImages.includes(imageUrl)) {
    return { error: "Image does not belong to this listing." };
  }
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
  revalidatePath(`/dashboard/listing/${listing.slug}`);
  return { success: true };
}

export async function deletePhotos(listingId: string, imageUrls: string[]) {
  if (!listingId || imageUrls.length === 0) return { error: "Missing data" };

  const result = await requireListingOwnership(listingId);
  if ("error" in result) return { error: result.error };
  const { listing, admin } = result;

  const currentImages: string[] = listing.images || [];
  const owned = new Set(currentImages);
  const verified = imageUrls.filter((u) => owned.has(u));

  if (verified.length === 0) {
    return { error: "No matching images on this listing." };
  }

  const toDelete = new Set(verified);
  const newImages = currentImages.filter((img: string) => !toDelete.has(img));

  const storagePaths: string[] = [];
  for (const imageUrl of verified) {
    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/groomer-photos\/(.+)$/);
      if (pathMatch) storagePaths.push(pathMatch[1]);
    } catch {
      // Skip invalid URLs
    }
  }

  if (storagePaths.length > 0) {
    await admin.storage.from("groomer-photos").remove(storagePaths);
  }

  const { error: dbError } = await admin
    .from("business_listings")
    .update({ images: newImages })
    .eq("id", listingId);

  if (dbError) return { error: "Failed to delete photos." };

  revalidatePath(`/groomer/${listing.slug}`);
  revalidatePath(`/dashboard/listing/${listing.slug}`);
  return { success: true, deleted: verified.length };
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
  const ext = EXT_BY_MIME[file.type] || "jpg";
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
  revalidatePath(`/dashboard/listing/${listing.slug}`);
  return { success: true, url: urlData.publicUrl };
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
  revalidatePath(`/dashboard/listing/${listing.slug}`);
  return { success: true };
}
