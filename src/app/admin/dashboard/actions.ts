"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export async function getUserSignups(days: number) {
    if (!(await requireAdmin())) {
        throw new Error("Unauthorized");
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createServiceClient(supabaseUrl, serviceKey);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);

    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const users = allUsers?.users || [];

    const currentUsers = users.filter(u => new Date(u.created_at) >= startDate);
    const prevUsers = users.filter(u => new Date(u.created_at) >= prevStartDate && new Date(u.created_at) < startDate);

    // Check which users have claimed listings
    const { data: claimedListings } = await supabase
        .from("business_listings")
        .select("owner_id, slug, claimed_at")
        .not("owner_id", "is", null);

    const claimedByUser = new Map<string, { slug: string; claimed_at: string }>();
    (claimedListings || []).forEach(l => {
        claimedByUser.set(l.owner_id, { slug: l.slug, claimed_at: l.claimed_at });
    });

    const recentSignups = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(u => ({
            email: u.email || "unknown",
            createdAt: u.created_at,
            lastSignIn: u.last_sign_in_at || null,
            claimedListing: claimedByUser.get(u.id)?.slug || null,
        }));

    const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return { trend: "up" as const, trendValue: curr > 0 ? "100" : "0" };
        const pct = ((curr - prev) / prev) * 100;
        return {
            trend: pct >= 0 ? "up" as const : "down" as const,
            trendValue: Math.abs(pct).toFixed(1),
        };
    };

    return {
        total: users.length,
        current: currentUsers.length,
        ...calcTrend(currentUsers.length, prevUsers.length),
        claimedCount: claimedListings?.length || 0,
        recentSignups,
    };
}

export async function getDashboardAnalytics(days: number) {
    if (!(await requireAdmin())) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);

    // Fetch analytics events
    const { data: events } = await supabase
        .from("analytics_events")
        .select("created_at, event_type")
        .gte("created_at", prevStartDate.toISOString())
        .order("created_at", { ascending: true });

    // Fetch search logs
    const { data: searchLogs } = await supabase
        .from("search_logs")
        .select("created_at, query")
        .gte("created_at", prevStartDate.toISOString());

    const currentEvents = (events || []).filter(e => new Date(e.created_at) >= startDate);
    const prevEvents = (events || []).filter(e => new Date(e.created_at) < startDate);

    const currentSearches = (searchLogs || []).filter(s => new Date(s.created_at) >= startDate);
    const prevSearches = (searchLogs || []).filter(s => new Date(s.created_at) < startDate);

    // Trend Data Grouping
    const trendMap = new Map<string, { website: number; directions: number; calls: number }>();

    // Initialize days
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i + 1); // shift by 1 to include up to today
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        trendMap.set(dateStr, { website: 0, directions: 0, calls: 0 });
    }

    let currentActionCount = 0;
    let prevActionCount = 0;
    let websiteCount = 0;
    let directionsCount = 0;
    let callsCount = 0;

    currentEvents.forEach(e => {
        const dateStr = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!trendMap.has(dateStr)) trendMap.set(dateStr, { website: 0, directions: 0, calls: 0 });

        const entry = trendMap.get(dateStr)!;

        if (e.event_type === "website_click") {
            entry.website++;
            websiteCount++;
            currentActionCount++;
        } else if (e.event_type === "directions_click") {
            entry.directions++;
            directionsCount++;
            currentActionCount++;
        } else if (e.event_type === "phone_click") {
            entry.calls++;
            callsCount++;
            currentActionCount++;
        }
    });

    prevEvents.forEach(e => {
        if (["website_click", "directions_click", "phone_click"].includes(e.event_type)) {
            prevActionCount++;
        }
    });

    const trendData = Array.from(trendMap.entries()).map(([date, counts]) => ({
        date,
        ...counts
    }));

    // Breakdown Data
    const breakdownData = [
        { name: "Website clicks", value: websiteCount, color: "#3B82F6" },
        { name: "Directions", value: directionsCount, color: "#14B8A6" },
        { name: "Phone calls", value: callsCount, color: "#F59E0B" },
    ];

    // Top Searches
    const searchCounts: Record<string, number> = {};
    currentSearches.forEach(s => {
        const term = s.query.toLowerCase().trim();
        searchCounts[term] = (searchCounts[term] || 0) + 1;
    });

    const topSearches = Object.entries(searchCounts)
        .map(([term, volume]) => ({ term, volume }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 4);

    // Calculate Search-to-Action
    // This is approximate (actions / searches). It cap at 100%. 
    const actionRate = currentSearches.length > 0
        ? Math.min(100, Math.round((currentActionCount / currentSearches.length) * 100))
        : 0;

    const searchRateData = [
        { name: "Clicked", value: actionRate, color: "#3B82F6" },
        { name: "Not Clicked", value: 100 - actionRate, color: "#E5E7EB" },
    ];

    // KPIs Note: Session isn't tracked yet, approximating with Impressions (page_views)
    const currentImpressions = currentEvents.filter(e => e.event_type === "page_view").length;
    const prevImpressions = prevEvents.filter(e => e.event_type === "page_view").length;

    const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return { trend: "up" as const, trendValue: "100" };
        const diff = curr - prev;
        const pct = (diff / prev) * 100;
        return {
            trend: pct >= 0 ? "up" as const : "down" as const,
            trendValue: Math.abs(pct).toFixed(1)
        };
    };

    const formatNumber = (num: number) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const kpis = {
        sessions: {
            value: formatNumber(currentImpressions), // proxy for sessions
            ...calcTrend(currentImpressions, prevImpressions)
        },
        leadActions: {
            value: currentActionCount.toLocaleString(),
            ...calcTrend(currentActionCount, prevActionCount)
        },
        searches: {
            value: formatNumber(currentSearches.length),
            ...calcTrend(currentSearches.length, prevSearches.length)
        },
        impressions: {
            value: formatNumber(currentImpressions),
            ...calcTrend(currentImpressions, prevImpressions)
        }
    };

    return {
        trendData,
        breakdownData,
        searchRateData,
        topSearches,
        kpis
    };
}
