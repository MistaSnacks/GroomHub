import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTING_REDIRECTS } from "@/lib/listing-review";
import { crawlerHours, epochHour, pacificDay } from "@/lib/admin-console/metrics";

/**
 * The one rule for which analytics events count as a real visit. Owner-facing numbers
 * (the owner dashboard, the monthly report, the admin console's per-listing numbers)
 * all read events through realVisits(), so they never disagree.
 *
 * An event counts when:
 * - it carries a session id (the browser tracker sets one per tab; direct inserts and
 *   events from before the tracker had one do not),
 * - it did not come from a local dev server,
 * - its session did not view SESSION_CRAWL_LISTINGS or more different listings,
 * - it is not a page view inside a crawler hour (see crawlerHours()).
 *
 * Known bot user agents never write an event: the tracker checks isBotUserAgent()
 * (src/lib/bot-user-agent.ts) before it inserts, because the table does not store
 * the user agent.
 */

export interface VisitEvent {
  at: string;
  type: string;
  listingId: string | null;
  url: string | null;
  sessionId: string | null;
}

export const SESSION_CRAWL_LISTINGS = 15;

function isLocal(url: string | null): boolean {
  return !!url && (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1"));
}

export function realVisits(events: VisitEvent[]): VisitEvent[] {
  const tracked = events.filter((e) => e.sessionId && !isLocal(e.url));

  const listingsBySession = new Map<string, Set<string>>();
  for (const e of tracked) {
    if (e.type !== "page_view" || !e.listingId) continue;
    const seen = listingsBySession.get(e.sessionId!) ?? new Set<string>();
    seen.add(e.listingId);
    listingsBySession.set(e.sessionId!, seen);
  }
  const crawlerSessions = new Set([...listingsBySession].filter(([, seen]) => seen.size >= SESSION_CRAWL_LISTINGS).map(([id]) => id));
  const people = tracked.filter((e) => !crawlerSessions.has(e.sessionId!));

  const crawler = crawlerHours(people.filter((e) => e.type === "page_view"));
  return people.filter((e) => e.type !== "page_view" || !crawler.has(epochHour(e.at)));
}

/** Every value an event may carry for a listing: its id, its slug and old slugs that now redirect to it. */
export function listingEventKeys(listing: { id: string; slug: string }): Set<string> {
  const keys = new Set([listing.id, listing.slug]);
  for (const [from, to] of Object.entries(LISTING_REDIRECTS)) if (to === listing.slug) keys.add(from);
  return keys;
}

export interface VisitCounts {
  views: number;
  /** Views that arrived through the owner's website badge (?ref=badge). Included in `views`. */
  badgeClicks: number;
  taps: { website: number; phone: number; directions: number; total: number };
}

export function isBadgeVisit(url: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).searchParams.get("ref") === "badge";
  } catch {
    return false;
  }
}

/** Views and contact taps for one listing between two Pacific days, inclusive. Pass realVisits() output. */
export function countVisits(events: VisitEvent[], keys: Set<string>, range: { startDate: string; endDate: string }): VisitCounts {
  const counts: VisitCounts = { views: 0, badgeClicks: 0, taps: { website: 0, phone: 0, directions: 0, total: 0 } };
  for (const e of events) {
    if (!e.listingId || !keys.has(e.listingId)) continue;
    const day = pacificDay(e.at);
    if (day < range.startDate || day > range.endDate) continue;
    if (e.type === "page_view") {
      counts.views++;
      if (isBadgeVisit(e.url)) counts.badgeClicks++;
    } else if (e.type === "website_click") counts.taps.website++;
    else if (e.type === "phone_click") counts.taps.phone++;
    else if (e.type === "directions_click") counts.taps.directions++;
  }
  counts.taps.total = counts.taps.website + counts.taps.phone + counts.taps.directions;
  return counts;
}

const PAGE = 1000;

/**
 * Real visits on the whole site between two Pacific days, inclusive. Whole site,
 * because crawler hours and crawler sessions only show across listings. Server only
 * (needs the service-role client: analytics_events has no read policy).
 */
export async function fetchRealVisits(db: SupabaseClient, range: { startDate: string; endDate: string }): Promise<VisitEvent[]> {
  // Pad the UTC window by a day each side; countVisits() trims to Pacific days.
  const from = new Date(Date.parse(`${range.startDate}T00:00:00Z`) - 86_400_000).toISOString();
  const to = new Date(Date.parse(`${range.endDate}T00:00:00Z`) + 2 * 86_400_000).toISOString();
  const rows: VisitEvent[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db
      .from("analytics_events")
      .select("created_at, event_type, listing_id, url, session_id")
      .not("session_id", "is", null)
      .gte("created_at", from)
      .lt("created_at", to)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`analytics_events: ${error.message}`);
    for (const r of data ?? []) rows.push({ at: r.created_at, type: r.event_type, listingId: r.listing_id, url: r.url, sessionId: r.session_id });
    if (!data || data.length < PAGE) break;
  }
  return realVisits(rows);
}

/** The Pacific day of the first event with a session id, or null when the new tracker has logged nothing yet. */
export async function realVisitsCountedSince(db: SupabaseClient): Promise<string | null> {
  const { data, error } = await db
    .from("analytics_events")
    .select("created_at")
    .not("session_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`analytics_events: ${error.message}`);
  return data ? pacificDay(data.created_at as string) : null;
}

/**
 * Owner-facing surfaces (the owner dashboard, the monthly report, owner emails, public
 * copy) show a count only when it reaches this number for the period shown. Owner's
 * call, 2026-11-06: a groomer who sees "2 taps" does not buy in. The admin console
 * shows every number and does not use this.
 */
export const MIN_SHOWN_COUNT = 10;

export type OwnerMetricKey = "views" | "taps" | "googleImpressions" | "googleClicks";

export interface OwnerMetric {
  key: OwnerMetricKey;
  value: number;
}

export const OWNER_METRIC_LABELS: Record<OwnerMetricKey, { label: string; caption: string }> = {
  views: { label: "Profile views", caption: "Visits to your GroomLocal page" },
  taps: { label: "Contact taps", caption: "Calls, website and directions taps" },
  googleImpressions: { label: "Google impressions", caption: "Times your page showed in Google results" },
  googleClicks: { label: "Google clicks", caption: "Clicks from Google to your page" },
};

/**
 * The metrics an owner may see, in display order: only those at or above MIN_SHOWN_COUNT.
 * Google values are null when Search Console did not answer; they are then left out.
 */
export function shownOwnerMetrics(m: { views: number; taps: number; googleImpressions: number | null; googleClicks: number | null }): OwnerMetric[] {
  const all: OwnerMetric[] = [{ key: "views", value: m.views }, { key: "taps", value: m.taps }];
  if (m.googleImpressions !== null) all.push({ key: "googleImpressions", value: m.googleImpressions });
  if (m.googleClicks !== null) all.push({ key: "googleClicks", value: m.googleClicks });
  return all.filter((metric) => metric.value >= MIN_SHOWN_COUNT);
}
