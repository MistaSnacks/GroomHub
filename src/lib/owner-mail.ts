import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { claimApprovedEmail, monthlyReportEmail, profileReminderEmail, type MonthlyReportInput } from "@/lib/email/owner-emails";
import { profileGaps, type ProfileFields } from "@/lib/profile-completeness";
import { optOutUrl, type OwnerEmailKind } from "@/lib/owner-reminders";

/** Columns needed to build either owner email. */
export const OWNER_MAIL_LISTING_COLUMNS = "id, slug, name, images, logo_url, description, services, specialties";

export interface OwnerMailListing extends ProfileFields {
  id: string;
  slug: string;
  name: string;
}

function log(event: string, fields: Record<string, unknown>) {
  console.error(JSON.stringify({ scope: "owner_mail", event, ...fields }));
}

async function recordSent(db: SupabaseClient, listingId: string, userId: string, kind: OwnerEmailKind, period?: string) {
  const { error } = await db.from("owner_email_log").insert({ listing_id: listingId, user_id: userId, kind, ...(period ? { period } : {}) });
  // The email already went out, so a failed log write means the next run could repeat it. Make that loud.
  if (error) log("log_insert_failed", { listingId, kind, code: error.code, message: error.message });
}

function unsubscribeHeaders(url: string | null): Record<string, string> | undefined {
  return url ? { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined;
}

/**
 * Sent when a claim is accepted, whether by an admin or by the domain-match rule.
 * Never throws: the claim has already been granted, so a mail problem must not undo it.
 */
export async function sendClaimApprovedEmail(
  db: SupabaseClient,
  opts: { listingId: string; userId: string; to: string }
): Promise<boolean> {
  try {
    const { data: listing, error } = await db
      .from("business_listings")
      .select(OWNER_MAIL_LISTING_COLUMNS)
      .eq("id", opts.listingId)
      .single();
    if (error || !listing) {
      log("approval_listing_fetch_failed", { listingId: opts.listingId, code: error?.code, message: error?.message });
      return false;
    }
    const l = listing as unknown as OwnerMailListing;
    const email = claimApprovedEmail({
      listingName: l.name,
      slug: l.slug,
      gaps: profileGaps(l),
      optOutUrl: optOutUrl(opts.userId),
    });
    const result = await sendEmail({
      site: "claim_decision",
      to: opts.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      context: { slug: l.slug, kind: "claim_approved" },
    });
    if (result.ok) await recordSent(db, l.id, opts.userId, "claim_approved");
    return result.ok;
  } catch (err) {
    log("approval_send_threw", { listingId: opts.listingId, message: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

/** One reminder in the series. The caller has already decided it is due. */
export async function sendProfileReminder(
  db: SupabaseClient,
  opts: { listing: OwnerMailListing; userId: string; to: string; sequence: number }
): Promise<boolean> {
  const { listing, userId, to, sequence } = opts;
  const gaps = profileGaps(listing);
  if (gaps.length === 0) return false;
  const unsubscribe = optOutUrl(userId);
  const email = profileReminderEmail({
    listingName: listing.name,
    slug: listing.slug,
    gaps,
    sequence,
    optOutUrl: unsubscribe,
  });
  const result = await sendEmail({
    site: "profile_reminder",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    headers: unsubscribeHeaders(unsubscribe),
    context: { slug: listing.slug, kind: "profile_reminder", sequence },
  });
  if (result.ok) await recordSent(db, listing.id, userId, "profile_reminder");
  return result.ok;
}

/** One monthly report. The caller has already decided it should go out. */
export async function sendMonthlyReport(
  db: SupabaseClient,
  opts: { listingId: string; userId: string; to: string; period: string; report: Omit<MonthlyReportInput, "optOutUrl"> }
): Promise<boolean> {
  const unsubscribe = optOutUrl(opts.userId);
  const email = monthlyReportEmail({ ...opts.report, optOutUrl: unsubscribe });
  const result = await sendEmail({
    site: "monthly_report",
    to: opts.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    headers: unsubscribeHeaders(unsubscribe),
    context: { slug: opts.report.slug, kind: "monthly_report", period: opts.period },
  });
  if (result.ok) await recordSent(db, opts.listingId, opts.userId, "monthly_report", opts.period);
  return result.ok;
}
