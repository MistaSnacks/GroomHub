/**
 * Rules for listing data that only looks known. The import filled two fields with
 * defaults that read as facts: services ["full groom"] and 9 am to 5 pm on all seven
 * days. Profiles, cards, the OG image and JSON-LD must not present those as confirmed.
 * Search and service filters still read the raw tags (see listedServiceTags()).
 */

/** The import's placeholder services value. */
export const PLACEHOLDER_SERVICES: readonly string[] = ["full groom"];

export function isPlaceholderServices(services: readonly string[] | null | undefined): boolean {
  return !!services && services.length === 1 && services[0].trim().toLowerCase() === PLACEHOLDER_SERVICES[0];
}

/**
 * True when nobody told us what the listing offers: no services at all, or the import
 * placeholder on a listing no owner has claimed. A claimed listing's services count as
 * the owner's, even when they match the placeholder.
 */
export function servicesUnknown(listing: { services?: readonly string[] | null; owner_id?: string | null }): boolean {
  const services = listing.services ?? [];
  if (services.length === 0) return true;
  return !listing.owner_id && isPlaceholderServices(services);
}

/** The service tags a profile may show as offered. Empty when servicesUnknown(). */
export function listedServiceTags(listing: { services?: readonly string[] | null; owner_id?: string | null }, serviceTags: string[]): string[] {
  return servicesUnknown(listing) ? [] : serviceTags;
}

interface HoursEntry {
  day?: string;
  open?: string;
  close?: string;
  closed?: boolean;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Minutes after midnight for "9:00 AM", "9:00 AM" (Google's narrow space) or "09:00". */
function minutes(value: string | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec((value ?? "").replace(/[  ]/g, " ").trim());
  if (!m) return null;
  let h = Number(m[1]);
  const suffix = m[3]?.toLowerCase();
  if (suffix === "pm" && h < 12) h += 12;
  if (suffix === "am" && h === 12) h = 0;
  return h * 60 + Number(m[2]);
}

/**
 * The import default: all seven days open 9:00 to 17:00, in either time format (the
 * owner editor also fills missing days with 09:00 to 17:00). Callers use hoursUnconfirmed(),
 * which trusts a claimed listing's hours as the owner's.
 */
export function isDefaultHours(hours: unknown): boolean {
  if (!Array.isArray(hours) || hours.length !== 7) return false;
  const seen = new Set<string>();
  for (const raw of hours) {
    const h = (Array.isArray(raw) ? raw[0] : raw) as HoursEntry | undefined;
    if (!h || typeof h !== "object" || h.closed) return false;
    const day = (h.day ?? "").toLowerCase();
    if (!DAYS.includes(day) || seen.has(day)) return false;
    seen.add(day);
    if (minutes(h.open) !== 9 * 60 || minutes(h.close) !== 17 * 60) return false;
  }
  return seen.size === 7;
}

/** Default hours on a listing no owner has claimed. A claimed listing's hours count as the owner's. */
export function hoursUnconfirmed(listing: { hours?: unknown; owner_id?: string | null }): boolean {
  return !listing.owner_id && isDefaultHours(listing.hours);
}

export const UNCONFIRMED_HOURS_LINE = "Hours not confirmed. Call to check.";
export const SERVICES_NOT_LISTED_LINE = "Services not listed yet.";
