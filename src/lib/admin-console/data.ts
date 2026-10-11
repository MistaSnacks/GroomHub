import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminEmails } from "@/lib/admin";
import { profileGaps, type ProfileGapKey } from "@/lib/profile-completeness";
import { isSponsored } from "@/lib/listing-rules";
import { canonicalCityRouteSlug } from "@/lib/city-route";
import { addDays, crawlerHours, dayRange, epochHour, pacificDay, quality, viewsByDay, type DayPoint, type QualityFields, type QualityKey } from "./metrics";

/**
 * Everything the admin console reads, loaded once per request with the service-role
 * client. Callers must have passed requireAdmin() first (the admin layout does).
 *
 * The tables are small (about a thousand listings, a few thousand events), so each
 * page loads the whole picture and derives its own view from it.
 */

export interface AdminListing extends QualityFields {
  id: string;
  slug: string;
  name: string;
  city: string;
  citySlug: string;
  state: string;
  specialtyCount: number;
  isFeatured: boolean;
  sponsorPaidUntil: string | null;
  sponsorComp: boolean;
  tier: string | null;
  ownerId: string | null;
  claimedAt: string | null;
  /** 0 to 100, see quality(). */
  score: number;
  missing: QualityKey[];
  /** Owner-facing gaps, the same list the reminder emails use. */
  gaps: ProfileGapKey[];
}

export interface AdminEvent {
  at: string;
  type: string;
  listingId: string | null;
  /** A page view that arrived through an owner's website badge (?ref=badge). */
  fromBadge?: boolean;
  /** Path of the page a contact click happened on. Only set for contact clicks. */
  page?: string;
}

export interface BadgeInstallRow {
  listingId: string;
  host: string;
  firstSeen: string;
  lastSeen: string;
  hits: number;
}

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  /** The operator's own accounts: admins, @groomlocal.com, and ADMIN_INTERNAL_EMAILS. */
  internal: boolean;
}

export interface ClaimRow {
  id: string;
  listingId: string;
  listingSlug: string;
  userId: string;
  userEmail: string;
  status: string;
  verification: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface SubmissionRow {
  id: string;
  createdAt: string;
  businessName: string;
  contactName: string | null;
  city: string;
  state: string;
  email: string;
  phone: string | null;
  website: string | null;
  notes: string | null;
  status: string;
}

export interface StagingRow {
  id: string;
  createdAt: string | null;
  sourceUrl: string | null;
  status: string | null;
  notes: string | null;
  name: string | null;
  address: string | null;
  website: string | null;
}

export interface QuoteRow {
  id: string;
  createdAt: string;
  petType: string;
  petBreed: string | null;
  services: string[];
  city: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  status: string;
  notifiedAt: string | null;
  notifyError: string | null;
}

export interface LeadRow {
  id: string;
  createdAt: string | null;
  listingId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  message: string;
  status: string;
  notifiedAt: string | null;
  notifyError: string | null;
}

export interface SubscriberRow {
  id: string;
  email: string;
  subscribedAt: string | null;
  unsubscribedAt: string | null;
  source: string | null;
}

export interface OwnerEmailRow {
  listingId: string;
  userId: string;
  kind: string;
  sentAt: string;
}

type Db = ReturnType<typeof createAdminClient>;

/** PostgREST caps an unranged select at 1,000 rows, so walk the table in pages. */
async function selectAll<T>(db: Db, table: string, columns: string, order: string, since?: { column: string; iso: string }): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    let query = db.from(table).select(columns).order(order, { ascending: true }).range(from, from + 999);
    if (since) query = query.gte(since.column, since.iso);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

const LISTING_COLUMNS =
  "id, slug, name, city, city_slug, state, phone, website, email, images, logo_url, description, services, specialties, price_min, booking_url, is_featured, sponsor_paid_until, sponsor_comp, subscription_tier, owner_id, claimed_at";

interface ListingDbRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  city_slug: string;
  state: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  images: string[] | null;
  logo_url: string | null;
  description: string | null;
  services: string[] | null;
  specialties: string[] | null;
  price_min: number | null;
  booking_url: string | null;
  is_featured: boolean | null;
  sponsor_paid_until: string | null;
  sponsor_comp: boolean | null;
  subscription_tier: string | null;
  owner_id: string | null;
  claimed_at: string | null;
}

