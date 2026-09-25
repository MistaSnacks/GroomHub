"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin";
import { sendEmail } from "@/lib/email/send";

export interface ClaimRequestRow {
  id: string;
  listing_id: string;
  listing_slug: string;
  user_email: string;
  status: string;
  verification: string;
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  listing_name: string;
  listing_website: string | null;
  listing_owner_id: string | null;
}

function log(event: string, fields: Record<string, unknown>) {
  console.error(JSON.stringify({ scope: "admin_claims", event, ...fields }));
}

export async function listClaimRequests(status: "pending" | "all" = "pending"): Promise<ClaimRequestRow[]> {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");
  const db = createAdminClient();
  let query = db
    .from("claim_requests")
    .select("id, listing_id, listing_slug, user_email, status, verification, note, created_at, reviewed_at, reviewed_by, business_listings(name, website, owner_id)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status === "pending") query = query.eq("status", "pending");
  const { data, error } = await query;
  if (error) throw new Error(`claim_requests: ${error.message}`);
  return (data ?? []).map((r) => {
    const rel = r.business_listings as { name?: string; website?: string | null; owner_id?: string | null } | { name?: string; website?: string | null; owner_id?: string | null }[] | null;
    const l = Array.isArray(rel) ? rel[0] : rel;
    return {
      id: r.id as string,
      listing_id: r.listing_id as string,
      listing_slug: r.listing_slug as string,
      user_email: r.user_email as string,
      status: r.status as string,
      verification: r.verification as string,
      note: (r.note as string | null) ?? null,
      created_at: r.created_at as string,
      reviewed_at: (r.reviewed_at as string | null) ?? null,
      reviewed_by: (r.reviewed_by as string | null) ?? null,
      listing_name: l?.name ?? r.listing_slug as string,
      listing_website: l?.website ?? null,
      listing_owner_id: l?.owner_id ?? null,
    };
  });
}

async function notifyClaimant(to: string, subject: string, text: string, context: Record<string, string>) {
  return sendEmail({ site: "claim_decision", to, subject, text, context });
}

export async function approveClaim(requestId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const adminUser = await requireAdmin();
  if (!adminUser) return { ok: false, error: "Unauthorized" };
  const db = createAdminClient();

  const { data: req, error } = await db
    .from("claim_requests")
    .select("id, listing_id, listing_slug, user_id, user_email, status")
    .eq("id", requestId)
    .single();
  if (error || !req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending") return { ok: false, error: `Request is already ${req.status}.` };

  const { data: listing } = await db
    .from("business_listings")
    .select("is_featured, subscription_tier, name")
    .eq("id", req.listing_id)
    .single();

  const { data: updated, error: updateError } = await db
    .from("business_listings")
    .update({
      owner_id: req.user_id,
      subscription_tier: listing?.is_featured ? (listing.subscription_tier ?? "premium") : "free",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", req.listing_id)
    .is("owner_id", null)
    .select("id")
    .maybeSingle();
  if (updateError || !updated) {
    log("approve_failed", { requestId, code: updateError?.code, message: updateError?.message ?? "listing already owned" });
    return { ok: false, error: "The listing is already owned by another account." };
  }

  await db
    .from("claim_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: adminUser.email ?? adminUser.id })
    .eq("id", requestId);

  await notifyClaimant(
    req.user_email as string,
    `Your GroomLocal claim for ${listing?.name ?? req.listing_slug} is approved`,
    [
      `Good news: your claim for ${listing?.name ?? req.listing_slug} has been verified.`,
      "",
      "Sign in to manage your listing, add photos and see inquiries:",
      "https://groomlocal.com/dashboard",
    ].join("\n"),
    { slug: req.listing_slug as string }
  );

  updateTag("listings");
  revalidatePath(`/groomer/${req.listing_slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard/claims");
  return { ok: true };
}

export async function rejectClaim(requestId: string, note: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const adminUser = await requireAdmin();
  if (!adminUser) return { ok: false, error: "Unauthorized" };
  const db = createAdminClient();
  const { data: req } = await db
    .from("claim_requests")
    .select("id, listing_slug, user_email, status, business_listings(name)")
    .eq("id", requestId)
    .single();
  if (!req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending") return { ok: false, error: `Request is already ${req.status}.` };

  await db
    .from("claim_requests")
    .update({ status: "rejected", note: note.slice(0, 500) || null, reviewed_at: new Date().toISOString(), reviewed_by: adminUser.email ?? adminUser.id })
    .eq("id", requestId);

  const rel = req.business_listings as { name?: string } | { name?: string }[] | null;
  const name = (Array.isArray(rel) ? rel[0]?.name : rel?.name) ?? (req.listing_slug as string);
  await notifyClaimant(
    req.user_email as string,
    `About your GroomLocal claim for ${name}`,
    [
      `We could not verify your claim for ${name}.`,
      note ? `\nNote from our team: ${note.slice(0, 500)}\n` : "",
      "If you represent this business, reply to this email from an address at the business's website domain, or include something that shows you manage it (for example a photo of the shop sign with today's date).",
    ].join("\n"),
    { slug: req.listing_slug as string }
  );
  revalidatePath("/admin/dashboard/claims");
  return { ok: true };
}

/** Remove an owner from a listing (mistaken or abusive claim). */
export async function revokeClaim(slug: string, note: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const adminUser = await requireAdmin();
  if (!adminUser) return { ok: false, error: "Unauthorized" };
  const db = createAdminClient();
  const { data: listing } = await db.from("business_listings").select("id, owner_id").eq("slug", slug).single();
  if (!listing?.owner_id) return { ok: false, error: "Listing is not claimed." };

  const { error } = await db
    .from("business_listings")
    .update({ owner_id: null, subscription_tier: null, claimed_at: null, is_featured: false, sponsor_paid_until: null })
    .eq("id", listing.id);
  if (error) {
    log("revoke_failed", { slug, code: error.code, message: error.message });
    return { ok: false, error: error.message };
  }
  await db
    .from("claim_requests")
    .update({ status: "revoked", note: note.slice(0, 500) || null, reviewed_at: new Date().toISOString(), reviewed_by: adminUser.email ?? adminUser.id })
    .eq("listing_id", listing.id)
    .eq("user_id", listing.owner_id)
    .eq("status", "approved");

  updateTag("listings");
  revalidatePath(`/groomer/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard/listings");
  revalidatePath("/admin/dashboard/claims");
  return { ok: true };
}
