// Emails to listing owners after a claim is accepted (pure builders; sending lives in src/lib/owner-mail.ts).

import type { ProfileGap } from "@/lib/profile-completeness";
import { MAX_REMINDERS } from "@/lib/owner-reminders";
import { OWNER_METRIC_LABELS, type OwnerMetric, type OwnerMetricKey } from "@/lib/real-visits";
import { BRAND, emailParagraph, escapeHtml, renderBrandedEmail } from "@/lib/email/template";

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const SITE = BRAND.site;

export function editUrl(slug: string): string {
  return `${SITE}/dashboard/listing/${encodeURIComponent(slug)}`;
}

/** A cream card listing what is still missing, one row per gap. */
function gapChecklist(gaps: ProfileGap[]): string {
  const rows = gaps
    .map(
      (g) =>
        `<tr><td style="padding:6px 0;vertical-align:top;width:28px;font-size:18px;color:${BRAND.coral};">&#9744;</td><td style="padding:6px 0;"><div style="font-size:15px;font-weight:700;color:${BRAND.ink};">${escapeHtml(g.label)}</div><div style="font-size:14px;line-height:1.5;color:${BRAND.body};">${escapeHtml(g.hint)}</div></td></tr>`
    )
    .join("");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:14px;margin:8px 0 24px 0;">
    <tr><td style="padding:16px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
    </td></tr>
  </table>`;
}

function gapText(gaps: ProfileGap[]): string[] {
  return gaps.map((g) => `- ${g.label}: ${g.hint}`);
}

export function claimApprovedEmail(opts: {
  listingName: string;
  slug: string;
  gaps: ProfileGap[];
  /** Signed opt-out link for the follow-up reminders; omitted when no signing secret is configured. */
  optOutUrl?: string | null;
}): BuiltEmail {
  const { listingName, slug, gaps, optOutUrl } = opts;
  const complete = gaps.length === 0;
  const url = complete ? `${SITE}/dashboard` : editUrl(slug);

  const body =
    emailParagraph(
      `Your claim for <strong style="color:${BRAND.ink};">${escapeHtml(listingName)}</strong> is verified. You can now edit your listing, add photos and read messages from dog owners.`
    ) +
    (complete
      ? emailParagraph("Your profile already has photos, a description and your services filled in. Nice work.")
      : emailParagraph("Your profile is still missing a few things that dog owners look at when they pick a groomer:") +
        gapChecklist(gaps));

  const footerNote = complete
    ? "Reply to this email if you get stuck."
    : optOutUrl
      ? `If some of this stays unfinished we will send up to ${MAX_REMINDERS} short reminders. <a href="${escapeHtml(optOutUrl)}" style="color:${BRAND.tealDark};">Turn them off</a> any time, or reply to this email if you get stuck.`
      : "Reply to this email if you get stuck.";

  const html = renderBrandedEmail({
    preheader: complete ? `You can now manage ${listingName}.` : `You can now edit ${listingName}. A few things are still missing.`,
    heading: `${listingName} is yours on GroomLocal`,
    body,
    cta: { label: complete ? "Open your dashboard" : "Finish your profile", url },
    footerNote,
  });

  const text = [
    `Your claim for ${listingName} is verified. You can now edit your listing, add photos and read messages from dog owners.`,
    "",
    ...(complete
      ? ["Your profile already has photos, a description and your services filled in. Nice work."]
      : ["Your profile is still missing a few things that dog owners look at when they pick a groomer:", ...gapText(gaps)]),
    "",
    `${complete ? "Open your dashboard" : "Finish your profile"}: ${url}`,
    "",
    ...(!complete && optOutUrl
      ? [`If some of this stays unfinished we will send up to ${MAX_REMINDERS} short reminders. Turn them off: ${optOutUrl}`]
      : []),
    "Reply to this email if you get stuck.",
  ].join("\n");

  return { subject: `Your GroomLocal claim for ${listingName} is approved`, html, text };
}

export function profileReminderEmail(opts: {
  listingName: string;
  slug: string;
  gaps: ProfileGap[];
  /** 1-based position in the reminder series; the last one says so. */
  sequence: number;
  optOutUrl?: string | null;
}): BuiltEmail {
  const { listingName, slug, gaps, sequence, optOutUrl } = opts;
  const last = sequence >= MAX_REMINDERS;
  const url = editUrl(slug);

  const body =
    emailParagraph(
      `Your listing for <strong style="color:${BRAND.ink};">${escapeHtml(listingName)}</strong> is live on GroomLocal, but it is still missing:`
    ) +
    gapChecklist(gaps) +
    emailParagraph("These are the parts dog owners read when they compare groomers.") +
    (last ? emailParagraph("This is the last reminder we will send.") : "");

  const html = renderBrandedEmail({
    preheader: `${gaps.length} ${gaps.length === 1 ? "thing" : "things"} left on your GroomLocal profile.`,
    heading: "A few things left on your profile",
    body,
    cta: { label: "Finish your profile", url },
    footerNote: "Reply to this email if you get stuck.",
    unsubscribeUrl: optOutUrl ? escapeHtml(optOutUrl) : undefined,
  });

  const text = [
    `Your listing for ${listingName} is live on GroomLocal, but it is still missing:`,
    "",
    ...gapText(gaps),
    "",
    "These are the parts dog owners read when they compare groomers.",
    ...(last ? ["", "This is the last reminder we will send."] : []),
    "",
    `Finish your profile: ${url}`,
    "",
    "Reply to this email if you get stuck.",
    ...(optOutUrl ? [`Stop these reminders: ${optOutUrl}`] : []),
  ].join("\n");

  return {
    subject: last ? `Last reminder: finish your ${listingName} profile` : `Finish your ${listingName} profile on GroomLocal`,
    html,
    text,
  };
}

export interface MonthlyReportInput {
  listingName: string;
  slug: string;
  /** "September" */
  monthLabel: string;
  /** First Pacific day counted, when real-visit tracking began inside the month; null when the whole month counted. */
  countedFrom: string | null;
  /** Only the metrics that reached MIN_SHOWN_COUNT (shownOwnerMetrics()). The cron sends nothing when this is empty. */
  metrics: OwnerMetric[];
  /** Top Google searches for the page. Only filled when Google impressions are among `metrics`. */
  searches: string[];
  /** Where the owner's website badge was seen, if anywhere. */
  badgeHost: string | null;
  gaps: ProfileGap[];
  optOutUrl?: string | null;
}

const SUBJECT_PHRASE: Record<OwnerMetricKey, (n: string) => string> = {
  googleImpressions: (n) => `showed up on Google ${n} times`,
  views: (n) => `had ${n} profile views`,
  taps: (n) => `got ${n} contact taps`,
  googleClicks: (n) => `got ${n} clicks from Google`,
};

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

/** Big numbers in a row. Tables, because email clients ignore flexbox. */
function statRow(metrics: OwnerMetric[]): string {
  const width = Math.floor(100 / metrics.length);
  const tds = metrics
    .map((m) => {
      const { label, caption } = OWNER_METRIC_LABELS[m.key];
      return `<td width="${width}%" style="padding:16px 8px;text-align:center;vertical-align:top;"><div style="font-size:30px;line-height:1.1;font-weight:800;color:${BRAND.ink};font-family:${BRAND.headingFont};">${m.value.toLocaleString("en-US")}</div><div style="margin-top:6px;font-size:14px;font-weight:700;color:${BRAND.ink};">${escapeHtml(label)}</div><div style="margin-top:2px;font-size:12px;line-height:1.4;color:${BRAND.muted};">${escapeHtml(caption)}</div></td>`;
    })
    .join("");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:14px;margin:8px 0 24px 0;">
    <tr>${tds}</tr>
  </table>`;
}

