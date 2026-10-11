// Monthly owner report: what a listing did last month (pure; no I/O).
// Data gathering lives in src/lib/owner-report-data.ts, the email in
// src/lib/email/owner-emails.ts, and the cron in src/app/api/cron/owner-reports.

import { epochHour, pacificDay } from "@/lib/admin-console/metrics";

export interface ReportPeriod {
  /** "2026-09" */
  period: string;
  /** First and last Pacific day, inclusive. */
  startDate: string;
  endDate: string;
  /** "September" or, in January, "December 2025". */
  label: string;
}

const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });

/** A period from "YYYY-MM", or null if malformed. */
export function periodFromString(value: string, now: Date = new Date()): ReportPeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const name = monthName.format(new Date(Date.UTC(year, month - 1, 1)));
  const currentYear = Number(pacificDay(now).slice(0, 4));
  return {
    period: value,
    startDate: `${value}-01`,
    endDate: `${value}-${String(lastDay).padStart(2, "0")}`,
    label: year === currentYear ? name : `${name} ${year}`,
  };
}

function monthBefore(year: number, month: number): string {
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** The calendar month before `now`, in Pacific time. */
export function reportPeriod(now: Date = new Date()): ReportPeriod {
  const [y, m] = pacificDay(now).split("-").map(Number);
  return periodFromString(monthBefore(y, m), now)!;
}

/** The month before `period`. */
export function previousPeriod(period: ReportPeriod, now: Date = new Date()): ReportPeriod {
  const [y, m] = period.period.split("-").map(Number);
  return periodFromString(monthBefore(y, m), now)!;
}

export interface ReportEvent {
  at: string;
  type: string;
  listingId: string | null;
  url: string | null;
}

export interface MonthStats {
  views: number;
  /** Views that arrived through the owner's website badge. Included in `views`. */
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

/**
 * Views and contact taps for one listing in the period. `keys` holds every value an
 * event may carry for this listing (its id, its slug, old redirected slugs).
 * Views in crawler hours are left out, the same rule the admin console uses.
 */
export function monthStats(events: ReportEvent[], keys: Set<string>, period: ReportPeriod, crawler: Set<number>): MonthStats {
  const stats: MonthStats = { views: 0, badgeClicks: 0, taps: { website: 0, phone: 0, directions: 0, total: 0 } };
  for (const e of events) {
    if (!e.listingId || !keys.has(e.listingId)) continue;
    if (e.url?.startsWith("http://localhost") || e.url?.startsWith("http://127.0.0.1")) continue;
    const day = pacificDay(e.at);
    if (day < period.startDate || day > period.endDate) continue;
    if (e.type === "page_view") {
      if (crawler.has(epochHour(e.at))) continue;
      stats.views++;
      if (isBadgeVisit(e.url)) stats.badgeClicks++;
    } else if (e.type === "website_click") {
      stats.taps.website++;
    } else if (e.type === "phone_click") {
      stats.taps.phone++;
    } else if (e.type === "directions_click") {
      stats.taps.directions++;
    }
  }
  stats.taps.total = stats.taps.website + stats.taps.phone + stats.taps.directions;
  return stats;
}

export type ReportDecision =
  | { send: true }
  | { send: false; reason: "opted_out" | "already_sent" | "nothing_to_report" | "no_owner_email" };

/** A month with no views, no taps and no Google impressions is not worth an email. */
export function reportDecision(opts: {
  optedOut: boolean;
  alreadySent: boolean;
  hasEmail: boolean;
  stats: MonthStats;
  googleImpressions: number;
}): ReportDecision {
  if (opts.optedOut) return { send: false, reason: "opted_out" };
  if (opts.alreadySent) return { send: false, reason: "already_sent" };
  if (!opts.hasEmail) return { send: false, reason: "no_owner_email" };
  if (opts.stats.views + opts.stats.taps.total + opts.googleImpressions === 0) return { send: false, reason: "nothing_to_report" };
  return { send: true };
}
