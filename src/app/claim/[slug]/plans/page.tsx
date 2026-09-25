import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingBySlug } from "@/lib/supabase/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClaimPlansClient } from "./claim-plans-client";

export default async function ClaimPlansPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Auth gate: send back to step 1 (which has the auth form), not /login
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/claim/${slug}`);
    }

    // Check listing exists and is unclaimed
    const listing = await getListingBySlug(slug);

    if (!listing) {
        redirect(`/dog-grooming`);
    }

    // Existing owners can change plans. Only bounce visitors who don't own it.
    if (listing.owner_id && listing.owner_id !== user.id) {
        redirect(`/groomer/${slug}`);
    }

    // A claim already waiting for review shows its status instead of the form.
    const { data: pending } = await createAdminClient()
        .from("claim_requests")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();
    if (pending) {
        redirect(`/claim/${slug}/success`);
    }

    return <ClaimPlansClient slug={slug} />;
}
