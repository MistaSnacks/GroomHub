"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function processClaim(formData: FormData) {
    const slug = formData.get("slug") as string;
    const plan = formData.get("plan") as string;
    const isAnnual = formData.get("isAnnual") === "true";

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect(`/login?redirect=/claim/${slug}/plans`);
    }

    // Assign the listing to the current user
    const { error: updateError } = await supabase
        .from("business_listings")
        .update({
            owner_id: user.id,
            subscription_tier: plan as 'free' | 'standard' | 'featured' | 'premium'
        })
        .eq("slug", slug);

    if (updateError) {
        console.error("Failed to claim listing:", updateError);
        // Ideally redirect with an error param
        redirect(`/claim/${slug}/plans?error=Failed to claim listing`);
    }

    revalidatePath(`/groomer/${slug}`);
    revalidatePath("/dashboard");

    // Regardless of the plan, for now, we just redirect to the success page as this is a mock flow for checkouts
    redirect(`/claim/${slug}/success`);
}
