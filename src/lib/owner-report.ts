// Monthly owner report: what a listing did last month (pure; no I/O).
// Data gathering lives in src/lib/owner-report-data.ts, the email in
// src/lib/email/owner-emails.ts, and the cron in src/app/api/cron/owner-reports.

import { pacificDay } from "@/lib/admin-console/metrics";
import type { OwnerMetric } from "@/lib/real-visits";

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

export type ReportDecision =
  | { send: true }
  | { send: false; reason: "opted_out" | "already_sent" | "below_threshold" | "no_owner_email" };

/** Send only when at least one metric reaches MIN_SHOWN_COUNT (`shown` is the output of shownOwnerMetrics()). */
export function reportDecision(opts: {
  optedOut: boolean;
  alreadySent: boolean;
  hasEmail: boolean;
  shown: OwnerMetric[];
}): ReportDecision {
  if (opts.optedOut) return { send: false, reason: "opted_out" };
  if (opts.alreadySent) return { send: false, reason: "already_sent" };
  if (!opts.hasEmail) return { send: false, reason: "no_owner_email" };
  if (opts.shown.length === 0) return { send: false, reason: "below_threshold" };
  return { send: true };
}
