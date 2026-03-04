"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function processClaim(formData: FormData) {
    const slug = formData.get("slug") as string;
    const plan = (formData.get("plan") as string) || "free";

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect(`/login?redirect=/claim/${slug}/plans`);
    }

    // Check listing exists and is unclaimed
    const { data: listing } = await supabase
        .from("business_listings")
        .select("owner_id")
        .eq("slug", slug)
        .single();

    if (!listing) {
        redirect(`/claim/${slug}/plans?error=Listing not found`);
    }

    if (listing.owner_id) {
        redirect(`/claim/${slug}/plans?error=already-claimed`);
    }

    // Validate tier
    const validTiers = ["free", "standard", "featured", "premium"] as const;
    const tier = validTiers.includes(plan as typeof validTiers[number])
        ? plan
        : "free";

    // Claim it — apply selected tier directly (no Stripe integration yet)
    const { error: updateError } = await supabase
        .from("business_listings")
        .update({
            owner_id: user.id,
            subscription_tier: tier,
            claimed_at: new Date().toISOString(),
        })
        .eq("slug", slug)
        .is("owner_id", null); // Atomic DB-level guard against race conditions

    if (updateError) {
        console.error("Failed to claim listing:", updateError);
        redirect(`/claim/${slug}/plans?error=Failed to claim listing`);
    }

    revalidatePath(`/groomer/${slug}`);
    revalidatePath("/dashboard");

    redirect(`/claim/${slug}/success`);
}
