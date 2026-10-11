import { test } from "node:test";
import assert from "node:assert/strict";
import { badgeHostFromReferer, badgeLinkUrl, badgeSnippet, badgeSvg, badgeVariant, slugFromBadgeFile } from "@/lib/badge";
import { monthStats, periodFromString, previousPeriod, reportDecision, reportPeriod, type ReportEvent } from "@/lib/owner-report";
import { foldListingRows, listingSlugFromPageUrl, searchWindow } from "@/lib/search-console";
import { monthlyReportEmail, monthlyReportSubject } from "@/lib/email/owner-emails";
import { profileGaps } from "@/lib/profile-completeness";

// --- Badge -------------------------------------------------------------------

test("badge file names map to slugs and reject anything else", () => {
  assert.equal(slugFromBadgeFile("urban-doggie-kirkland.svg"), "urban-doggie-kirkland");
  assert.equal(slugFromBadgeFile("urban-doggie-kirkland.png"), null);
  assert.equal(slugFromBadgeFile("../etc/passwd.svg"), null);
  assert.equal(slugFromBadgeFile("Caps.svg"), null);
});

test("badge referer: owner sites count, our own pages and junk do not", () => {
  assert.equal(badgeHostFromReferer("https://www.urbandoggie.net/about"), "urbandoggie.net");
  assert.equal(badgeHostFromReferer("https://perfectpawshpaws.com/"), "perfectpawshpaws.com");
  assert.equal(badgeHostFromReferer("https://groomlocal.com/dashboard"), null);
  assert.equal(badgeHostFromReferer("https://www.groomlocal.com/"), null);
  assert.equal(badgeHostFromReferer("https://groom-abc123.vercel.app/dashboard"), null);
  assert.equal(badgeHostFromReferer("http://localhost:3005/dashboard"), null);
  assert.equal(badgeHostFromReferer("not a url"), null);
  assert.equal(badgeHostFromReferer("ftp://example.com/x"), null);
  assert.equal(badgeHostFromReferer(null), null);
});

test("badge snippet links to the owner's own profile and loads the per-listing image", () => {
  const html = badgeSnippet("pawsh-paws-poulsbo");
  assert.match(html, /href="https:\/\/groomlocal\.com\/groomer\/pawsh-paws-poulsbo\?ref=badge"/);
  assert.match(html, /src="https:\/\/groomlocal\.com\/badge\/pawsh-paws-poulsbo\.svg"/);
  assert.match(html, /alt="Find us on GroomLocal"/);
  assert.equal(badgeLinkUrl("x"), "https://groomlocal.com/groomer/x?ref=badge");
});

test("badge says Featured only while the spot is live, and only for claimed listings", () => {
  const live = { owner_id: "u1", is_featured: true, sponsor_paid_until: "2027-01-01T08:00:00.000Z" };
  assert.equal(badgeVariant(live, Date.parse("2026-12-31T20:00:00Z")), "featured");
  assert.equal(badgeVariant(live, Date.parse("2027-01-01T08:00:00Z")), "confirmed");
  assert.equal(badgeVariant({ owner_id: "u1", is_featured: false, sponsor_paid_until: null }), "confirmed");
  assert.equal(badgeVariant({ owner_id: null, is_featured: true, sponsor_paid_until: null }), "listed");
});

test("only claimed listings get the Owner Confirmed wording", () => {
  assert.match(badgeSvg("confirmed"), /<title>Owner Confirmed on GroomLocal<\/title>/);
  assert.doesNotMatch(badgeSvg("listed"), /Owner Confirmed/);
  assert.match(badgeSvg("listed"), /<title>Find us on GroomLocal<\/title>/);
  assert.match(badgeSvg("featured"), /<title>Featured on GroomLocal<\/title>/);
  for (const v of ["featured", "confirmed", "listed"] as const) {
    assert.doesNotMatch(badgeSvg(v), /<script|href=/i);
    assert.match(badgeSvg(v), /^<svg [^>]*width="220" height="64"/);
  }
});

// --- Report period -----------------------------------------------------------

