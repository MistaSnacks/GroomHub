// Emails to listing owners after a claim is accepted (pure builders; sending lives in src/lib/owner-mail.ts).

import type { ProfileGap } from "@/lib/profile-completeness";
import { MAX_REMINDERS } from "@/lib/owner-reminders";
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
  views: number;
  taps: { website: number; phone: number; directions: number; total: number };
  /** Null when Search Console data is not available; the Google column is then left out. */
  google: { impressions: number; clicks: number; queries: { query: string; impressions: number }[] } | null;
  /** Where the owner's website badge was seen, if anywhere. */
  badgeHost: string | null;
  badgeClicks: number;
  gaps: ProfileGap[];
  optOutUrl?: string | null;
}

const BADGE_IMAGE = `${SITE}/badges/groomlocal-owner-confirmed.png`;

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

/** Three big numbers in a row. Tables, because email clients ignore flexbox. */
function statRow(cells: Array<{ value: number; label: string; caption: string }>): string {
  const width = Math.floor(100 / cells.length);
  const tds = cells
    .map(
      (c) =>
        `<td width="${width}%" style="padding:16px 8px;text-align:center;vertical-align:top;"><div style="font-size:30px;line-height:1.1;font-weight:800;color:${BRAND.ink};font-family:${BRAND.headingFont};">${c.value.toLocaleString("en-US")}</div><div style="margin-top:6px;font-size:14px;font-weight:700;color:${BRAND.ink};">${escapeHtml(c.label)}</div><div style="margin-top:2px;font-size:12px;line-height:1.4;color:${BRAND.muted};">${escapeHtml(c.caption)}</div></td>`
    )
    .join("");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:14px;margin:8px 0 24px 0;">
    <tr>${tds}</tr>
  </table>`;
}

function tapBreakdown(t: MonthlyReportInput["taps"]): string {
  const parts = [
    t.phone ? plural(t.phone, "call", "calls") : null,
    t.website ? plural(t.website, "website visit", "website visits") : null,
    t.directions ? plural(t.directions, "directions request", "directions requests") : null,
  ].filter(Boolean);
  return parts.join(", ");
}

export function monthlyReportSubject(input: Pick<MonthlyReportInput, "monthLabel" | "views" | "taps" | "google">): string {
  const impressions = input.google?.impressions ?? 0;
  if (impressions > 0 && impressions >= input.views) {
    return `Your GroomLocal listing showed up on Google ${plural(impressions, "time", "times")} in ${input.monthLabel}`;
  }
  if (input.views > 0) return `Your GroomLocal listing had ${plural(input.views, "view", "views")} in ${input.monthLabel}`;
  return `Your GroomLocal listing in ${input.monthLabel}`;
}

export function monthlyReportEmail(input: MonthlyReportInput): BuiltEmail {
  const { listingName, monthLabel, views, taps, google, badgeHost, badgeClicks, gaps, optOutUrl } = input;
  const dashboard = `${SITE}/dashboard`;
  const badgeUrl = `${SITE}/dashboard#badge`;

  // Only numbers above zero: a row of zeros reads as bad news. The cron never sends
  // a report where all three are zero, so at least one cell remains.
  const allCells = [
    { value: views, label: "Profile views", short: "profile views", caption: "Visits to your GroomLocal page" },
    { value: taps.total, label: "Contact taps", short: "contact taps", caption: "Calls, website and directions" },
    { value: google?.impressions ?? 0, label: "Google views", short: "Google views", caption: "Times your page showed in Google results" },
  ];
  const nonZero = allCells.filter((c) => c.value > 0);
  const cells = nonZero.length ? nonZero : allCells.slice(0, 1);

  const footer = `${views > 0 ? "Profile views count every visit to your page, including your own. " : ""}Reply to this email with any questions.`;

  const queries = (google?.queries ?? []).filter((q) => q.impressions > 0).slice(0, 3);
  const queryBlock = queries.length
    ? emailParagraph("People found your page by searching for:") +
      `<ul style="margin:0 0 20px 0;padding-left:20px;font-size:15px;line-height:1.7;color:${BRAND.body};">${queries
        .map((q) => `<li><strong style="color:${BRAND.ink};">${escapeHtml(q.query)}</strong> <span style="color:${BRAND.muted};">(${plural(q.impressions, "time", "times")})</span></li>`)
        .join("")}</ul>`
    : "";

  const tapsLine = taps.total > 0 ? emailParagraph(`Dog owners tapped to reach you ${plural(taps.total, "time", "times")}: ${escapeHtml(tapBreakdown(taps))}.`) : "";

  const badgeBlock = badgeHost
    ? emailParagraph(
        badgeClicks > 0
          ? `Your badge on <strong style="color:${BRAND.ink};">${escapeHtml(badgeHost)}</strong> sent ${plural(badgeClicks, "visitor", "visitors")} to your page. Thanks for linking to us.`
          : `Your badge is live on <strong style="color:${BRAND.ink};">${escapeHtml(badgeHost)}</strong>. Thanks for linking to us.`
      )
    : `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.border};border-radius:14px;margin:8px 0 24px 0;">
    <tr><td style="padding:18px 22px;">
      <p style="margin:0 0 10px 0;font-size:15px;font-weight:700;color:${BRAND.ink};">Add the Owner Confirmed badge to your website</p>
      <img src="${BADGE_IMAGE}" width="220" height="64" alt="Owner Confirmed on GroomLocal" style="display:block;width:220px;height:64px;margin:0 0 12px 0;">
      <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:${BRAND.body};">It links to your GroomLocal page, so customers can see your photos and hours and send you a message. It also helps more people find your page.</p>
      <a href="${badgeUrl}" style="font-size:14px;font-weight:700;color:${BRAND.tealDark};">Get your badge code</a>
    </td></tr>
  </table>`;

  const gapBlock = gaps.length
    ? emailParagraph("Still missing from your profile:") + gapChecklist(gaps)
    : "";

  const body =
    emailParagraph(`Here is how your GroomLocal listing did in ${escapeHtml(monthLabel)}.`) +
    statRow(cells) +
    tapsLine +
    queryBlock +
    badgeBlock +
    gapBlock;

  const html = renderBrandedEmail({
    preheader: `${listingName} on GroomLocal in ${monthLabel}: ${cells.map((c) => `${c.value.toLocaleString("en-US")} ${c.short}`).join(", ")}.`,
    heading: `${listingName} in ${monthLabel}`,
    body,
    cta: { label: "Open your dashboard", url: dashboard },
    footerNote: footer,
    unsubscribeUrl: optOutUrl ? escapeHtml(optOutUrl) : undefined,
  });

  const text = [
    `Here is how ${listingName} did on GroomLocal in ${monthLabel}.`,
    "",
    ...cells.map((c) => `${c.label}: ${c.value}${c.label === "Contact taps" ? ` (${tapBreakdown(taps)})` : c.label === "Google views" ? " (times your page showed in Google results)" : ""}`),
    ...(queries.length ? ["", "People found your page by searching for:", ...queries.map((q) => `- ${q.query} (${q.impressions})`)] : []),
    "",
    badgeHost
      ? `Your badge is live on ${badgeHost}.${badgeClicks ? ` It sent ${badgeClicks} visitors to your page.` : ""} Thanks for linking to us.`
      : `Add the Owner Confirmed badge to your website: ${badgeUrl}`,
    ...(gaps.length ? ["", "Still missing from your profile:", ...gapText(gaps)] : []),
    "",
    `Open your dashboard: ${dashboard}`,
    "",
    footer,
    ...(optOutUrl ? [`Stop monthly reports and reminders: ${optOutUrl}`] : []),
  ].join("\n");

  return { subject: monthlyReportSubject(input), html, text };
}
