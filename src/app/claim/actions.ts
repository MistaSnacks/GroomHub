"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function processClaim(formData: FormData) {
    const slug = formData.get("slug") as string;

    if (!slug) {
        redirect(`/get-listed`);
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect(`/claim/${slug}`);
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: listing, error: fetchError } = await supabaseAdmin
        .from("business_listings")
        .select("owner_id")
        .eq("slug", slug)
        .single();

    if (fetchError || !listing) {
        console.error("Listing fetch failed");
        redirect(`/claim/${slug}/plans?error=not-found`);
    }

    if (listing.owner_id === user.id) {
        redirect(`/claim/${slug}/success`);
    }

    if (listing.owner_id) {
        redirect(`/claim/${slug}/plans?error=already-claimed`);
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from("business_listings")
        .update({
            owner_id: user.id,
            subscription_tier: "free",
            claimed_at: new Date().toISOString(),
        })
        .eq("slug", slug)
        .is("owner_id", null)
        .select("owner_id")
        .single();

    if (updateError || !updated) {
        console.error("Failed to claim listing");
        redirect(`/claim/${slug}/plans?error=claim-failed`);
    }

    revalidatePath(`/groomer/${slug}`);
    revalidatePath(`/claim/${slug}`);
    revalidatePath("/dashboard");

    redirect(`/claim/${slug}/success`);
}
