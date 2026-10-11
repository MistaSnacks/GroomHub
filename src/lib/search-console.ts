import { LISTING_REDIRECTS } from "@/lib/listing-review";

/**
 * Google Search Console reads (server only). Used by the admin console and the
 * monthly owner report. Needs GSC_SITE_URL and the GOOGLE_* OAuth variables; the
 * refresh token only carries the webmasters.readonly scope.
 */

export interface SearchQueryRow {
  query: string;
  impressions: number;
  clicks: number;
}

export interface PageSearchStats {
  impressions: number;
  clicks: number;
  /** Impression-weighted average position. */
  position: number;
  /** Most-shown queries first. Google hides rare queries, so these sum to less than `impressions`. */
  queries: SearchQueryRow[];
}

export function searchConsoleConfigured(): boolean {
  return !!(process.env.GSC_SITE_URL?.trim() && process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function googleAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !body.access_token) {
    if (body.error === "invalid_grant") {
      throw new Error("Google refresh token is expired or revoked (invalid_grant). Re-authorize and update GOOGLE_REFRESH_TOKEN.");
    }
    throw new Error(`Google token exchange failed: ${body.error ?? res.status}`);
  }
  return body.access_token;
}

interface RawRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function searchAnalytics(token: string, body: Record<string, unknown>): Promise<RawRow[]> {
  const site = process.env.GSC_SITE_URL?.trim() ?? "";
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const json = (await res.json()) as { rows?: RawRow[]; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Search Console returned ${res.status}`);
  return json.rows ?? [];
}

/**
 * The listing slug a Search Console page URL belongs to, or null for other pages.
 * Old duplicate slugs count toward the profile they now redirect to.
 */
export function listingSlugFromPageUrl(pageUrl: string): string | null {
  let path: string;
  try {
    path = new URL(pageUrl).pathname;
  } catch {
    return null;
  }
  const match = /^\/groomer\/([a-z0-9-]+)\/?$/.exec(path);
  if (!match) return null;
  return LISTING_REDIRECTS[match[1]] ?? match[1];
}

/** Fold page and page+query rows into per-listing stats. Pure, so it can be tested. */
export function foldListingRows(pageRows: RawRow[], queryRows: RawRow[], queriesPerListing = 5): Map<string, PageSearchStats> {
  const out = new Map<string, PageSearchStats & { weighted: number }>();
  for (const r of pageRows) {
    const slug = listingSlugFromPageUrl(r.keys?.[0] ?? "");
    if (!slug) continue;
    const entry = out.get(slug) ?? { impressions: 0, clicks: 0, position: 0, weighted: 0, queries: [] };
    entry.impressions += r.impressions;
    entry.clicks += r.clicks;
    entry.weighted += r.position * r.impressions;
    out.set(slug, entry);
  }
  const queries = new Map<string, Map<string, SearchQueryRow>>();
  for (const r of queryRows) {
    const slug = listingSlugFromPageUrl(r.keys?.[0] ?? "");
    const query = r.keys?.[1];
    if (!slug || !query) continue;
    const bySlug = queries.get(slug) ?? new Map<string, SearchQueryRow>();
    const q = bySlug.get(query) ?? { query, impressions: 0, clicks: 0 };
    q.impressions += r.impressions;
    q.clicks += r.clicks;
    bySlug.set(query, q);
    queries.set(slug, bySlug);
  }
  const result = new Map<string, PageSearchStats>();
  for (const [slug, e] of out) {
    const top = [...(queries.get(slug)?.values() ?? [])].sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks).slice(0, queriesPerListing);
    result.set(slug, {
      impressions: e.impressions,
      clicks: e.clicks,
      position: e.impressions ? e.weighted / e.impressions : 0,
      queries: top,
    });
  }
  return result;
}

const memo = new Map<string, { at: number; value: Map<string, PageSearchStats> }>();

/** Google impressions, clicks and top queries for every listing page, for an inclusive date range. */
export async function listingSearchStats(startDate: string, endDate: string): Promise<Map<string, PageSearchStats>> {
  const key = `${startDate}:${endDate}`;
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) return hit.value;
  const token = await googleAccessToken();
  const filter = [{ filters: [{ dimension: "page", operator: "contains", expression: "/groomer/" }] }];
  const [pageRows, queryRows] = await Promise.all([
    searchAnalytics(token, { startDate, endDate, dimensions: ["page"], dimensionFilterGroups: filter, rowLimit: 5000 }),
    searchAnalytics(token, { startDate, endDate, dimensions: ["page", "query"], dimensionFilterGroups: filter, rowLimit: 25000 }),
  ]);
  const value = foldListingRows(pageRows, queryRows);
  memo.set(key, { at: Date.now(), value });
  return value;
}

/** The last `days` days of Search Console data ending two days before `today` (data lags about two days). */
export function searchWindow(today: string, days: number): { startDate: string; endDate: string } {
  const shift = (delta: number) => {
    const [y, m, d] = today.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
  };
  return { startDate: shift(-2 - (days - 1)), endDate: shift(-2) };
}
