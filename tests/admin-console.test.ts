import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, countByDay, crawlerHours, dayRange, epochHour, pacificDay, pacificTime, parseRange, pctDelta, quality, relativeTime, viewsByDay, type ViewEvent } from "@/lib/admin-console/metrics";
import { parseOutreach, sendsByDay } from "@/lib/admin-console/outreach";
import { contactIndex, daysToClaim } from "@/lib/admin-console/insights";
import type { AdminListing } from "@/lib/admin-console/data";

test("pacificDay buckets late-evening Pacific events on the Pacific date", () => {
  // 03:30 UTC on Oct 2 is 8:30 pm Oct 1 in Seattle.
  assert.equal(pacificDay("2026-10-02T03:30:00Z"), "2026-10-01");
  assert.equal(pacificDay("2026-10-02T08:00:00Z"), "2026-10-02");
});

test("pacificTime uses PDT in October and PST in December", () => {
  assert.equal(pacificTime("2026-10-02", "09:15"), "2026-10-02T09:15:00-07:00");
  assert.equal(pacificTime("2026-12-02", "09:15"), "2026-12-02T09:15:00-08:00");
});

test("day arithmetic crosses month and DST boundaries cleanly", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-11-01", 1), "2026-11-02");
  assert.deepEqual(dayRange("2026-10-02", 3), ["2026-09-30", "2026-10-01", "2026-10-02"]);
});

test("countByDay drops events outside the window", () => {
  const days = ["2026-10-01", "2026-10-02"];
  const counts = countByDay(days, ["2026-10-01T20:00:00Z", "2026-10-02T20:00:00Z", "2026-10-02T21:00:00Z", "2026-09-01T20:00:00Z"]);
  assert.deepEqual(counts, [
    { day: "2026-10-01", count: 1 },
    { day: "2026-10-02", count: 2 },
  ]);
});

/** `n` views spread through one UTC hour, on `distinct` different listings. */
function hourOfViews(hourIso: string, n: number, distinct: number): ViewEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    at: new Date(Date.parse(hourIso) + Math.floor((i * 3_600_000) / n)).toISOString(),
    listingId: `listing-${i % distinct}`,
  }));
}

test("crawlerHours flags broad bursts and their tails, not people", () => {
  const views = [
    // The Sep 29 to 30 crawl, in Pacific hours 22:00, 23:00, 00:00, 01:00 then a tail at 02:00.
    ...hourOfViews("2026-09-30T05:00:00Z", 103, 100),
    ...hourOfViews("2026-09-30T06:00:00Z", 217, 217),
    ...hourOfViews("2026-09-30T07:00:00Z", 53, 53),
    ...hourOfViews("2026-09-30T08:00:00Z", 21, 21),
    ...hourOfViews("2026-09-30T09:00:00Z", 8, 8),
    // An owner checking their own listing over and over.
    ...hourOfViews("2026-09-17T20:00:00Z", 14, 4),
    // A normal busy hour.
    ...hourOfViews("2026-10-02T18:00:00Z", 7, 7),
  ];
  const flagged = crawlerHours(views);
  const hour = (iso: string) => flagged.has(epochHour(iso));
  assert.equal(hour("2026-09-30T05:30:00Z"), true);
  assert.equal(hour("2026-09-30T06:30:00Z"), true);
  assert.equal(hour("2026-09-30T08:30:00Z"), true);
  assert.equal(hour("2026-09-30T09:30:00Z"), true, "tail hour next to the crawl");
  assert.equal(hour("2026-09-17T20:30:00Z"), false, "repeat views of a few listings are a person");
  assert.equal(hour("2026-10-02T18:30:00Z"), false);
});

test("viewsByDay splits people from crawler views on Pacific days", () => {
  const views = [...hourOfViews("2026-09-30T06:00:00Z", 20, 20), ...hourOfViews("2026-09-30T20:00:00Z", 3, 3)];
  const points = viewsByDay(["2026-09-29", "2026-09-30"], views, crawlerHours(views));
  // 06:00 UTC on Sep 30 is 11 pm Sep 29 in Seattle.
  assert.deepEqual(points, [
    { day: "2026-09-29", count: 0, crawler: 20 },
    { day: "2026-09-30", count: 3, crawler: 0 },
  ]);
});

