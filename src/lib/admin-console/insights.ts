import type { AdminListing, Core, OwnerRecord } from "./data";
import type { OutreachData, OutreachSnapshot } from "./outreach";
import type { DnsCheck, SearchConsoleReport } from "./checks";
import { FREE_PROMO_ENDS_AT } from "@/lib/listing-rules";
import { MIN_PHOTOS } from "@/lib/profile-completeness";
import { addDays, pacificDay, pacificTime } from "./metrics";

/**
 * Derived views shared by several console pages (pure; no I/O): the "needs you"
 * queue, the activity feed, and the join between the outreach list and listings.
 */

export type ContactStatus = "sent" | "bounced" | "no_email" | "researched";

export interface ContactInfo {
  status: ContactStatus;
  sent: string | null;
  campaign: string | null;
  email: string | null;
}

/** Outreach state per listing slug. A listing emailed twice keeps the earliest send. */
export function contactIndex(data: OutreachData | null): Map<string, ContactInfo> {
  const out = new Map<string, ContactInfo>();
  if (!data) return out;
  for (const slug of data.researchedNoEmail) out.set(slug, { status: "researched", sent: null, campaign: null, email: null });
  for (const slug of data.manualNoEmail) out.set(slug, { status: "no_email", sent: null, campaign: null, email: null });
  for (const c of [...data.contacted].sort((a, b) => a.sent.localeCompare(b.sent))) {
    const existing = out.get(c.slug);
    if (existing?.sent) {
      if (c.bounced) continue;
      if (existing.status === "bounced") out.set(c.slug, { status: "sent", sent: existing.sent, campaign: existing.campaign, email: c.email });
      continue;
    }
    out.set(c.slug, { status: c.bounced ? "bounced" : "sent", sent: c.sent, campaign: c.campaign, email: c.email });
  }
  return out;
}

/** Owners who are not the operator: not the house listing and not one of the operator's own accounts. */
export function externalOwners(owners: OwnerRecord[]): OwnerRecord[] {
  return owners.filter((o) => !o.house && !o.user?.internal);
}

export interface Task {
  id: string;
  tone: "fail" | "warn" | "info";
  title: string;
  detail: string;
  href: string;
  cta: string;
}

const TONE_ORDER = { fail: 0, warn: 1, info: 2 } as const;

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

function names(list: string[], max = 3): string {
  if (list.length <= max) return list.join(", ");
  return `${list.slice(0, max).join(", ")} and ${list.length - max} more`;
}

