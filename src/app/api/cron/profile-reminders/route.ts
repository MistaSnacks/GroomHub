import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PUBLIC_EXCLUDED_SLUGS } from "@/lib/listing-review";
import { profileGaps } from "@/lib/profile-completeness";
import { reminderDecision, type OwnerEmailEvent } from "@/lib/owner-reminders";
import { OWNER_MAIL_LISTING_COLUMNS, sendProfileReminder, type OwnerMailListing } from "@/lib/owner-mail";

export const maxDuration = 60;

export const dynamic = "force-dynamic";

/** Ceiling per run, so switching reminders on never sends a large backlog at once. */
const MAX_PER_RUN = 25;

interface ClaimedListing extends OwnerMailListing {
  owner_id: string;
  claimed_at: string | null;
}

// Daily Vercel cron (see vercel.json). Reminds owners of claimed listings whose
// profile is still thin. Does nothing unless PROFILE_REMINDERS_ENABLED=true.
// Add ?dryRun=1 to see who would be emailed without sending or logging anything.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const enabled = process.env.PROFILE_REMINDERS_ENABLED === "true";
  if (!enabled && !dryRun) return NextResponse.json({ enabled: false });

  const db = createAdminClient();
  const { data: rows, error } = await db
    .from("business_listings")
    .select(`${OWNER_MAIL_LISTING_COLUMNS}, owner_id, claimed_at`)
    .not("owner_id", "is", null)
    .limit(1000);
  if (error) return fail("listing_query_failed", error.message);

  const claimed = ((rows ?? []) as unknown as ClaimedListing[]).filter((l) => !PUBLIC_EXCLUDED_SLUGS.includes(l.slug));
  const withGaps = claimed.filter((l) => profileGaps(l).length > 0);
  if (withGaps.length === 0) return NextResponse.json({ enabled, dryRun, claimed: claimed.length, incomplete: 0, due: [], sent: 0, failed: 0 });

  const listingIds = withGaps.map((l) => l.id);
  const ownerIds = [...new Set(withGaps.map((l) => l.owner_id))];
  const [{ data: logRows, error: logError }, { data: optOuts, error: optOutError }] = await Promise.all([
    db.from("owner_email_log").select("listing_id, kind, sent_at").in("listing_id", listingIds),
    db.from("owner_email_optouts").select("user_id").in("user_id", ownerIds),
  ]);
  // Without the log or the opt-outs we cannot tell who is due, so send nothing.
  if (logError) return fail("log_query_failed", logError.message);
  if (optOutError) return fail("optout_query_failed", optOutError.message);

  const eventsByListing = new Map<string, OwnerEmailEvent[]>();
  for (const r of logRows ?? []) {
    const list = eventsByListing.get(r.listing_id as string) ?? [];
    list.push({ kind: r.kind as OwnerEmailEvent["kind"], sent_at: r.sent_at as string });
    eventsByListing.set(r.listing_id as string, list);
  }
  const optedOut = new Set((optOuts ?? []).map((o) => o.user_id as string));

  const due: Array<{ listing: ClaimedListing; sequence: number }> = [];
  for (const listing of withGaps) {
    if (optedOut.has(listing.owner_id)) continue;
    const decision = reminderDecision({ claimedAt: listing.claimed_at, events: eventsByListing.get(listing.id) ?? [] });
    if (decision.due) due.push({ listing, sequence: decision.sequence });
  }
  const batch = due.slice(0, MAX_PER_RUN);

  const summary = {
    enabled,
    dryRun,
    claimed: claimed.length,
    incomplete: withGaps.length,
    due: batch.map((d) => ({ slug: d.listing.slug, sequence: d.sequence, gaps: profileGaps(d.listing).map((g) => g.key) })),
    deferred: due.length - batch.length,
  };
  if (dryRun) return NextResponse.json(summary);

  let sent = 0;
  let failed = 0;
  for (const { listing, sequence } of batch) {
    const { data: userData, error: userError } = await db.auth.admin.getUserById(listing.owner_id);
    const to = userData?.user?.email;
    if (userError || !to) {
      failed++;
      console.error(JSON.stringify({ scope: "profile_reminders", event: "owner_email_missing", slug: listing.slug, message: userError?.message }));
      continue;
    }
    const ok = await sendProfileReminder(db, { listing, userId: listing.owner_id, to, sequence });
    if (ok) sent++;
    else failed++;
  }
  // Non-200 on any failure so Vercel's cron log shows it.
  return NextResponse.json({ ...summary, sent, failed }, { status: failed > 0 ? 500 : 200 });
}

function fail(event: string, message: string) {
  console.error(JSON.stringify({ scope: "profile_reminders", event, message }));
  return NextResponse.json({ error: event }, { status: 500 });
}
