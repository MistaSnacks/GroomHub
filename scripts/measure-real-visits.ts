// Select-only: October (or any month) views and taps before and after the real-visit filter.
//   npx tsx scripts/measure-real-visits.ts [YYYY-MM]
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { crawlerHours, epochHour } from "../src/lib/admin-console/metrics";
import { countVisits, listingEventKeys, realVisits, type VisitEvent } from "../src/lib/real-visits";
import { periodFromString } from "../src/lib/owner-report";

config({ path: ".env.local" });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const period = periodFromString(process.argv[2] ?? "2026-10")!;

async function allEvents(): Promise<VisitEvent[]> {
  const from = new Date(Date.parse(`${period.startDate}T00:00:00Z`) - 86_400_000).toISOString();
  const to = new Date(Date.parse(`${period.endDate}T00:00:00Z`) + 2 * 86_400_000).toISOString();
  const rows: VisitEvent[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("analytics_events")
      .select("created_at, event_type, listing_id, url, session_id")
      .gte("created_at", from)
      .lt("created_at", to)
      .order("created_at")
      .range(offset, offset + 999);
    if (error) throw error;
    for (const r of data ?? []) rows.push({ at: r.created_at, type: r.event_type, listingId: r.listing_id, url: r.url, sessionId: r.session_id });
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function main() {
  const raw = await allEvents();
  const local = (e: VisitEvent) => !!e.url && /^http:\/\/(localhost|127\.0\.0\.1)/.test(e.url);
  const prod = raw.filter((e) => !local(e));
  const crawler = crawlerHours(prod.filter((e) => e.type === "page_view"));
  const oldRule = prod.filter((e) => e.type !== "page_view" || !crawler.has(epochHour(e.at)));
  const real = realVisits(raw);

  const { data: claimed, error } = await db.from("business_listings").select("id, slug, name").not("owner_id", "is", null).order("claimed_at");
  if (error) throw error;

  const siteCount = (events: VisitEvent[]) => {
    let views = 0;
    let taps = 0;
    for (const e of events) {
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date(e.at));
      if (day < period.startDate || day > period.endDate) continue;
      if (e.type === "page_view" && e.listingId) views++;
      else if (["website_click", "phone_click", "directions_click"].includes(e.type)) taps++;
    }
    return { views, taps };
  };

  const rows: Array<Record<string, string | number>> = [];
  const s = [siteCount(prod), siteCount(oldRule), siteCount(real)];
  rows.push({ listing: "Whole site", rawViews: s[0].views, rawTaps: s[0].taps, crawlerHourViews: s[1].views, crawlerHourTaps: s[1].taps, realViews: s[2].views, realTaps: s[2].taps });
  const totals = { rawViews: 0, rawTaps: 0, crawlerHourViews: 0, crawlerHourTaps: 0, realViews: 0, realTaps: 0 };
  for (const l of claimed ?? []) {
    const keys = listingEventKeys(l);
    const a = countVisits(prod, keys, period);
    const b = countVisits(oldRule, keys, period);
    const c = countVisits(real, keys, period);
    const row = { rawViews: a.views, rawTaps: a.taps.total, crawlerHourViews: b.views, crawlerHourTaps: b.taps.total, realViews: c.views, realTaps: c.taps.total };
    for (const k of Object.keys(totals) as (keyof typeof totals)[]) totals[k] += row[k];
    rows.push({ listing: l.name, ...row });
  }
  rows.push({ listing: `Claimed total (${claimed?.length ?? 0})`, ...totals });

  console.log(`Period ${period.startDate} to ${period.endDate}. Events fetched: ${raw.length}; with a session id: ${raw.filter((e) => e.sessionId).length}; localhost: ${raw.length - prod.length}.`);
  console.table(rows);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
