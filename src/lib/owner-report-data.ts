import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_EXCLUDED_SLUGS } from "@/lib/listing-review";
import { profileGaps, type ProfileGap } from "@/lib/profile-completeness";
import { countVisits, fetchRealVisits, listingEventKeys, realVisitsCountedSince, shownOwnerMetrics, type VisitCounts } from "@/lib/real-visits";
import { listingSearchStats, searchConsoleConfigured, type PageSearchStats } from "@/lib/search-console";
import { reportDecision, type ReportDecision, type ReportPeriod } from "@/lib/owner-report";
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
  stats: VisitCounts;
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
  /** First Pacific day with real-visit tracking, when that falls inside the period; null when the whole month counted. */
  countedFrom: string | null;
  reports: OwnerReport[];
}

export async function gatherOwnerReports(db: SupabaseClient, period: ReportPeriod, opts: { only?: string } = {}): Promise<OwnerReportBatch> {
  let listingQuery = db.from("business_listings").select(`${OWNER_MAIL_LISTING_COLUMNS}, owner_id, claimed_at`).not("owner_id", "is", null).limit(1000);
  if (opts.only) listingQuery = listingQuery.eq("slug", opts.only);
  const { data: listingRows, error: listingError } = await listingQuery;
  if (listingError) throw new Error(`business_listings: ${listingError.message}`);
  const listings = ((listingRows ?? []) as unknown as OwnerReportListing[]).filter((l) => !PUBLIC_EXCLUDED_SLUGS.includes(l.slug));
  if (listings.length === 0) return { period, googleError: null, countedFrom: null, reports: [] };

  const ids = listings.map((l) => l.id);
  const ownerIds = [...new Set(listings.map((l) => l.owner_id))];

  const googlePromise: Promise<{ stats: Map<string, PageSearchStats> | null; error: string | null }> = searchConsoleConfigured()
    ? listingSearchStats(period.startDate, period.endDate).then(
        (stats) => ({ stats, error: null }),
        (err: unknown) => ({ stats: null, error: err instanceof Error ? err.message : String(err) })
      )
    : Promise.resolve({ stats: null, error: "Search Console is not configured (GSC_SITE_URL and GOOGLE_* variables)." });

  const [events, countedSince, google, logs, optOuts, badges] = await Promise.all([
    fetchRealVisits(db, period),
    realVisitsCountedSince(db),
    googlePromise,
    db.from("owner_email_log").select("listing_id").eq("kind", "monthly_report").eq("period", period.period).in("listing_id", ids),
    db.from("owner_email_optouts").select("user_id").in("user_id", ownerIds),
    db.from("badge_installs").select("listing_id, host, last_seen").in("listing_id", ids).order("last_seen", { ascending: false }),
  ]);
  // Without the log or the opt-outs we cannot tell who may get an email.
  if (logs.error) throw new Error(`owner_email_log: ${logs.error.message}`);
  if (optOuts.error) throw new Error(`owner_email_optouts: ${optOuts.error.message}`);
  if (badges.error) throw new Error(`badge_installs: ${badges.error.message}`);

  // Real visits are only counted from the day the session tracker went live.
  const countedFrom = countedSince && countedSince > period.startDate ? countedSince : null;
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
    const stats = countVisits(events, listingEventKeys(listing), period);
    const g = google.stats ? (google.stats.get(listing.slug) ?? { impressions: 0, clicks: 0, position: 0, queries: [] }) : null;
    const badge = badgeByListing.get(listing.id) ?? null;
    const gaps = profileGaps(listing);
    const ownerEmail = emails.get(listing.owner_id) ?? null;
    const shown = shownOwnerMetrics({ views: stats.views, taps: stats.taps.total, googleImpressions: g?.impressions ?? null, googleClicks: g?.clicks ?? null });
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
        shown,
      }),
      email: {
        listingName: listing.name,
        slug: listing.slug,
        monthLabel: period.label,
        countedFrom,
        metrics: shown,
        searches: shown.some((m) => m.key === "googleImpressions") ? (g?.queries ?? []).map((q) => q.query) : [],
        badgeHost: badge?.host ?? null,
        gaps,
      },
    };
  });

  return { period, googleError: google.error, countedFrom, reports };
}
