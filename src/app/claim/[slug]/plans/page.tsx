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

    // If already claimed by THIS user, send them to success
    if (listing.owner_id === user.id) {
        redirect(`/claim/${slug}/success`);
    }

    // If claimed by someone else, show the groomer profile
    if (listing.owner_id) {
        redirect(`/groomer/${slug}`);
    }

    return <ClaimPlansClient slug={slug} />;
}
