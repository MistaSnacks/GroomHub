import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, pacificDay } from "@/lib/admin-console/metrics";
import { reportPeriod } from "@/lib/owner-report";
import { listingSearchStats, searchConsoleConfigured, searchWindow, type PageSearchStats } from "@/lib/search-console";
import { countVisits, fetchRealVisits, listingEventKeys, shownOwnerMetrics, type OwnerMetric, type VisitEvent } from "@/lib/real-visits";

/** One block of the owner dashboard: a period and the metrics in it that reached MIN_SHOWN_COUNT. */
export interface StatsPeriod {
  label: string;
  metrics: OwnerMetric[];
}

interface Range {
  startDate: string;
  endDate: string;
}

const VISIT_TTL_MS = 5 * 60_000;
let visitMemo: { key: string; at: number; events: Promise<VisitEvent[]> } | null = null;

function cachedRealVisits(range: Range): Promise<VisitEvent[]> {
  const key = `${range.startDate}:${range.endDate}`;
  if (visitMemo && visitMemo.key === key && Date.now() - visitMemo.at < VISIT_TTL_MS) return visitMemo.events;
  const events = fetchRealVisits(createAdminClient(), range);
  visitMemo = { key, at: Date.now(), events };
  events.catch(() => {
    if (visitMemo?.events === events) visitMemo = null;
  });
  return events;
}

/** Search Console for one window, or null when it is not configured or fails. listingSearchStats() caches for 30 minutes. */
async function googleOrNull(range: Range): Promise<Map<string, PageSearchStats> | null> {
  if (!searchConsoleConfigured()) return null;
  try {
    return await listingSearchStats(range.startDate, range.endDate);
  } catch (err) {
    console.error(JSON.stringify({ scope: "owner_dashboard", event: "search_console_failed", message: err instanceof Error ? err.message : String(err) }));
    return null;
  }
}

/** The pure part: which metrics each period shows for one listing. */
export function statsPeriods(
  listing: { id: string; slug: string },
  events: VisitEvent[],
  windows: Array<{ label: string; visits: Range; google: Map<string, PageSearchStats> | null }>
): StatsPeriod[] {
  const keys = listingEventKeys(listing);
  return windows
    .map((w) => {
      const visits = countVisits(events, keys, w.visits);
      const g = w.google ? (w.google.get(listing.slug) ?? { impressions: 0, clicks: 0 }) : null;
      return {
        label: w.label,
        metrics: shownOwnerMetrics({ views: visits.views, taps: visits.taps.total, googleImpressions: g?.impressions ?? null, googleClicks: g?.clicks ?? null }),
      };
    })
    .filter((p) => p.metrics.length > 0);
}

/**
 * Per listing id: the last 30 days and the last calendar month, each with only the
 * metrics that qualify. An empty list means nothing qualifies yet. Never throws for
 * Search Console; a failed analytics read gives empty lists so the page still renders.
 */
export async function ownerDashboardStats(listings: Array<{ id: string; slug: string }>, now: Date = new Date()): Promise<Map<string, StatsPeriod[]>> {
  const out = new Map<string, StatsPeriod[]>();
  if (listings.length === 0) return out;
  const today = pacificDay(now);
  const last30: Range = { startDate: addDays(today, -29), endDate: today };
  const month = reportPeriod(now);

  const [events, google30, googleMonth] = await Promise.all([
    cachedRealVisits({ startDate: month.startDate, endDate: today }).catch((err: unknown) => {
      console.error(JSON.stringify({ scope: "owner_dashboard", event: "analytics_failed", message: err instanceof Error ? err.message : String(err) }));
      return [] as VisitEvent[];
    }),
    googleOrNull(searchWindow(today, 30)),
    googleOrNull(month),
  ]);

  const windows = [
    { label: "Last 30 days", visits: last30, google: google30 },
    { label: month.label, visits: month, google: googleMonth },
  ];
  for (const listing of listings) out.set(listing.id, statsPeriods(listing, events, windows));
  return out;
}
