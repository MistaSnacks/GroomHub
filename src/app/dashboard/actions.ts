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

export async function updateListing(formData: FormData) {
  const slug = formData.get("slug") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const short_description = formData.get("short_description") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const website = formData.get("website") as string;
  const servicesRaw = formData.get("services") as string;
  const specialtiesRaw = formData.get("specialties") as string;
  const hoursRaw = formData.get("hours") as string;

  const services = servicesRaw ? JSON.parse(servicesRaw) : undefined;
  const specialties = specialtiesRaw ? JSON.parse(specialtiesRaw) : undefined;
  const hours = hoursRaw ? JSON.parse(hoursRaw) : undefined;

  const { user } = await requireUser();
  await requireOwnership(slug, user.id);

  // Use admin client so RLS can't silently block the write
  const admin = getAdmin();
  const { data: updated, error } = await admin
    .from("business_listings")
    .update({
      name: name || undefined,
      description: description || undefined,
      short_description: short_description || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
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
    redirect(`/dashboard/listing/${slug}?error=Failed to update listing`);
  }

  revalidatePath(`/groomer/${slug}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/listing/${slug}?success=updated`);
}
