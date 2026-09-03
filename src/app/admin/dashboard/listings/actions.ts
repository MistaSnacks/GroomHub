"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
    .update({ is_featured: featured })
    .eq("slug", slug);

  if (error) {
    console.error("toggleFeatured error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}
