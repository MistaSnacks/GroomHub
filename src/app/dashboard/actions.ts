"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Canonical city slug. Must match the import pipeline
 * (scripts/discover-groomers.js, generate-master-csv.js) so an edited
 * listing stays queryable under the same city_slug the directory filters by.
 */
function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse a JSON form field, returning undefined on empty/invalid input. */
function safeJsonParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/** Verify the current session and return the user, or redirect. */
async function requireUser(redirectPath = "/login?redirect=/dashboard") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(redirectPath);
  return { supabase, user };
}

/** Verify the current user owns the given listing slug, or redirect. */
async function requireOwnership(slug: string, userId: string) {
  const admin = getAdmin();
  const { data: listing } = await admin
    .from("business_listings")
    .select("owner_id")
    .eq("slug", slug)
    .single();

  if (!listing || listing.owner_id !== userId) {
    redirect("/dashboard?error=not-authorized");
  }
  return listing;
}

export async function unclaimListing(formData: FormData) {
  const slug = formData.get("slug") as string;
  const { user } = await requireUser();
  await requireOwnership(slug, user.id);

  const admin = getAdmin();
  const { data: updated, error } = await admin
    .from("business_listings")
    .update({
      owner_id: null,
      subscription_tier: null,
      claimed_at: null,
    })
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .select("slug")
    .single();

  if (error || !updated) {
    console.error("Failed to unclaim listing:", error);
    redirect("/dashboard/settings?error=Failed to unclaim listing");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/groomer/${slug}`);
  redirect("/dashboard");
}

export async function updatePassword(formData: FormData) {
  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 6) {
    redirect("/dashboard/settings?error=Password must be at least 6 characters");
  }

  const { supabase } = await requireUser("/login?redirect=/dashboard/settings");

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error("Failed to update password:", error);
    redirect("/dashboard/settings?error=Failed to update password");
  }

  redirect("/dashboard/settings?success=password-updated");
}

export async function deleteAccount(formData: FormData) {
  const confirmation = formData.get("confirmation") as string;

  if (confirmation !== "DELETE") {
    redirect("/dashboard/settings?error=Please type DELETE to confirm");
  }

  const { supabase, user } = await requireUser("/login");

  // Unclaim all listings owned by this user (use admin to ensure it works)
  const admin = getAdmin();
  await admin
    .from("business_listings")
    .update({
      owner_id: null,
      subscription_tier: null,
      claimed_at: null,
    })
    .eq("owner_id", user.id);

  // Delete the auth user via admin client
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Failed to delete account:", error);
    redirect("/dashboard/settings?error=Failed to delete account");
  }

  // Sign out
  await supabase.auth.signOut();

  redirect("/?account-deleted=true");
}

function isHoursArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((h) => {
    if (!h || typeof h !== "object") return false;
    const row = h as { day?: unknown; open?: unknown; close?: unknown; closed?: unknown };
    return (
      typeof row.day === "string" &&
      typeof row.open === "string" &&
      typeof row.close === "string" &&
      typeof row.closed === "boolean"
    );
  });
}

function parseWebsite(raw: string): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "Website must be an http or https URL." };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "Website must be a valid URL." };
  }
}

export async function updateListing(formData: FormData) {
  const slug = formData.get("slug") as string;
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const short_description = (formData.get("short_description") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const websiteRaw = (formData.get("website") as string | null) ?? "";
  const address = (formData.get("address") as string | null)?.trim() ?? "";
  const city = (formData.get("city") as string | null)?.trim() ?? "";
  const state = (formData.get("state") as string | null)?.trim() ?? "";
  const zip = (formData.get("zip") as string | null)?.trim() ?? "";
  const services = safeJsonParse<string[]>(formData.get("services") as string | null);
  const specialties = safeJsonParse<string[]>(formData.get("specialties") as string | null);
  const hours = safeJsonParse<unknown>(formData.get("hours") as string | null);

  if (!name) {
    return { error: "Business name is required." };
  }
  if (name.length > 120) {
    return { error: "Name must be 120 characters or fewer." };
  }
  if (short_description.length > 300) {
    return { error: "Short description must be 300 characters or fewer." };
  }
  if (description.length > 5000) {
    return { error: "Description must be 5000 characters or fewer." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const websiteResult = parseWebsite(websiteRaw);
  if (!websiteResult.ok) {
    return { error: websiteResult.error };
  }

  if (hours !== undefined && !isHoursArray(hours)) {
    return { error: "Hours must be an array of day objects." };
  }

  const { user } = await requireUser();
  await requireOwnership(slug, user.id);

  const admin = getAdmin();
  const { data: updated, error } = await admin
    .from("business_listings")
    .update({
      name,
      description: description || null,
      short_description: short_description || null,
      phone: phone || null,
      email: email || null,
      website: websiteResult.value,
      ...(address ? { address } : {}),
      ...(city ? { city, city_slug: slugifyCity(city) } : {}),
      ...(state ? { state } : {}),
      ...(zip ? { zip } : {}),
      ...(services !== undefined ? { services } : {}),
      ...(specialties !== undefined ? { specialties } : {}),
      ...(hours !== undefined ? { hours } : {}),
    })
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .select("slug")
    .single();

  if (error || !updated) {
    console.error("Failed to update listing:", error);
    return { error: "Failed to update listing" };
  }

  revalidatePath(`/groomer/${slug}`);
  revalidatePath(`/dashboard/listing/${slug}`);
  revalidatePath("/dashboard");
  return { success: true };
}
