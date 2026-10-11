import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodFromString, reportPeriod } from "@/lib/owner-report";
import { gatherOwnerReports } from "@/lib/owner-report-data";
import { sendMonthlyReport } from "@/lib/owner-mail";

export const maxDuration = 120;

export const dynamic = "force-dynamic";

/** Ceiling per run, so switching reports on never sends a large batch at once. */
const MAX_PER_RUN = 50;

// Monthly Vercel cron (see vercel.json): on the 3rd at 18:00 UTC, an hour after the
// daily reminder run and once Search Console has the whole previous month, email
// each owner what their listing did. Does nothing unless OWNER_REPORTS_ENABLED=true.
//   ?dryRun=1          who would get a report and what it would say; sends nothing
//   ?period=YYYY-MM    report on another month (default: last month, Pacific)
//   ?only=<slug>       one listing only, for a test send
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const dryRun = params.get("dryRun") === "1";
  const enabled = process.env.OWNER_REPORTS_ENABLED === "true";
  if (!enabled && !dryRun) return NextResponse.json({ enabled: false });

  const periodParam = params.get("period");
  const period = periodParam ? periodFromString(periodParam) : reportPeriod();
  if (!period) return NextResponse.json({ error: "period must be YYYY-MM" }, { status: 400 });
  const only = params.get("only") ?? undefined;
  if (only && !/^[a-z0-9-]{1,140}$/.test(only)) return NextResponse.json({ error: "bad slug" }, { status: 400 });

  const db = createAdminClient();
  let batch;
  try {
    batch = await gatherOwnerReports(db, period, { only });
  } catch (err) {
    return fail("gather_failed", err instanceof Error ? err.message : String(err));
  }

  const due = batch.reports.filter((r) => r.decision.send);
  const summary = {
    enabled,
    dryRun,
    period: period.period,
    googleError: batch.googleError,
    owners: batch.reports.length,
    reports: batch.reports.map((r) => ({
      slug: r.listing.slug,
      send: r.decision.send,
      reason: r.decision.send ? undefined : r.decision.reason,
      views: r.stats.views,
      taps: r.stats.taps.total,
      googleImpressions: r.google?.impressions ?? null,
      topQuery: r.google?.queries[0]?.query ?? null,
      badge: r.badge?.host ?? null,
    })),
    deferred: Math.max(0, due.length - MAX_PER_RUN),
  };
  if (dryRun) return NextResponse.json(summary);

  // The Google number is the point of the email. Without it, send nothing and fail
  // loudly; rerun by hand once Search Console answers.
  if (batch.googleError) return fail("search_console_unavailable", batch.googleError);

  let sent = 0;
  let failed = 0;
  for (const r of due.slice(0, MAX_PER_RUN)) {
    const ok = await sendMonthlyReport(db, {
      listingId: r.listing.id,
      userId: r.listing.owner_id,
      to: r.ownerEmail!,
      period: period.period,
      report: r.email,
    });
    if (ok) sent++;
    else failed++;
  }
  return NextResponse.json({ ...summary, sent, failed }, { status: failed > 0 ? 500 : 200 });
}

function fail(event: string, message: string) {
  console.error(JSON.stringify({ scope: "owner_reports", event, message }));
  return NextResponse.json({ error: event, message }, { status: 500 });
}
