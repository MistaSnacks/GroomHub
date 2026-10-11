"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath, updateTag } from "next/cache";
import { invalidateCore } from "@/lib/admin-console/data";
import { freePromoPlacement, NO_PLACEMENT } from "@/lib/listing-rules";

const getAdmin = createAdminClient;

export interface PlacementState {
  is_featured: boolean;
  sponsor_paid_until: string | null;
  sponsor_comp: boolean;
}

/**
 * Featuring from this page is the free promo (src/lib/listing-rules.ts): a Sponsored
 * spot that ends on its own at FREE_PROMO_ENDS_AT and is marked as comped so it never
 * counts as a paying sponsor. Paid placements are still set by hand in SQL.
 */
export async function toggleFeatured(
  slug: string,
  featured: boolean
): Promise<{ success: true; placement: PlacementState } | { success: false; error: string }> {
  if (!(await requireAdmin())) {
    throw new Error("Unauthorized");
  }

  let fields: Record<string, unknown>;
  if (featured) {
    const promo = freePromoPlacement();
    if (!promo.ok) return { success: false, error: promo.error };
    fields = promo.fields;
  } else {
    fields = NO_PLACEMENT;
  }

  const admin = getAdmin();
  const { error } = await admin.from("business_listings").update(fields).eq("slug", slug);

  if (error) {
    console.error(JSON.stringify({ scope: "admin", event: "toggleFeatured_failed", slug, code: error.code, message: error.message }));
    return { success: false, error: error.message };
  }
  updateTag("listings");
  invalidateCore();
  revalidatePath(`/groomer/${slug}`);
  return {
    success: true,
    placement: {
      is_featured: fields.is_featured as boolean,
      sponsor_paid_until: fields.sponsor_paid_until as string | null,
      sponsor_comp: fields.sponsor_comp as boolean,
    },
  };
}