function toAdminListing(row: ListingDbRow): AdminListing {
  const fields: QualityFields = {
    phone: row.phone?.trim() || null,
    website: row.website?.trim() || null,
    email: row.email?.trim() || null,
    photoCount: row.images?.length ?? 0,
    hasLogo: !!row.logo_url,
    descLen: row.description?.trim().length ?? 0,
    serviceCount: row.services?.length ?? 0,
    hasPrice: (row.price_min ?? 0) > 0,
    hasBooking: !!row.booking_url,
  };
  const { score, missing } = quality(fields);
  return {
    ...fields,
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    // Legacy "-wa"/"-or" slugs (some Seattle rows) point at the same city page.
    citySlug: canonicalCityRouteSlug(row.city_slug),
    state: row.state,
    specialtyCount: row.specialties?.length ?? 0,
    isFeatured: row.is_featured === true,
    sponsorPaidUntil: row.sponsor_paid_until,
    sponsorComp: row.sponsor_comp === true,
    tier: row.subscription_tier,
    ownerId: row.owner_id,
    claimedAt: row.claimed_at,
    score,
    missing,
    gaps: profileGaps(row).map((g) => g.key),
  };
}

function internalEmails(): Set<string> {
  const extra = (process.env.ADMIN_INTERNAL_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return new Set([...getAdminEmails(), ...extra]);
}

async function listUsers(db: Db): Promise<AdminUser[]> {
  const internal = internalEmails();
  const users: User[] = [];
  for (let page = 1; page < 100; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    users.push(...(data?.users ?? []));
    if (!data || data.users.length < 1000) break;
  }
  return users.map((u) => {
    const email = (u.email ?? "").toLowerCase();
    return {
      id: u.id,
      email: u.email ?? "unknown",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      confirmed: !!u.email_confirmed_at,
      internal: internal.has(email) || email.endsWith("@groomlocal.com"),
    };
  });
}

/** How far back traffic is loaded. The longest window on screen is 90 days plus its comparison period. */
export const EVENT_WINDOW_DAYS = 200;

export interface Core {
  now: number;
  /** Today as a Pacific YYYY-MM-DD. */
  today: string;
  listings: AdminListing[];
  /** Listing lookup by id and by slug (events carry either). */
  listingByKey: Map<string, AdminListing>;
  /** Production events only; rows logged from a localhost URL are dropped. */
  events: AdminEvent[];
  localEventCount: number;
  /** Epoch hours that look like a crawler (see crawlerHours). Page views in them are left out of every count. */
  crawler: Set<number>;
  users: AdminUser[];
  userById: Map<string, AdminUser>;
  claims: ClaimRow[];
  submissions: SubmissionRow[];
  staging: StagingRow[];
  quotes: QuoteRow[];
  leads: LeadRow[];
  subscribers: SubscriberRow[];
  ownerEmails: OwnerEmailRow[];
  optedOut: Set<string>;
  /** Websites showing a listing's badge, most recently seen first. */
  badgeInstalls: BadgeInstallRow[];
  houseSlug: string | null;
}

async function fetchCore(): Promise<Core> {
  const db = createAdminClient();
  const now = Date.now();
  const today = pacificDay(now);
  const since = new Date(now - EVENT_WINDOW_DAYS * 86_400_000).toISOString();

  const small = async <T,>(table: string, columns: string, order: string): Promise<T[]> => {
    const { data, error } = await db.from(table).select(columns).order(order, { ascending: false }).limit(500);
    if (error) throw new Error(`${table}: ${error.message}`);
    return (data ?? []) as T[];
  };

  const [listingRows, eventRows, users, claims, submissions, staging, quotes, leads, subscribers, ownerEmails, optouts, badgeInstalls] = await Promise.all([
    selectAll<ListingDbRow>(db, "business_listings", LISTING_COLUMNS, "id"),
    selectAll<{ created_at: string; event_type: string; listing_id: string | null; url: string | null }>(
      db, "analytics_events", "created_at, event_type, listing_id, url", "created_at", { column: "created_at", iso: since }
    ),
    listUsers(db),
    small<{ id: string; listing_id: string; listing_slug: string; user_id: string; user_email: string; status: string; verification: string; created_at: string; reviewed_at: string | null; reviewed_by: string | null }>(
      "claim_requests", "id, listing_id, listing_slug, user_id, user_email, status, verification, created_at, reviewed_at, reviewed_by", "created_at"
    ),
    small<{ id: string; created_at: string; business_name: string; contact_name: string | null; city: string; state: string; email: string; phone: string | null; website: string | null; notes: string | null; status: string }>(
      "listing_submissions", "id, created_at, business_name, contact_name, city, state, email, phone, website, notes, status", "created_at"
    ),
    small<{ id: string; created_at: string | null; source_url: string | null; status: string | null; notes: string | null; scraped_data: Record<string, unknown> | null }>(
      "listings_staging", "id, created_at, source_url, status, notes, scraped_data", "created_at"
    ),
    small<{ id: string; created_at: string; pet_type: string; pet_breed: string | null; services: string[]; city: string; name: string; email: string; phone: string | null; notes: string | null; status: string; notified_at: string | null; notify_error: string | null }>(
      "quote_requests", "id, created_at, pet_type, pet_breed, services, city, name, email, phone, notes, status, notified_at, notify_error", "created_at"
    ),
    small<{ id: string; created_at: string | null; listing_id: string; sender_name: string; sender_email: string; sender_phone: string | null; message: string; status: string; notified_at: string | null; notify_error: string | null }>(
      "leads", "id, created_at, listing_id, sender_name, sender_email, sender_phone, message, status, notified_at, notify_error", "created_at"
    ),
    small<{ id: string; email: string; subscribed_at: string | null; unsubscribed_at: string | null; source: string | null }>(
      "newsletter_subscribers", "id, email, subscribed_at, unsubscribed_at, source", "subscribed_at"
    ),
    small<{ listing_id: string; user_id: string; kind: string; sent_at: string }>("owner_email_log", "listing_id, user_id, kind, sent_at", "sent_at"),
    small<{ user_id: string }>("owner_email_optouts", "user_id", "created_at"),
    small<{ listing_id: string; host: string; first_seen: string; last_seen: string; hits: number }>("badge_installs", "listing_id, host, first_seen, last_seen, hits", "last_seen"),
  ]);

  const listings = listingRows.map(toAdminListing);
  const listingByKey = new Map<string, AdminListing>();
  for (const l of listings) {
    listingByKey.set(l.slug, l);
    listingByKey.set(l.id, l);
  }

  let localEventCount = 0;
  const events: AdminEvent[] = [];
  for (const e of eventRows) {
    if (e.url?.startsWith("http://localhost") || e.url?.startsWith("http://127.0.0.1")) {
      localEventCount++;
      continue;
    }
    const event: AdminEvent = { at: e.created_at, type: e.event_type, listingId: e.listing_id, fromBadge: e.event_type === "page_view" && !!e.url?.includes("ref=badge") };
    if (isAction(e.event_type) && e.url) event.page = urlPath(e.url);
    events.push(event);
  }

  const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

  return {
    now,
    today,
    listings,
    listingByKey,
    events,
    localEventCount,
    crawler: crawlerHours(events.filter((e) => e.type === "page_view")),
    users,
    userById: new Map(users.map((u) => [u.id, u])),
    claims: claims.map((c) => ({
      id: c.id, listingId: c.listing_id, listingSlug: c.listing_slug, userId: c.user_id, userEmail: c.user_email,
      status: c.status, verification: c.verification, createdAt: c.created_at, reviewedAt: c.reviewed_at, reviewedBy: c.reviewed_by,
    })),
    submissions: submissions.map((s) => ({
      id: s.id, createdAt: s.created_at, businessName: s.business_name, contactName: s.contact_name, city: s.city, state: s.state,
      email: s.email, phone: s.phone, website: s.website, notes: s.notes, status: s.status,
    })),
    staging: staging.map((s) => ({
      id: s.id, createdAt: s.created_at, sourceUrl: s.source_url, status: s.status, notes: s.notes,
      name: text(s.scraped_data?.name), address: text(s.scraped_data?.address), website: text(s.scraped_data?.website),
    })),
    quotes: quotes.map((q) => ({
      id: q.id, createdAt: q.created_at, petType: q.pet_type, petBreed: q.pet_breed, services: q.services ?? [], city: q.city, name: q.name,
      email: q.email, phone: q.phone, notes: q.notes, status: q.status, notifiedAt: q.notified_at, notifyError: q.notify_error,
    })),
    leads: leads.map((l) => ({
      id: l.id, createdAt: l.created_at, listingId: l.listing_id, senderName: l.sender_name, senderEmail: l.sender_email, senderPhone: l.sender_phone,
      message: l.message, status: l.status, notifiedAt: l.notified_at, notifyError: l.notify_error,
    })),
    subscribers: subscribers.map((s) => ({ id: s.id, email: s.email, subscribedAt: s.subscribed_at, unsubscribedAt: s.unsubscribed_at, source: s.source })),
    ownerEmails: ownerEmails.map((e) => ({ listingId: e.listing_id, userId: e.user_id, kind: e.kind, sentAt: e.sent_at })),
    optedOut: new Set(optouts.map((o) => o.user_id)),
    badgeInstalls: badgeInstalls.map((b) => ({ listingId: b.listing_id, host: b.host, firstSeen: b.first_seen, lastSeen: b.last_seen, hits: b.hits })),
    houseSlug: process.env.HOUSE_LISTING_SLUG?.trim() || null,
  };
}

/**
 * fetchCore takes over a second (about 4,000 events in pages of 1,000, plus listings and
 * users). Keep the last result across requests so moving between pages is instant.
 * After FRESH_MS a page still gets the stale copy at once and a reload runs behind it.
 * The Refresh button and every admin write call invalidateCore().
 */
const FRESH_MS = 60_000;
const MAX_STALE_MS = 10 * 60_000;
let memo: { at: number; core: Promise<Core> } | null = null;
let reloading: Promise<Core> | null = null;

function startLoad(): Promise<Core> {
  const core = fetchCore();
  const at = Date.now();
  core.then(
    () => { memo = { at, core }; },
    () => { if (memo?.core === core) memo = null; }
  );
  return core;
}

export function invalidateCore(): void {
  memo = null;
  reloading = null;
}

export const loadCore = cache(async (): Promise<Core> => {
  const age = memo ? Date.now() - memo.at : Infinity;
  if (memo && age < FRESH_MS) return memo.core;
  if (memo && age < MAX_STALE_MS) {
    if (!reloading) reloading = startLoad().finally(() => { reloading = null; });
    return memo.core;
  }
  const core = startLoad();
  memo = { at: Date.now(), core };
  return core;
});

export const ACTION_TYPES = ["website_click", "directions_click", "phone_click"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export function isAction(type: string): type is ActionType {
  return (ACTION_TYPES as readonly string[]).includes(type);
}

export interface Traffic {
  /** One point per day for the window, oldest first, people and crawler views split. */
  views: DayPoint[];
  /** The same days for the period just before, for comparisons. */
  previousViews: DayPoint[];
  actions: { day: string; website: number; directions: number; phone: number }[];
  /** Totals with crawler hours left out, so a crawl does not read as growth. */
  viewTotal: number;
  previousViewTotal: number;
  /** Views in crawler hours in this window. */
  crawlerViews: number;
  actionTotal: number;
  previousActionTotal: number;
}

/** Daily traffic for the last `range` days and the period before it. */
export function buildTraffic(core: Core, range: number): Traffic {
  const days = dayRange(core.today, range);
  const previousDays = dayRange(addDays(days[0], -1), range);
  const pageViews = core.events.filter((e) => e.type === "page_view");
  const views = viewsByDay(days, pageViews, core.crawler);
  const previousViews = viewsByDay(previousDays, pageViews, core.crawler);

  const actionDays = new Map(days.map((d) => [d, { day: d, website: 0, directions: 0, phone: 0 }]));
  const previousSet = new Set(previousDays);
  let actionTotal = 0;
  let previousActionTotal = 0;
  for (const e of core.events) {
    if (!isAction(e.type)) continue;
    const day = pacificDay(e.at);
    const bucket = actionDays.get(day);
    if (bucket) {
      actionTotal++;
      if (e.type === "website_click") bucket.website++;
      else if (e.type === "directions_click") bucket.directions++;
      else bucket.phone++;
    } else if (previousSet.has(day)) {
      previousActionTotal++;
    }
  }

  const sum = (points: DayPoint[], key: "count" | "crawler") => points.reduce((n, p) => n + p[key], 0);
  return {
    views,
    previousViews,
    actions: [...actionDays.values()],
    viewTotal: sum(views, "count"),
    previousViewTotal: sum(previousViews, "count"),
    crawlerViews: sum(views, "crawler"),
    actionTotal,
    previousActionTotal,
  };
}

export interface ListingTraffic {
  views: number;
  actions: number;
  /** Views that came through the owner's website badge. Included in `views`. */
  badgeViews: number;
}

/** Views and contact clicks per listing id over the window, crawler hours left out. */
export function trafficByListing(core: Core, traffic: Traffic): Map<string, ListingTraffic> {
  const counted = new Set(traffic.views.map((p) => p.day));
  const out = new Map<string, ListingTraffic>();
  for (const e of core.events) {
    if (!e.listingId || !counted.has(pacificDay(e.at))) continue;
    if (e.type === "page_view" && core.crawler.has(epochHour(e.at))) continue;
    const listing = core.listingByKey.get(e.listingId);
    if (!listing) continue;
    const entry = out.get(listing.id) ?? { views: 0, actions: 0, badgeViews: 0 };
    if (e.type === "page_view") {
      entry.views++;
      if (e.fromBadge) entry.badgeViews++;
    }
    else if (isAction(e.type)) entry.actions++;
    out.set(listing.id, entry);
  }
  return out;
}

export interface OwnerRecord {
  listing: AdminListing;
  user: AdminUser | null;
  /** The founder-related listing, named only by the HOUSE_LISTING_SLUG env var. */
  house: boolean;
  sponsored: boolean;
  emails: OwnerEmailRow[];
  optedOut: boolean;
  badges: BadgeInstallRow[];
}

export function ownerRecords(core: Core): OwnerRecord[] {
  return core.listings
    .filter((l) => l.ownerId)
    .map((listing) => ({
      listing,
      user: core.userById.get(listing.ownerId!) ?? null,
      house: listing.slug === core.houseSlug,
      sponsored: isSponsored({ is_featured: listing.isFeatured, sponsor_paid_until: listing.sponsorPaidUntil }, core.now),
      emails: core.ownerEmails.filter((e) => e.listingId === listing.id),
      optedOut: core.optedOut.has(listing.ownerId!),
      badges: core.badgeInstalls.filter((b) => b.listingId === listing.id),
    }))
    .sort((a, b) => (b.listing.claimedAt ?? "").localeCompare(a.listing.claimedAt ?? ""));
}

/** A sponsor who actually pays: placed, a paid-through date in the future, and not a comped promo. */
export function isPayingSponsor(listing: AdminListing, now: number): boolean {
  return listing.isFeatured && !listing.sponsorComp && !!listing.sponsorPaidUntil && Date.parse(listing.sponsorPaidUntil) > now;
}

export interface RecentClick {
  at: string;
  type: ActionType;
  listing: AdminListing | null;
  /** Page the click happened on, when it is not the listing's own profile (a nearby card, a city page). */
  fromPage: string | null;
}

/** Contact clicks on any listing, newest first. Clicks are never crawler-filtered (bots do not tap phone numbers). */
export function recentClicks(core: Core, limit = 100): RecentClick[] {
  const out: RecentClick[] = [];
  for (let i = core.events.length - 1; i >= 0 && out.length < limit; i--) {
    const e = core.events[i];
    if (!isAction(e.type)) continue;
    const listing = e.listingId ? core.listingByKey.get(e.listingId) ?? null : null;
    const own = listing ? `/groomer/${listing.slug}` : null;
    out.push({ at: e.at, type: e.type, listing, fromPage: e.page && e.page !== own ? e.page : null });
  }
  return out;
}
