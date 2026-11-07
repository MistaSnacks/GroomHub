import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { statsPeriods } from "@/lib/owner-dashboard-stats";
import { MIN_SHOWN_COUNT, type VisitEvent } from "@/lib/real-visits";
import type { PageSearchStats } from "@/lib/search-console";
import { ListingStats, NO_STATS_LINE } from "@/app/dashboard/listing-stats";

const listing = { id: "id-1", slug: "acme" };
const OCT = { startDate: "2026-10-01", endDate: "2026-10-31" };

// Each view in its own session and hour, so the crawler rules do not fire.
function views(n: number, type = "page_view"): VisitEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    at: new Date(Date.parse("2026-10-02T18:00:00Z") + i * 2 * 3_600_000).toISOString(),
    type,
    listingId: "acme",
    url: "https://groomlocal.com/groomer/acme",
    sessionId: `${type}-${i}`,
  }));
}

const google = (impressions: number, clicks: number): Map<string, PageSearchStats> => new Map([["acme", { impressions, clicks, position: 8, queries: [] }]]);

const render = (periods: ReturnType<typeof statsPeriods>) => renderToStaticMarkup(createElement(ListingStats, { periods }));

test("a count of 9 is hidden and 10 is shown", () => {
  const nine = statsPeriods(listing, views(MIN_SHOWN_COUNT - 1), [{ label: "October", visits: OCT, google: null }]);
  assert.deepEqual(nine, []);
  const ten = statsPeriods(listing, views(MIN_SHOWN_COUNT), [{ label: "October", visits: OCT, google: null }]);
  assert.deepEqual(ten, [{ label: "October", metrics: [{ key: "views", value: 10 }] }]);
  const html = render(ten);
  assert.match(html, /Profile views/);
  assert.match(html, />10</);
});

test("contact taps show as one combined number, and small metrics leave no trace", () => {
  const events = [...views(4, "website_click"), ...views(3, "phone_click"), ...views(3, "directions_click"), ...views(2)];
  const periods = statsPeriods(listing, events, [{ label: "October", visits: OCT, google: google(240, 9) }]);
  assert.deepEqual(periods[0].metrics, [
    { key: "taps", value: 10 },
    { key: "googleImpressions", value: 240 },
  ]);
  const html = render(periods);
  assert.match(html, /Contact taps/);
  assert.match(html, /Google impressions/);
  assert.doesNotMatch(html, /Profile views|Google clicks|fewer than/i);
  assert.doesNotMatch(html, />[0-9]</);
});

test("no metric qualifies: one neutral line with no numbers", () => {
  const periods = statsPeriods(listing, views(3), [
    { label: "Last 30 days", visits: OCT, google: google(9, 1) },
    { label: "October", visits: OCT, google: null },
  ]);
  assert.deepEqual(periods, []);
  const html = render(periods);
  assert.equal(html, `<p class="text-sm text-text-muted mb-4">${NO_STATS_LINE}</p>`);
  assert.doesNotMatch(html.replace(/<[^>]+>/g, ""), /\d/);
});

test("a failed Search Console call hides the Google metrics only", () => {
  const periods = statsPeriods(listing, views(12), [{ label: "October", visits: OCT, google: null }]);
  assert.deepEqual(periods[0].metrics.map((m) => m.key), ["views"]);
});
