"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function processClaim(formData: FormData) {
    const slug = formData.get("slug") as string;
    const plan = (formData.get("plan") as string) || "free";

    if (!slug) {
        redirect(`/get-listed`);
    }

    // Auth check via session client
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        // Redirect to claim step 1 (which has the auth form), not /login
        redirect(`/claim/${slug}`);
    }

    // Use service role client for the claim write
    // (anon key can't update rows where owner_id IS NULL due to RLS)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check listing exists and is unclaimed
    const { data: listing, error: fetchError } = await supabaseAdmin
        .from("business_listings")
        .select("owner_id")
        .eq("slug", slug)
        .single();

    console.log("Claim attempt:", { slug, plan, userId: user.id, listing, fetchError });

    if (fetchError || !listing) {
        console.error("Listing fetch failed:", fetchError);
        redirect(`/claim/${slug}/plans?error=${encodeURIComponent(fetchError?.message || "Listing not found")}`);
    }

    // If already claimed by THIS user, just send them to success
    if (listing.owner_id === user.id) {
        redirect(`/claim/${slug}/success`);
    }

    // If claimed by someone else, show error
    if (listing.owner_id) {
        redirect(`/claim/${slug}/plans?error=already-claimed`);
    }

    // Validate tier
    const validTiers = ["free", "standard", "featured", "premium"] as const;
    const tier = validTiers.includes(plan as typeof validTiers[number])
        ? plan
        : "free";

    // Claim it with .select() so we can verify the update actually took effect
    const { data: updated, error: updateError } = await supabaseAdmin
        .from("business_listings")
        .update({
            owner_id: user.id,
            subscription_tier: tier,
            claimed_at: new Date().toISOString(),
        })
        .eq("slug", slug)
        .is("owner_id", null)
        .select("owner_id")
        .single();

    if (updateError || !updated) {
        console.error("Failed to claim listing:", JSON.stringify(updateError, null, 2));
        console.error("Slug:", slug, "User ID:", user.id, "Tier:", tier);
        // Most likely cause: someone else claimed it between the check and update
        redirect(`/claim/${slug}/plans?error=${encodeURIComponent(updateError?.message || "Could not claim this listing. It may have just been claimed by someone else.")}`);
    }

    revalidatePath(`/groomer/${slug}`);
    revalidatePath(`/claim/${slug}`);
    revalidatePath("/dashboard");

    redirect(`/claim/${slug}/success`);
}
