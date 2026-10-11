import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTING_REDIRECTS, PUBLIC_EXCLUDED_SLUGS } from "@/lib/listing-review";
import { profileGaps, type ProfileGap } from "@/lib/profile-completeness";
import { crawlerHours } from "@/lib/admin-console/metrics";
import { listingSearchStats, searchConsoleConfigured, type PageSearchStats } from "@/lib/search-console";
import { monthStats, reportDecision, type MonthStats, type ReportDecision, type ReportEvent, type ReportPeriod } from "@/lib/owner-report";
import { OWNER_MAIL_LISTING_COLUMNS, type OwnerMailListing } from "@/lib/owner-mail";
import type { MonthlyReportInput } from "@/lib/email/owner-emails";

/**
 * Everything one month's owner reports need, read with the service-role client.
 * Shared by the monthly cron and the admin console preview so both show the same
 * numbers. Server only.
 */

export interface OwnerReportListing extends OwnerMailListing {
  owner_id: string;
  claimed_at: string | null;
}

export interface OwnerReport {
  listing: OwnerReportListing;
  ownerEmail: string | null;
  stats: MonthStats;
  google: PageSearchStats | null;
  badge: { host: string; lastSeen: string } | null;
  gaps: ProfileGap[];
  decision: ReportDecision;
  /** Ready for monthlyReportEmail(), minus the opt-out link the sender adds. */
  email: Omit<MonthlyReportInput, "optOutUrl">;
}

export interface OwnerReportBatch {
  period: ReportPeriod;
  /** Null when Search Console answered; otherwise why the Google numbers are missing. */
  googleError: string | null;
  reports: OwnerReport[];
}

/** Every value an analytics event may carry for a listing: its id, slug and redirected old slugs. */
function eventKeys(listing: { id: string; slug: string }): Set<string> {
  const keys = new Set([listing.id, listing.slug]);
  for (const [from, to] of Object.entries(LISTING_REDIRECTS)) if (to === listing.slug) keys.add(from);
  return keys;
}

async function periodEvents(db: SupabaseClient, period: ReportPeriod): Promise<ReportEvent[]> {
  // Pad the UTC window by a day each side; monthStats() trims to Pacific days.
  const from = new Date(`${period.startDate}T00:00:00Z`).getTime() - 86_400_000;
  const to = new Date(`${period.endDate}T00:00:00Z`).getTime() + 2 * 86_400_000;
  const rows: ReportEvent[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("analytics_events")
      .select("created_at, event_type, listing_id, url")
      .gte("created_at", new Date(from).toISOString())
      .lt("created_at", new Date(to).toISOString())
      .order("created_at", { ascending: true })
      .range(offset, offset + 999);
    if (error) throw new Error(`analytics_events: ${error.message}`);
    for (const r of data ?? []) rows.push({ at: r.created_at, type: r.event_type, listingId: r.listing_id, url: r.url });
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function gatherOwnerReports(db: SupabaseClient, period: ReportPeriod, opts: { only?: string } = {}): Promise<OwnerReportBatch> {
  let listingQuery = db.from("business_listings").select(`${OWNER_MAIL_LISTING_COLUMNS}, owner_id, claimed_at`).not("owner_id", "is", null).limit(1000);
  if (opts.only) listingQuery = listingQuery.eq("slug", opts.only);
  const { data: listingRows, error: listingError } = await listingQuery;
  if (listingError) throw new Error(`business_listings: ${listingError.message}`);
  const listings = ((listingRows ?? []) as unknown as OwnerReportListing[]).filter((l) => !PUBLIC_EXCLUDED_SLUGS.includes(l.slug));
  if (listings.length === 0) return { period, googleError: null, reports: [] };

  const ids = listings.map((l) => l.id);
  const ownerIds = [...new Set(listings.map((l) => l.owner_id))];

  const googlePromise: Promise<{ stats: Map<string, PageSearchStats> | null; error: string | null }> = searchConsoleConfigured()
    ? listingSearchStats(period.startDate, period.endDate).then(
        (stats) => ({ stats, error: null }),
        (err: unknown) => ({ stats: null, error: err instanceof Error ? err.message : String(err) })
      )
    : Promise.resolve({ stats: null, error: "Search Console is not configured (GSC_SITE_URL and GOOGLE_* variables)." });

  const [events, google, logs, optOuts, badges] = await Promise.all([
    periodEvents(db, period),
    googlePromise,
    db.from("owner_email_log").select("listing_id").eq("kind", "monthly_report").eq("period", period.period).in("listing_id", ids),
    db.from("owner_email_optouts").select("user_id").in("user_id", ownerIds),
    db.from("badge_installs").select("listing_id, host, last_seen").in("listing_id", ids).order("last_seen", { ascending: false }),
  ]);
  // Without the log or the opt-outs we cannot tell who may get an email.
  if (logs.error) throw new Error(`owner_email_log: ${logs.error.message}`);
  if (optOuts.error) throw new Error(`owner_email_optouts: ${optOuts.error.message}`);
  if (badges.error) throw new Error(`badge_installs: ${badges.error.message}`);

  const crawler = crawlerHours(
    events
      .filter((e) => e.type === "page_view" && !e.url?.startsWith("http://localhost") && !e.url?.startsWith("http://127.0.0.1"))
      .map((e) => ({ at: e.at, listingId: e.listingId }))
  );
  const sent = new Set((logs.data ?? []).map((r) => r.listing_id as string));
  const optedOut = new Set((optOuts.data ?? []).map((r) => r.user_id as string));
  const badgeByListing = new Map<string, { host: string; lastSeen: string }>();
  for (const b of badges.data ?? []) {
    if (!badgeByListing.has(b.listing_id as string)) badgeByListing.set(b.listing_id as string, { host: b.host as string, lastSeen: b.last_seen as string });
  }

  const emails = new Map<string, string | null>();
  await Promise.all(
    ownerIds.map(async (id) => {
      const { data } = await db.auth.admin.getUserById(id);
      emails.set(id, data?.user?.email ?? null);
    })
  );

  const reports = listings.map((listing): OwnerReport => {
    const stats = monthStats(events, eventKeys(listing), period, crawler);
    const g = google.stats ? (google.stats.get(listing.slug) ?? { impressions: 0, clicks: 0, position: 0, queries: [] }) : null;
    const badge = badgeByListing.get(listing.id) ?? null;
    const gaps = profileGaps(listing);
    const ownerEmail = emails.get(listing.owner_id) ?? null;
    return {
      listing,
      ownerEmail,
      stats,
      google: g,
      badge,
      gaps,
      decision: reportDecision({
        optedOut: optedOut.has(listing.owner_id),
        alreadySent: sent.has(listing.id),
        hasEmail: !!ownerEmail,
        stats,
        googleImpressions: g?.impressions ?? 0,
      }),
      email: {
        listingName: listing.name,
        slug: listing.slug,
        monthLabel: period.label,
        views: stats.views,
        taps: stats.taps,
        google: g ? { impressions: g.impressions, clicks: g.clicks, queries: g.queries } : null,
        badgeHost: badge?.host ?? null,
        badgeClicks: stats.badgeClicks,
        gaps,
      },
    };
  });

  return { period, googleError: google.error, reports };
}