test("quality gives partial credit for one or two photos and lists what is missing", () => {
  const empty = { phone: null, website: null, email: null, photoCount: 0, hasLogo: false, descLen: 0, serviceCount: 0, hasPrice: false, hasBooking: false };
  assert.deepEqual(quality(empty), { score: 0, missing: ["photos", "website", "email", "description", "phone", "services", "logo", "price", "booking"] });
  assert.equal(quality({ ...empty, photoCount: 1 }).score, 10);
  const full = { phone: "1", website: "x", email: "a@b.c", photoCount: 5, hasLogo: true, descLen: 400, serviceCount: 6, hasPrice: true, hasBooking: true };
  assert.deepEqual(quality(full), { score: 100, missing: [] });
});

test("pctDelta and parseRange", () => {
  assert.equal(pctDelta(150, 100), 50);
  assert.equal(pctDelta(5, 0), null);
  assert.equal(parseRange("90"), 90);
  assert.equal(parseRange("365"), 30);
  assert.equal(parseRange(undefined), 30);
});

test("relativeTime", () => {
  const now = Date.parse("2026-10-02T20:00:00Z");
  assert.equal(relativeTime(null, now), "never");
  assert.equal(relativeTime("2026-10-02T19:59:40Z", now), "just now");
  assert.equal(relativeTime("2026-10-02T17:00:00Z", now), "3h ago");
  assert.equal(relativeTime("2026-09-29T20:00:00Z", now), "3d ago");
});

const RAW = [
  JSON.stringify({
    updated: "2026-10-02",
    contacted: [
      { slug: "a", email: "a@a.com", sent: "2026-09-15", campaign: "gsc-1" },
      { slug: "b", email: "b@b.com", sent: "2026-09-16", campaign: "gsc-1", bounced: "2026-09-17", bounce_inbox_id: "1" },
      { slug: "b", email: "info@b.com", sent: "2026-09-20", campaign: "daily-2026-09-20" },
      { slug: "c", email: "c@c.com", sent: "2026-09-20", campaign: "daily-2026-09-20", bounced: "2026-09-21" },
      { email: "broken entry" },
    ],
    manual_no_email: ["d"],
    researched_no_email: ["e"],
    data_issues: [{ slug: "x", issue: "Wrong state" }],
    followups: [{ slug: "a", email: "a@a.com", sent: "2026-09-16", type: "personal" }],
  }),
  "\n@@RUNS@@\n",
  "2026-09-19\n2026-09-20\nnot-a-run\n",
  "@@REPORT@@\n",
  "# Daily outreach 2026-09-20\nSent: 2\n",
].join("");

test("parseOutreach reads the list, run folders and report, skipping malformed rows", () => {
  const data = parseOutreach(RAW);
  assert.equal(data.contacted.length, 4);
  assert.deepEqual(data.runs, ["2026-09-19", "2026-09-20"]);
  assert.equal(data.manualNoEmail[0], "d");
  assert.equal(data.dataIssues[0].issue, "Wrong state");
  assert.match(data.lastReport ?? "", /Sent: 2/);
  assert.equal(data.contacted[1].bounced, "2026-09-17");
});

test("contactIndex keeps the first send, and a later good address clears an earlier bounce", () => {
  const index = contactIndex(parseOutreach(RAW));
  assert.deepEqual(index.get("a"), { status: "sent", sent: "2026-09-15", campaign: "gsc-1", email: "a@a.com" });
  assert.deepEqual(index.get("b"), { status: "sent", sent: "2026-09-16", campaign: "gsc-1", email: "info@b.com" });
  assert.equal(index.get("c")?.status, "bounced");
  assert.equal(index.get("d")?.status, "no_email");
  assert.equal(index.get("e")?.status, "researched");
  assert.equal(index.get("zzz"), undefined);
});

test("sendsByDay counts bounces on the send day", () => {
  const perDay = sendsByDay(parseOutreach(RAW), ["2026-09-16", "2026-09-20"]);
  assert.deepEqual(perDay, [
    { day: "2026-09-16", sent: 1, bounced: 1 },
    { day: "2026-09-20", sent: 2, bounced: 1 },
  ]);
});

test("daysToClaim measures from the outreach email to the claim, and ignores claims before the email", () => {
  const listing = { claimedAt: "2026-10-02T18:25:08Z" } as AdminListing;
  assert.equal(daysToClaim(listing, { status: "sent", sent: "2026-09-29", campaign: "x", email: "x" }), 3);
  assert.equal(daysToClaim(listing, { status: "sent", sent: "2026-10-05", campaign: "x", email: "x" }), null);
  assert.equal(daysToClaim(listing, undefined), null);
});
