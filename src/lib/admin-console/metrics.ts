/**
 * Pure helpers for the admin console (no I/O), so the numbers on screen can be tested.
 *
 * All day bucketing is in Pacific time: the directory covers WA and OR, and the
 * owner reads "today" as a Pacific day.
 */

export const PACIFIC = "America/Los_Angeles";

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: PACIFIC, year: "numeric", month: "2-digit", day: "2-digit" });

/** Pacific calendar day as YYYY-MM-DD. */
export function pacificDay(value: string | number | Date): string {
  return dayFormat.format(new Date(value));
}

/** ISO timestamp for a Pacific wall-clock time on a YYYY-MM-DD day, with the right PDT/PST offset. */
export function pacificTime(day: string, hhmm: string): string {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, timeZoneName: "shortOffset" })
    .formatToParts(new Date(`${day}T20:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value;
  return `${day}T${hhmm}:00${name === "GMT-8" ? "-08:00" : "-07:00"}`;
}

/** Calendar arithmetic on a YYYY-MM-DD string; immune to DST because it never leaves UTC. */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** The `n` days ending on `endDay`, oldest first. */
export function dayRange(endDay: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(endDay, i - (n - 1)));
}

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);
}

export interface DayPoint {
  day: string;
  /** Views from people (crawler hours removed). */
  count: number;
  /** Views that fell in crawler hours, kept so charts can show what was left out. */
  crawler: number;
}

export interface ViewEvent {
  at: string;
  listingId: string | null;
}

export const CRAWLER_HOUR_MIN = 12;
export const CRAWLER_DISTINCT_SHARE = 0.85;
export const CRAWLER_TAIL_MIN = 5;

/** Whole hours since the epoch. Pacific hours start on the same instants, so this buckets Pacific hours too. */
export function epochHour(value: string | number | Date): number {
  return Math.floor(new Date(value).getTime() / 3_600_000);
}

/**
 * Page views carry no visitor id, so a crawler that runs JavaScript looks like a
 * crowd. Its signature is breadth: many views in one hour, nearly every one on a
 * different listing. People do the opposite (an owner checking their own page five
 * times). An hour is a crawler hour when it has at least CRAWLER_HOUR_MIN views and
 * at least CRAWLER_DISTINCT_SHARE of them hit distinct listings. The ramp-up and
 * tail of a crawl are caught too: an hour within two of a crawler hour where every
 * one of at least CRAWLER_TAIL_MIN views is on a different listing.
 */
export function crawlerHours(views: ViewEvent[]): Set<number> {
  const hours = new Map<number, { n: number; listings: Set<string> }>();
  for (const v of views) {
    const h = epochHour(v.at);
    const bucket = hours.get(h) ?? { n: 0, listings: new Set<string>() };
    bucket.n++;
    bucket.listings.add(v.listingId ?? `none-${bucket.n}`);
    hours.set(h, bucket);
  }
  const flagged = new Set<number>();
  for (const [h, b] of hours) {
    if (b.n >= CRAWLER_HOUR_MIN && b.listings.size / b.n >= CRAWLER_DISTINCT_SHARE) flagged.add(h);
  }
  const core = [...flagged];
  for (const h of core) {
    for (const near of [h - 2, h - 1, h + 1, h + 2]) {
      const b = hours.get(near);
      if (b && !flagged.has(near) && b.n >= CRAWLER_TAIL_MIN && b.listings.size === b.n) flagged.add(near);
    }
  }
  return flagged;
}

/** Views per Pacific day for the given days, split into people and crawler hours. */
export function viewsByDay(days: string[], views: ViewEvent[], crawler: Set<number>): DayPoint[] {
  const map = new Map(days.map((d) => [d, { day: d, count: 0, crawler: 0 }]));
  for (const v of views) {
    const bucket = map.get(pacificDay(v.at));
    if (!bucket) continue;
    if (crawler.has(epochHour(v.at))) bucket.crawler++;
    else bucket.count++;
  }
  return [...map.values()];
}

/** Count timestamps into the given Pacific days (days outside the list are dropped). */
export function countByDay(days: string[], stamps: Iterable<string>): { day: string; count: number }[] {
  const counts = new Map(days.map((d) => [d, 0]));
  for (const stamp of stamps) {
    const day = pacificDay(stamp);
    const current = counts.get(day);
    if (current !== undefined) counts.set(day, current + 1);
  }
  return days.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

/** Percent change, or null when there is no earlier period to compare with. */
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface QualityFields {
  phone: string | null;
  website: string | null;
  email: string | null;
  photoCount: number;
  hasLogo: boolean;
  descLen: number;
  serviceCount: number;
  hasPrice: boolean;
  hasBooking: boolean;
}

export type QualityKey = "website" | "phone" | "email" | "photos" | "description" | "services" | "logo" | "price" | "booking";

export const QUALITY_CHECKS: { key: QualityKey; label: string; weight: number; pass: (l: QualityFields) => boolean }[] = [
  { key: "photos", label: "3+ photos", weight: 20, pass: (l) => l.photoCount >= 3 },
  { key: "website", label: "Website", weight: 15, pass: (l) => !!l.website },
  { key: "email", label: "Email", weight: 15, pass: (l) => !!l.email },
  { key: "description", label: "Real description", weight: 15, pass: (l) => l.descLen >= 150 },
  { key: "phone", label: "Phone", weight: 10, pass: (l) => !!l.phone },
  { key: "services", label: "3+ services", weight: 10, pass: (l) => l.serviceCount >= 3 },
  { key: "logo", label: "Logo", weight: 5, pass: (l) => l.hasLogo },
  { key: "price", label: "Starting price", weight: 5, pass: (l) => l.hasPrice },
  { key: "booking", label: "Booking link", weight: 5, pass: (l) => l.hasBooking },
];

/** 0 to 100: how complete a listing is for a dog owner deciding who to call. */
export function quality(listing: QualityFields): { score: number; missing: QualityKey[] } {
  let score = 0;
  const missing: QualityKey[] = [];
  for (const check of QUALITY_CHECKS) {
    if (check.pass(listing)) score += check.weight;
    else {
      missing.push(check.key);
      // One or two photos is better than none.
      if (check.key === "photos" && listing.photoCount > 0) score += 10;
    }
  }
  return { score, missing };
}

/** "just now", "3h ago", "5d ago", then a date. */
export function relativeTime(value: string | null | undefined, now: number = Date.now()): string {
  if (!value) return "never";
  const then = Date.parse(value);
  if (Number.isNaN(then)) return "unknown";
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDay(value);
}

const shortDate = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, month: "short", day: "numeric" });
const longDate = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, month: "short", day: "numeric", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** "Oct 2" for a timestamp or a YYYY-MM-DD day. */
export function formatDay(value: string | null | undefined): string {
  if (!value) return "-";
  // A bare day has no time zone; noon UTC keeps it on the same Pacific date.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : shortDate.format(date);
}

export function formatLongDay(value: string | null | undefined): string {
  if (!value) return "-";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : longDate.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateTime.format(date);
}

export function compact(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

/** Allowed look-back windows for the range switcher; anything else falls back to 30. */
export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined): Range {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}