/** The subject leads with the biggest metric shown. */
export function monthlyReportSubject(input: Pick<MonthlyReportInput, "monthLabel" | "metrics">): string {
  const top = [...input.metrics].sort((a, b) => b.value - a.value)[0];
  if (!top) return `Your GroomLocal listing in ${input.monthLabel}`;
  return `Your GroomLocal listing ${SUBJECT_PHRASE[top.key](top.value.toLocaleString("en-US"))} in ${input.monthLabel}`;
}

export function monthlyReportEmail(input: MonthlyReportInput): BuiltEmail {
  const { listingName, monthLabel, countedFrom, metrics, searches, badgeHost, gaps, optOutUrl } = input;
  const dashboard = `${SITE}/dashboard`;
  const hasViews = metrics.some((m) => m.key === "views");
  const hasVisits = hasViews || metrics.some((m) => m.key === "taps");

  const countedNote = countedFrom && hasVisits
    ? `Visits are counted from ${dayLabel.format(new Date(`${countedFrom}T12:00:00Z`))}, when we started to filter out bots. `
    : "";
  const footer = `${countedNote}${hasViews ? "Profile views leave out known bots but include your own visits. " : ""}Reply to this email with any questions.`;

  const top = searches.slice(0, 3);
  const searchBlock = top.length
    ? emailParagraph("Your page showed in Google for searches like:") +
      `<ul style="margin:0 0 20px 0;padding-left:20px;font-size:15px;line-height:1.7;color:${BRAND.body};">${top
        .map((q) => `<li><strong style="color:${BRAND.ink};">${escapeHtml(q)}</strong></li>`)
        .join("")}</ul>`
    : "";

  const badgeBlock = badgeHost
    ? emailParagraph(`Your badge is live on <strong style="color:${BRAND.ink};">${escapeHtml(badgeHost)}</strong>. Thanks for linking to us.`)
    : "";

  const gapBlock = gaps.length ? emailParagraph("Still missing from your profile:") + gapChecklist(gaps) : "";

  const body =
    emailParagraph(`Here is how your GroomLocal listing did in ${escapeHtml(monthLabel)}.`) +
    statRow(metrics) +
    searchBlock +
    badgeBlock +
    gapBlock;

  const html = renderBrandedEmail({
    preheader: `${listingName} on GroomLocal in ${monthLabel}: ${metrics.map((m) => `${m.value.toLocaleString("en-US")} ${OWNER_METRIC_LABELS[m.key].label.toLowerCase()}`).join(", ")}.`,
    heading: `${listingName} in ${monthLabel}`,
    body,
    cta: { label: "Open your dashboard", url: dashboard },
    footerNote: footer,
    unsubscribeUrl: optOutUrl ? escapeHtml(optOutUrl) : undefined,
  });

  const text = [
    `Here is how ${listingName} did on GroomLocal in ${monthLabel}.`,
    "",
    ...metrics.map((m) => `${OWNER_METRIC_LABELS[m.key].label}: ${m.value.toLocaleString("en-US")} (${lowerFirst(OWNER_METRIC_LABELS[m.key].caption)})`),
    ...(top.length ? ["", "Your page showed in Google for searches like:", ...top.map((q) => `- ${q}`)] : []),
    ...(badgeHost ? ["", `Your badge is live on ${badgeHost}. Thanks for linking to us.`] : []),
    ...(gaps.length ? ["", "Still missing from your profile:", ...gapText(gaps)] : []),
    "",
    `Open your dashboard: ${dashboard}`,
    "",
    footer,
    ...(optOutUrl ? [`Stop monthly reports and reminders: ${optOutUrl}`] : []),
  ].join("\n");

  return { subject: monthlyReportSubject(input), html, text };
}