export function buildTasks(input: {
  core: Core;
  owners: OwnerRecord[];
  outreach: OutreachSnapshot;
  contacts: Map<string, ContactInfo>;
  dns: DnsCheck[];
  gsc: SearchConsoleReport;
  /** Listing id -> views in the last 30 days (crawler days left out). */
  views30: Map<string, number>;
}): Task[] {
  const { core, owners, outreach, contacts, dns, gsc, views30 } = input;
  const tasks: Task[] = [];

  const pending = core.claims.filter((c) => c.status === "pending");
  if (pending.length) {
    tasks.push({
      id: "claims",
      tone: "warn",
      title: `${plural(pending.length, "claim")} waiting for review`,
      detail: `Held because the email looked unrelated to the business: ${names(pending.map((c) => core.listingByKey.get(c.listingId)?.name ?? c.listingSlug))}.`,
      href: "/admin/dashboard/claims",
      cta: "Review",
    });
  }

  const unsentQuotes = core.quotes.filter((q) => !q.notifiedAt);
  const unsentLeads = core.leads.filter((l) => !l.notifiedAt);
  if (unsentQuotes.length + unsentLeads.length) {
    tasks.push({
      id: "unsent",
      tone: "fail",
      title: `${plural(unsentQuotes.length + unsentLeads.length, "request")} never reached anyone by email`,
      detail: "A pet owner asked for help and the notification email failed. Reply by hand from the Inbox.",
      href: "/admin/dashboard/leads",
      cta: "Open inbox",
    });
  }

  const newQuotes = core.quotes.filter((q) => q.status === "new").length;
  const newLeads = core.leads.filter((l) => l.status === "new").length;
  if (newQuotes + newLeads) {
    tasks.push({
      id: "new-requests",
      tone: "warn",
      title: `${plural(newQuotes, "quote request")} and ${plural(newLeads, "groomer message")} marked new`,
      detail: "Pet owners waiting on a groomer. Check that someone answered.",
      href: "/admin/dashboard/leads",
      cta: "Open inbox",
    });
  }

  const submissions = core.submissions.filter((s) => s.status === "new");
  if (submissions.length) {
    tasks.push({
      id: "submissions",
      tone: "info",
      title: `${plural(submissions.length, "business")} asked to be listed`,
      detail: names(submissions.map((s) => `${s.businessName} (${s.city})`)),
      href: "/admin/dashboard/leads?tab=submissions",
      cta: "Review",
    });
  }

  const external = externalOwners(owners);
  const thin = external.filter((o) => o.listing.gaps.length > 0 && !o.optedOut);
  if (thin.length) {
    tasks.push({
      id: "thin-owners",
      tone: "warn",
      title: `${plural(thin.length, "owner")} still ${thin.length === 1 ? "has" : "have"} a thin profile`,
      detail: thin.map((o) => `${o.listing.name}: ${o.listing.gaps.join(", ")}`).join(" · "),
      href: "/admin/dashboard/listings",
      cta: "See owners",
    });
  }

  if (core.now < Date.parse(FREE_PROMO_ENDS_AT)) {
    const ready = external.filter((o) => !o.sponsored && o.listing.photoCount >= MIN_PHOTOS);
    if (ready.length) {
      tasks.push({
        id: "promo-ready",
        tone: "info",
        title: `${plural(ready.length, "owner")} with a full photo set and no Sponsored spot`,
        detail: `${names(ready.map((o) => o.listing.name))}. The free promo spot runs to Dec 31 if you want to offer it.`,
        href: "/admin/dashboard/listings",
        cta: "See owners",
      });
    }
  }

  if (outreach.state === "unavailable") {
    tasks.push({
      id: "outreach-down",
      tone: "warn",
      title: "Outreach job status unknown",
      detail: outreach.reason ?? "The outreach list could not be read.",
      href: "/admin/dashboard/outreach",
      cta: "Details",
    });
  } else if (outreach.data) {
    const data = outreach.data;
    const lastRun = data.runs[data.runs.length - 1] ?? null;
    const hourPacific = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hour12: false }).format(core.now));
    if (outreach.state === "cached") {
      tasks.push({
        id: "outreach-cached",
        tone: "warn",
        title: "Outreach Mac is unreachable",
        detail: `Showing the copy from ${new Date(outreach.fetchedAt ?? core.now).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}. If its battery died again, the daily job is not running.`,
        href: "/admin/dashboard/outreach",
        cta: "Details",
      });
    } else if (lastRun !== core.today && hourPacific >= 10) {
      tasks.push({
        id: "outreach-missed",
        tone: "warn",
        title: "Today's outreach run has not happened",
        detail: `Last run folder: ${lastRun ?? "none"}. It normally finishes by about 9:15 am. Check the cron on the outreach Mac before re-running by hand.`,
        href: "/admin/dashboard/outreach",
        cta: "Details",
      });
    }
    const recentBounces = data.contacted.filter((c) => c.bounced && c.bounced >= addDays(core.today, -2));
    if (recentBounces.length) {
      tasks.push({
        id: "bounces",
        tone: "info",
        title: `${plural(recentBounces.length, "outreach email")} bounced in the last 3 days`,
        detail: `${names(recentBounces.map((c) => core.listingByKey.get(c.slug)?.name ?? c.slug))}. They move to the call list.`,
        href: "/admin/dashboard/outreach#bounces",
        cta: "See bounces",
      });
    }
    const stillListed = data.dataIssues.filter((d) => core.listingByKey.has(d.slug));
    if (stillListed.length) {
      tasks.push({
        id: "data-issues",
        tone: "warn",
        title: `${plural(stillListed.length, "listing")} flagged as wrong by outreach ${stillListed.length === 1 ? "is" : "are"} still live`,
        detail: stillListed.map((d) => d.issue).slice(0, 2).join(" "),
        href: "/admin/dashboard/outreach#data-issues",
        cta: "Review",
      });
    }
    const missingEmails = [...contacts.entries()].filter(([slug, c]) => {
      const listing = core.listingByKey.get(slug);
      return c.status === "sent" && !!c.email && !!listing && !listing.email;
    });
    if (missingEmails.length >= 10) {
      tasks.push({
        id: "emails-not-in-db",
        tone: "info",
        title: `${plural(missingEmails.length, "working email")} found by outreach ${missingEmails.length === 1 ? "is" : "are"} not on the listing`,
        detail: "Outreach found and used these addresses, but business_listings.email is still empty for them. Worth backfilling for the quote and lead flows.",
        href: "/admin/dashboard/directory?outreach=sent&missing=email",
        cta: "See listings",
      });
    }
  }

  const warmUnclaimed = core.listings
    .filter((l) => !l.ownerId && (views30.get(l.id) ?? 0) >= 5 && !contacts.get(l.slug)?.sent)
    .sort((a, b) => (views30.get(b.id) ?? 0) - (views30.get(a.id) ?? 0));
  if (warmUnclaimed.length) {
    tasks.push({
      id: "warm-unclaimed",
      tone: "info",
      title: `${plural(warmUnclaimed.length, "unclaimed listing")} with 5+ views this month ${warmUnclaimed.length === 1 ? "has" : "have"} never been emailed`,
      detail: `${names(warmUnclaimed.map((l) => `${l.name} (${views30.get(l.id)})`))}. People are already looking; the owner should hear about it.`,
      href: "/admin/dashboard/traffic#unclaimed",
      cta: "See them",
    });
  }

  for (const check of dns.filter((c) => c.level !== "ok")) {
    tasks.push({
      id: `dns-${check.name}`,
      tone: check.level === "fail" ? "fail" : "info",
      title: `${check.name}: ${check.level === "fail" ? "missing" : "needs attention"}`,
      detail: check.detail,
      href: "/admin/dashboard/health#mail",
      cta: "Details",
    });
  }

  if (gsc.state === "error") {
    tasks.push({
      id: "gsc",
      tone: "warn",
      title: "Search Console is disconnected",
      detail: gsc.error ?? "The last request failed.",
      href: "/admin/dashboard/health#search-console",
      cta: "How to fix",
    });
  }

  return tasks.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
}

