"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin";

const getAdmin = createAdminClient;

export async function getClaimedListings() {
  if (!(await requireAdmin())) {
    throw new Error("Unauthorized");
  }
  const admin = getAdmin();
  const { data, error } = await admin
    .from("business_listings")
    .select("slug, name, city, state, subscription_tier, is_featured, claimed_at, owner_id")
    .not("owner_id", "is", null)
    .order("claimed_at", { ascending: false });

  if (error) {
    console.error("getClaimedListings error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function toggleFeatured(slug: string, featured: boolean) {
  if (!(await requireAdmin())) {
    throw new Error("Unauthorized");
  }

  const admin = getAdmin();
  const { error } = await admin
    .from("business_listings")
    .update(
      featured
        ? { is_featured: true, subscription_tier: "premium" }
        : { is_featured: false, subscription_tier: "free", sponsor_paid_until: null }
    )
    .eq("slug", slug);

  if (error) {
    console.error("toggleFeatured error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}
