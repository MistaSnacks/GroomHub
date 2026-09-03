import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingBySlug } from "@/lib/supabase/queries";
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

    return <ClaimPlansClient slug={slug} />;
}
