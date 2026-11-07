import { supabase } from "@/lib/supabase/client";
import { isBotUserAgent } from "@/lib/bot-user-agent";

const SESSION_KEY = "gl_session";
let memorySession: string | null = null;

function newId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** One random id per browser tab, kept across pages in that tab. No cookie, nothing personal. */
function sessionId(): string {
    try {
        const existing = window.sessionStorage.getItem(SESSION_KEY);
        if (existing) return existing;
        const id = newId();
        window.sessionStorage.setItem(SESSION_KEY, id);
        return id;
    } catch {
        memorySession ??= newId();
        return memorySession;
    }
}

function isAutomatedBrowser(): boolean {
    return navigator.webdriver === true || isBotUserAgent(navigator.userAgent);
}

async function logEvent(eventType: string, listingId: string) {
    if (isAutomatedBrowser()) return;
    try {
        await supabase.from("analytics_events").insert({
            event_type: eventType,
            listing_id: listingId,
            url: window.location.href,
            session_id: sessionId(),
        });
    } catch (e) {
        console.error("Analytics error", e);
    }
}

export async function logPageView(listingId: string) {
    await logEvent("page_view", listingId);
}

export async function logClickAction(
    listingId: string,
    actionName: "website_click" | "directions_click" | "phone_click"
) {
    await logEvent(actionName, listingId);
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
