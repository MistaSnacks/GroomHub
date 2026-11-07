import { test } from "node:test";
import assert from "node:assert/strict";
import { badgeHostFromReferer, badgeLinkUrl, badgeSnippet, badgeSvg, badgeVariant, slugFromBadgeFile } from "@/lib/badge";
import { periodFromString, previousPeriod, reportDecision, reportPeriod } from "@/lib/owner-report";
import { foldListingRows, listingSlugFromPageUrl, searchWindow } from "@/lib/search-console";
import { monthlyReportEmail, monthlyReportSubject } from "@/lib/email/owner-emails";
import { MIN_SHOWN_COUNT, shownOwnerMetrics } from "@/lib/real-visits";
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

const ok = { optedOut: false, alreadySent: false, hasEmail: true };
const views12 = shownOwnerMetrics({ views: 12, taps: 3, googleImpressions: 4, googleClicks: 0 });

test("reportDecision skips opted-out owners, repeats and months under the threshold", () => {
  assert.deepEqual(reportDecision({ ...ok, shown: views12 }), { send: true });
  assert.deepEqual(reportDecision({ ...ok, optedOut: true, shown: views12 }), { send: false, reason: "opted_out" });
  assert.deepEqual(reportDecision({ ...ok, alreadySent: true, shown: views12 }), { send: false, reason: "already_sent" });
  assert.deepEqual(reportDecision({ ...ok, hasEmail: false, shown: views12 }), { send: false, reason: "no_owner_email" });
});

test("the report skips a listing whose metrics are all under MIN_SHOWN_COUNT", () => {
  const under = MIN_SHOWN_COUNT - 1;
  const shown = shownOwnerMetrics({ views: under, taps: under, googleImpressions: under, googleClicks: under });
  assert.deepEqual(shown, []);
  assert.deepEqual(reportDecision({ ...ok, shown }), { send: false, reason: "below_threshold" });
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
  countedFrom: null,
  metrics: shownOwnerMetrics({ views: 12, taps: 3, googleImpressions: 223, googleClicks: 2 }),
  searches: ["k9 by design", "<b>dog groomer</b>"],
  badgeHost: null,
  gaps: [],
};

test("monthly subject leads with the biggest metric shown", () => {
  assert.equal(monthlyReportSubject(BASE), "Your GroomLocal listing showed up on Google 223 times in September");
  assert.equal(monthlyReportSubject({ ...BASE, metrics: shownOwnerMetrics({ views: 12, taps: 3, googleImpressions: 4, googleClicks: 0 }) }), "Your GroomLocal listing had 12 profile views in September");
});

test("monthly email shows only the metrics at or over the threshold, and escapes searches", () => {
  const email = monthlyReportEmail({ ...BASE, optOutUrl: "https://groomlocal.com/api/owner-reminders/unsubscribe?u=x&token=y" });
  assert.match(email.html, />223</);
  assert.match(email.html, />12</);
  assert.match(email.html, /Profile views/);
  assert.match(email.html, /Google impressions/);
  assert.doesNotMatch(email.html, /Contact taps/);
  assert.doesNotMatch(email.html, /Google clicks/);
  assert.doesNotMatch(email.text, /Contact taps|Google clicks/);
  assert.match(email.html, /&lt;b&gt;dog groomer&lt;\/b&gt;/);
  assert.doesNotMatch(email.html, /<b>dog groomer<\/b>/);
  assert.match(email.html, /Unsubscribe/);
  assert.doesNotMatch(email.html, /dashboard#badge/);
  assert.doesNotMatch(email.html + email.text, /[\u2013\u2014]/);

  const withBadge = monthlyReportEmail({ ...BASE, badgeHost: "k9bydesign.com", gaps: profileGaps({ images: [], logo_url: null, description: "", services: [], specialties: [] }) });
  assert.match(withBadge.html, /Your badge is live on/);
  assert.match(withBadge.html, /Still missing from your profile/);

  const partial = monthlyReportEmail({ ...BASE, countedFrom: "2026-11-12" });
  assert.match(partial.text, /counted from November 12/);
});
