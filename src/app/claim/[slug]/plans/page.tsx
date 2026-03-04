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

    // Auth gate: redirect to login if not authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?redirect=/claim/${slug}/plans`);
    }

    // Check listing exists and is unclaimed
    const listing = await getListingBySlug(slug);

    if (!listing) {
        redirect(`/dog-grooming`);
    }

    if (listing.owner_id) {
        redirect(`/groomer/${slug}`);
    }

    return <ClaimPlansClient slug={slug} />;
}
