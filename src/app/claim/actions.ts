"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { LISTING_REDIRECTS, PUBLIC_EXCLUDED_SLUGS } from "@/lib/listing-review";
import { decideClaim } from "@/lib/claims";
import { sendEmail } from "@/lib/email/send";

function log(event: string, fields: Record<string, unknown>) {
    console.error(JSON.stringify({ scope: "claim", event, ...fields }));
}

/**
 * Claim a listing. Verified automatically when the account email's domain matches
 * the listing's website; otherwise a pending request is queued for admin review and
 * the listing stays unclaimed until approved.
 */
export async function processClaim(formData: FormData) {
    const requestedSlug = formData.get("slug") as string;
    const slug = LISTING_REDIRECTS[requestedSlug] || requestedSlug;
    if (!slug || PUBLIC_EXCLUDED_SLUGS.includes(slug)) redirect("/get-listed");

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
        redirect(`/claim/${slug}`);
    }

    const admin = createAdminClient();

    const { data: listing, error: fetchError } = await admin
        .from("business_listings")
        .select("id, owner_id, is_featured, subscription_tier, website, name")
        .eq("slug", slug)
        .single();

    if (fetchError || !listing) {
        log("listing_fetch_failed", { slug, userId: user.id, code: fetchError?.code, message: fetchError?.message });
        redirect(`/claim/${slug}/plans?error=not-found`);
    }

    if (listing.owner_id === user.id) {
        redirect(`/claim/${slug}/success`);
    }

    if (listing.owner_id) {
        redirect(`/claim/${slug}/plans?error=already-claimed`);
    }

    // Already waiting for review by this user: just show the status page.
    const { data: existing } = await admin
        .from("claim_requests")
        .select("id, user_id")
        .eq("listing_id", listing.id)
        .eq("status", "pending")
        .maybeSingle();
    if (existing?.user_id === user.id) {
        redirect(`/claim/${slug}/success`);
    }
    if (existing) {
        redirect(`/claim/${slug}/plans?error=pending-other`);
    }

    const verification = decideClaim(user.email, listing.website);

    if (verification === "admin_review") {
        const { error: insertError } = await admin.from("claim_requests").insert({
            listing_id: listing.id,
            listing_slug: slug,
            user_id: user.id,
            user_email: user.email,
            status: "pending",
            verification,
        });
        if (insertError) {
            log("pending_insert_failed", { slug, userId: user.id, code: insertError.code, message: insertError.message });
            redirect(`/claim/${slug}/plans?error=claim-failed`);
        }
        const to = process.env.LISTING_NOTIFY_EMAIL;
        if (to) {
            await sendEmail({
                site: "claim_review",
                to,
                subject: `Claim needs review: ${listing.name}`,
                text: [
                    `${user.email} asked to claim "${listing.name}" (${slug}).`,
                    `Their email domain does not match the listing website (${listing.website || "none"}).`,
                    "",
                    "Review it here: https://groomlocal.com/admin/dashboard/claims",
                ].join("\n"),
                context: { slug },
            });
        } else {
            log("review_notify_skipped", { slug, reason: "missing LISTING_NOTIFY_EMAIL" });
        }
        redirect(`/claim/${slug}/success`);
    }

    // Domain match: approve immediately. The `.is("owner_id", null)` guard makes this atomic.
    const { data: updated, error: updateError } = await admin
        .from("business_listings")
        .update({
            owner_id: user.id,
            subscription_tier: listing.is_featured ? (listing.subscription_tier ?? "premium") : "free",
            claimed_at: new Date().toISOString(),
        })
        .eq("slug", slug)
        .is("owner_id", null)
        .select("owner_id")
        .single();

    if (updateError || !updated) {
        log("claim_update_failed", { slug, userId: user.id, code: updateError?.code, message: updateError?.message ?? "no row (raced)" });
        redirect(`/claim/${slug}/plans?error=already-claimed`);
    }

    await admin.from("claim_requests").insert({
        listing_id: listing.id,
        listing_slug: slug,
        user_id: user.id,
        user_email: user.email,
        status: "approved",
        verification,
        reviewed_at: new Date().toISOString(),
        reviewed_by: "system:domain_match",
    });

    updateTag("listings");
    revalidatePath(`/groomer/${slug}`);
    revalidatePath(`/claim/${slug}`);
    revalidatePath("/dashboard");

    redirect(`/claim/${slug}/success`);
}