test("report period is the previous calendar month in Pacific time", () => {
  assert.deepEqual(reportPeriod(new Date("2026-10-03T18:00:00Z")), { period: "2026-09", startDate: "2026-09-01", endDate: "2026-09-30", label: "September" });
  // Jan 3 reports on December of the year before, and says which year.
  assert.equal(reportPeriod(new Date("2027-01-03T18:00:00Z")).label, "December 2026");
  // 02:00 UTC on Nov 1 is still Oct 31 in Pacific time, so the report month is September.
  assert.equal(reportPeriod(new Date("2026-11-01T02:00:00Z")).period, "2026-09");
  assert.equal(periodFromString("2026-02")!.endDate, "2026-02-28");
  assert.equal(periodFromString("2026-13"), null);
  assert.equal(previousPeriod(periodFromString("2026-01")!).period, "2025-12");
});

// --- Month stats -------------------------------------------------------------

const SEPT = periodFromString("2026-09", new Date("2026-10-03T00:00:00Z"))!;
const keys = new Set(["id-1", "acme", "acme-old"]);
const ev = (at: string, type: string, listingId: string | null, url: string | null = "https://groomlocal.com/groomer/acme"): ReportEvent => ({ at, type, listingId, url });

test("monthStats counts this listing's views and taps inside the Pacific month only", () => {
  const events = [
    ev("2026-09-10T18:00:00Z", "page_view", "acme"),
    ev("2026-09-11T18:00:00Z", "page_view", "id-1", "https://groomlocal.com/groomer/acme?ref=badge"),
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
    // Local development traffic is out.
    ev("2026-09-15T18:00:00Z", "page_view", "acme", "http://localhost:3005/groomer/acme"),
  ];
  const stats = monthStats(events, keys, SEPT, new Set());
  assert.equal(stats.views, 5);
  assert.equal(stats.badgeClicks, 1);
  assert.deepEqual(stats.taps, { website: 1, phone: 1, directions: 1, total: 3 });
});

test("monthStats leaves out views in crawler hours", () => {
  const at = "2026-09-20T10:15:00Z";
  const crawler = new Set([Math.floor(Date.parse(at) / 3_600_000)]);
  const stats = monthStats([ev(at, "page_view", "acme"), ev(at, "phone_click", "acme")], keys, SEPT, crawler);
  assert.equal(stats.views, 0);
  assert.equal(stats.taps.total, 1);
});

test("reportDecision skips opted-out owners, repeats and empty months", () => {
  const stats = { views: 3, badgeClicks: 0, taps: { website: 0, phone: 0, directions: 0, total: 0 } };
  const zero = { views: 0, badgeClicks: 0, taps: { website: 0, phone: 0, directions: 0, total: 0 } };
  assert.deepEqual(reportDecision({ optedOut: false, alreadySent: false, hasEmail: true, stats, googleImpressions: 0 }), { send: true });
  assert.deepEqual(reportDecision({ optedOut: false, alreadySent: false, hasEmail: true, stats: zero, googleImpressions: 40 }), { send: true });
  assert.deepEqual(reportDecision({ optedOut: true, alreadySent: false, hasEmail: true, stats, googleImpressions: 0 }), { send: false, reason: "opted_out" });
  assert.deepEqual(reportDecision({ optedOut: false, alreadySent: true, hasEmail: true, stats, googleImpressions: 0 }), { send: false, reason: "already_sent" });
  assert.deepEqual(reportDecision({ optedOut: false, alreadySent: false, hasEmail: false, stats, googleImpressions: 0 }), { send: false, reason: "no_owner_email" });
  assert.deepEqual(reportDecision({ optedOut: false, alreadySent: false, hasEmail: true, stats: zero, googleImpressions: 0 }), { send: false, reason: "nothing_to_report" });
});

// --- Search Console folding --------------------------------------------------

test("Search Console page URLs map to listing slugs, old duplicates to their kept profile", () => {
  assert.equal(listingSlugFromPageUrl("https://groomlocal.com/groomer/k9-by-design-port-orchard"), "k9-by-design-port-orchard");
  assert.equal(listingSlugFromPageUrl("https://www.groomlocal.com/groomer/acme/"), "acme");
  assert.equal(listingSlugFromPageUrl("https://groomlocal.com/groomer/floof-pet-grooming-greenlake-seattle"), "floof-pet-grooming-seattle");
  assert.equal(listingSlugFromPageUrl("https://groomlocal.com/dog-grooming/wa/seattle"), null);
  assert.equal(listingSlugFromPageUrl("garbage"), null);
});

