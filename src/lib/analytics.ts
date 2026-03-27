import { supabase } from "@/lib/supabase/client";

export async function logPageView(listingId: string) {
    try {
        await supabase.from("analytics_events").insert({
            event_type: "page_view",
            listing_id: listingId,
            url: window.location.href,
        });
    } catch (e) {
        console.error("Analytics error", e);
    }
}

export async function logClickAction(
    listingId: string,
    actionName: "website_click" | "directions_click" | "phone_click"
) {
    try {
        await supabase.from("analytics_events").insert({
            event_type: actionName,
            listing_id: listingId,
            url: window.location.href,
        });
    } catch (e) {
        console.error("Analytics error", e);
    }
}

export async function logSearch(query: string, location?: string, resultsCount?: number) {
    try {
        await supabase.from("search_logs").insert({
            query,
            location: location || null,
            results_count: resultsCount || null,
        });
    } catch (e) {
        console.error("Search logging error", e);
    }
}