export interface FeedItem {
  at: string;
  /** Only the day is known (outreach runs, bounces). */
  dayOnly: boolean;
  kind: "signup" | "claim" | "email" | "quote" | "lead" | "submission" | "outreach" | "bounce";
  text: string;
  href?: string;
}

export function buildFeed(core: Core, outreach: OutreachData | null, limit = 16): FeedItem[] {
  const items: FeedItem[] = [];
  const listingName = (key: string) => core.listingByKey.get(key)?.name ?? key;

  for (const u of core.users) {
    if (u.internal) continue;
    items.push({ at: u.createdAt, dayOnly: false, kind: "signup", text: `New account: ${u.email}` });
  }
  for (const c of core.claims) {
    const how = c.verification === "admin_review" ? (c.status === "pending" ? "waiting for review" : `${c.status} by hand`) : `auto-${c.status}`;
    items.push({ at: c.createdAt, dayOnly: false, kind: "claim", text: `Claim on ${listingName(c.listingId)} (${how})`, href: "/admin/dashboard/claims?view=all" });
  }
  for (const e of core.ownerEmails) {
    const label = e.kind === "claim_approved" ? "Welcome email" : e.kind === "monthly_report" ? "Monthly report" : "Profile reminder";
    items.push({ at: e.sentAt, dayOnly: false, kind: "email", text: `${label} sent to ${listingName(e.listingId)}`, href: "/admin/dashboard/listings" });
  }
  for (const q of core.quotes) items.push({ at: q.createdAt, dayOnly: false, kind: "quote", text: `Quote request from ${q.name} in ${q.city}`, href: "/admin/dashboard/leads" });
  for (const l of core.leads) {
    if (l.createdAt) items.push({ at: l.createdAt, dayOnly: false, kind: "lead", text: `Message to ${listingName(l.listingId)} from ${l.senderName}`, href: "/admin/dashboard/leads?tab=messages" });
  }
  for (const s of core.submissions) items.push({ at: s.createdAt, dayOnly: false, kind: "submission", text: `Listing request: ${s.businessName}`, href: "/admin/dashboard/leads?tab=submissions" });

  if (outreach) {
    const perDay = new Map<string, number>();
    for (const c of outreach.contacted) perDay.set(c.sent, (perDay.get(c.sent) ?? 0) + 1);
    // The list stores days only. The job runs (and scans for bounces) around 9 am Pacific, so order the items there.
    const morning = (day: string) => pacificTime(day, "09:15");
    for (const [day, n] of perDay) items.push({ at: morning(day), dayOnly: true, kind: "outreach", text: `Outreach emailed ${plural(n, "groomer")}`, href: "/admin/dashboard/outreach" });
    for (const c of outreach.contacted) {
      if (c.bounced) items.push({ at: morning(c.bounced), dayOnly: true, kind: "bounce", text: `Bounce: ${listingName(c.slug)}`, href: "/admin/dashboard/outreach#bounces" });
    }
  }

  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
}

/** Days from the outreach email to the claim, when the listing was emailed first. */
export function daysToClaim(listing: AdminListing, contact: ContactInfo | undefined): number | null {
  if (!listing.claimedAt || !contact?.sent) return null;
  const claimedDay = pacificDay(listing.claimedAt);
  if (claimedDay < contact.sent) return null;
  return Math.round((Date.parse(`${claimedDay}T00:00:00Z`) - Date.parse(`${contact.sent}T00:00:00Z`)) / 86_400_000);
}