test("foldListingRows sums pages per listing and keeps the top queries", () => {
  const row = (keys: string[], impressions: number, clicks = 0, position = 8) => ({ keys, impressions, clicks, ctr: 0, position });
  const out = foldListingRows(
    [
      row(["https://groomlocal.com/groomer/floof-pet-grooming-seattle"], 100, 2, 6),
      row(["https://groomlocal.com/groomer/floof-pet-grooming-greenlake-seattle"], 50, 0, 12),
      row(["https://groomlocal.com/blog/x"], 999),
    ],
    [
      row(["https://groomlocal.com/groomer/floof-pet-grooming-seattle", "floof grooming"], 60),
      row(["https://groomlocal.com/groomer/floof-pet-grooming-greenlake-seattle", "floof grooming"], 20),
      row(["https://groomlocal.com/groomer/floof-pet-grooming-seattle", "floof greenlake"], 30),
    ]
  );
  const floof = out.get("floof-pet-grooming-seattle")!;
  assert.equal(out.size, 1);
  assert.equal(floof.impressions, 150);
  assert.equal(floof.clicks, 2);
  assert.equal(Math.round(floof.position), 8); // (6*100 + 12*50) / 150
  assert.deepEqual(floof.queries.map((q) => [q.query, q.impressions]), [["floof grooming", 80], ["floof greenlake", 30]]);
});

test("searchWindow ends two days before today", () => {
  assert.deepEqual(searchWindow("2026-10-05", 28), { startDate: "2026-09-06", endDate: "2026-10-03" });
});

// --- Monthly email -----------------------------------------------------------

const BASE = {
  listingName: "K9 by Design",
  slug: "k9-by-design-port-orchard",
  monthLabel: "September",
  views: 12,
  taps: { website: 1, phone: 2, directions: 0, total: 3 },
  google: { impressions: 223, clicks: 2, queries: [{ query: "k9 by design", impressions: 120 }, { query: "<b>dog groomer</b>", impressions: 5 }] },
  badgeHost: null,
  badgeClicks: 0,
  gaps: [],
};

test("monthly subject leads with the biggest honest number", () => {
  assert.equal(monthlyReportSubject(BASE), "Your GroomLocal listing showed up on Google 223 times in September");
  assert.equal(monthlyReportSubject({ ...BASE, google: { impressions: 4, clicks: 0, queries: [] } }), "Your GroomLocal listing had 12 views in September");
  assert.equal(monthlyReportSubject({ ...BASE, views: 1, google: null }), "Your GroomLocal listing had 1 view in September");
});

test("monthly email shows the numbers, escapes queries, and asks for the badge only when it is missing", () => {
  const withoutBadge = monthlyReportEmail({ ...BASE, optOutUrl: "https://groomlocal.com/api/owner-reminders/unsubscribe?u=x&token=y" });
  assert.match(withoutBadge.html, />223</);
  assert.match(withoutBadge.html, /&lt;b&gt;dog groomer&lt;\/b&gt;/);
  assert.doesNotMatch(withoutBadge.html, /<b>dog groomer<\/b>/);
  assert.match(withoutBadge.html, /dashboard#badge/);
  assert.match(withoutBadge.html, /Unsubscribe/);
  assert.match(withoutBadge.text, /2 calls, 1 website visit/);
  assert.doesNotMatch(withoutBadge.html, /—/);

  const withBadge = monthlyReportEmail({ ...BASE, badgeHost: "k9bydesign.com", badgeClicks: 4, gaps: profileGaps({ images: [], logo_url: null, description: "", services: [], specialties: [] }) });
  assert.doesNotMatch(withBadge.html, /dashboard#badge/);
  assert.match(withBadge.html, /sent 4 visitors/);
  assert.match(withBadge.html, /Still missing from your profile/);

  const noGoogle = monthlyReportEmail({ ...BASE, google: null });
  assert.doesNotMatch(noGoogle.html, /Google views/);
});

test("monthly email leaves zero numbers out of the stat row", () => {
  const viewsOnly = monthlyReportEmail({ ...BASE, taps: { website: 0, phone: 0, directions: 0, total: 0 }, google: { impressions: 0, clicks: 0, queries: [] } });
  assert.match(viewsOnly.html, /Profile views/);
  assert.doesNotMatch(viewsOnly.html, /Contact taps/);
  assert.doesNotMatch(viewsOnly.html, /Google views/);
  assert.doesNotMatch(viewsOnly.text, /: 0/);
  const googleOnly = monthlyReportEmail({ ...BASE, views: 0, taps: { website: 0, phone: 0, directions: 0, total: 0 } });
  assert.doesNotMatch(googleOnly.html, /Profile views/);
  assert.match(googleOnly.html, />223</);
});
