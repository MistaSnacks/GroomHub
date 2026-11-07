import assert from "node:assert/strict";
import test from "node:test";
import { isBotUserAgent } from "@/lib/bot-user-agent";
import { SESSION_CRAWL_LISTINGS, countVisits, realVisits, type VisitEvent } from "@/lib/real-visits";

const SEPT = { startDate: "2026-09-01", endDate: "2026-09-30" };
const keys = new Set(["id-1", "acme", "acme-old"]);
const ev = (at: string, type: string, listingId: string | null, sessionId: string | null = "s1", url: string | null = "https://groomlocal.com/groomer/acme"): VisitEvent => ({
  at,
  type,
  listingId,
  url,
  sessionId,
});

test("realVisits drops events with no session id", () => {
  const kept = realVisits([ev("2026-09-10T18:00:00Z", "page_view", "acme", null), ev("2026-09-10T18:01:00Z", "phone_click", "acme", null), ev("2026-09-10T18:02:00Z", "page_view", "acme")]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].sessionId, "s1");
});

test("realVisits drops local development traffic", () => {
  const kept = realVisits([ev("2026-09-10T18:00:00Z", "page_view", "acme", "s1", "http://localhost:3005/groomer/acme")]);
  assert.equal(kept.length, 0);
});

test("realVisits drops a session that walks through many listings, taps included", () => {
  const crawl = Array.from({ length: SESSION_CRAWL_LISTINGS }, (_, i) => ev(`2026-09-10T0${i % 10}:00:00Z`, "page_view", `listing-${i}`, "bot"));
  const person = [ev("2026-09-10T18:00:00Z", "page_view", "acme", "person"), ev("2026-09-10T18:00:30Z", "page_view", "other", "person")];
  const kept = realVisits([...crawl, ev("2026-09-10T09:30:00Z", "website_click", "listing-3", "bot"), ...person]);
  assert.deepEqual(
    kept.map((e) => e.sessionId),
    ["person", "person"]
  );
});

test("realVisits drops page views in a crawler hour but keeps taps", () => {
  const hour = Array.from({ length: 14 }, (_, i) => ev(`2026-09-20T10:${String(i * 4).padStart(2, "0")}:00Z`, "page_view", `listing-${i}`, `fresh-${i}`));
  const kept = realVisits([...hour, ev("2026-09-20T10:30:00Z", "phone_click", "acme", "fresh-0")]);
  assert.deepEqual(
    kept.map((e) => e.type),
    ["phone_click"]
  );
});

test("countVisits counts this listing's views and taps inside the Pacific range only", () => {
  const events = [
    ev("2026-09-10T18:00:00Z", "page_view", "acme"),
    ev("2026-09-11T18:00:00Z", "page_view", "id-1", "s2", "https://groomlocal.com/groomer/acme?ref=badge"),
    ev("2026-09-12T18:00:00Z", "page_view", "acme-old"),
    ev("2026-09-12T18:05:00Z", "phone_click", "acme"),
    ev("2026-09-13T18:05:00Z", "website_click", "acme"),
    ev("2026-09-13T18:06:00Z", "directions_click", "id-1"),
    ev("2026-09-14T18:00:00Z", "page_view", "someone-else"),
    // Sep 1 00:30 Pacific (07:30 UTC) is in; Oct 1 02:00 UTC is still Sep 30 Pacific, so also in.
    ev("2026-09-01T07:30:00Z", "page_view", "acme"),
    ev("2026-10-01T02:00:00Z", "page_view", "acme"),
    // Aug 31 22:00 Pacific is out.
    ev("2026-09-01T05:00:00Z", "page_view", "acme"),
  ];
  const counts = countVisits(realVisits(events), keys, SEPT);
  assert.equal(counts.views, 5);
  assert.equal(counts.badgeClicks, 1);
  assert.deepEqual(counts.taps, { website: 1, phone: 1, directions: 1, total: 3 });
});

test("countVisits reports zeros, not nothing, for a quiet listing", () => {
  assert.deepEqual(countVisits([], keys, SEPT), { views: 0, badgeClicks: 0, taps: { website: 0, phone: 0, directions: 0, total: 0 } });
});

test("isBotUserAgent flags crawlers and headless browsers, not people", () => {
  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "python-requests/2.31.0",
    "curl/8.4.0",
    "facebookexternalhit/1.1",
    "",
  ]) {
    assert.equal(isBotUserAgent(ua), true, ua);
  }
  for (const ua of [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  ]) {
    assert.equal(isBotUserAgent(ua), false, ua);
  }
});
