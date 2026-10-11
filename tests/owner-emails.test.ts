import { test } from "node:test";
import assert from "node:assert/strict";
import { profileGaps, MIN_PHOTOS, MIN_DESCRIPTION_CHARS, MIN_SERVICES } from "@/lib/profile-completeness";
import {
  FIRST_REMINDER_AFTER_DAYS,
  MAX_REMINDERS,
  REMINDER_EVERY_DAYS,
  optOutUrl,
  reminderDecision,
  verifyOptOutToken,
  type OwnerEmailEvent,
} from "@/lib/owner-reminders";
import { claimApprovedEmail, profileReminderEmail } from "@/lib/email/owner-emails";
import { sendEmail } from "@/lib/email/send";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-20T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY).toISOString();

const THIN = { images: [], logo_url: null, description: "Short.", services: ["Bath"], specialties: [] };
const FULL = {
  images: ["a", "b", "c"],
  logo_url: "https://x/logo.png",
  description: "x".repeat(MIN_DESCRIPTION_CHARS),
  services: ["a", "b", "c"],
  specialties: ["Doodles"],
};

test("profileGaps flags every missing piece of an imported listing", () => {
  assert.deepEqual(profileGaps(THIN).map((g) => g.key), ["photos", "logo", "description", "services", "specialties"]);
  assert.deepEqual(profileGaps({}).map((g) => g.key), ["photos", "logo", "description", "services", "specialties"]);
});

test("profileGaps is empty at exactly the thresholds and trims the description", () => {
  assert.deepEqual(profileGaps(FULL), []);
  assert.equal(profileGaps({ ...FULL, images: FULL.images.slice(0, MIN_PHOTOS - 1) })[0].key, "photos");
  assert.equal(profileGaps({ ...FULL, services: FULL.services.slice(0, MIN_SERVICES - 1) })[0].key, "services");
  assert.equal(profileGaps({ ...FULL, description: " ".repeat(500) })[0].key, "description");
});

const reminder = (n: number): OwnerEmailEvent => ({ kind: "profile_reminder", sent_at: daysAgo(n) });
const approval = (n: number): OwnerEmailEvent => ({ kind: "claim_approved", sent_at: daysAgo(n) });

test("first reminder waits FIRST_REMINDER_AFTER_DAYS from the claim, or from the approval email", () => {
  assert.deepEqual(reminderDecision({ claimedAt: daysAgo(FIRST_REMINDER_AFTER_DAYS - 1), events: [], now: NOW }), { due: false, reason: "too_soon" });
  assert.deepEqual(reminderDecision({ claimedAt: daysAgo(FIRST_REMINDER_AFTER_DAYS), events: [], now: NOW }), { due: true, sequence: 1 });
  // Claim was long ago but the approval email just went out: still counts as a recent touch.
  assert.deepEqual(reminderDecision({ claimedAt: daysAgo(30), events: [approval(1)], now: NOW }), { due: false, reason: "too_soon" });
});

test("later reminders are REMINDER_EVERY_DAYS apart and stop after MAX_REMINDERS", () => {
  assert.deepEqual(
    reminderDecision({ claimedAt: daysAgo(30), events: [approval(20), reminder(REMINDER_EVERY_DAYS - 1)], now: NOW }),
    { due: false, reason: "too_soon" }
  );
  assert.deepEqual(
    reminderDecision({ claimedAt: daysAgo(30), events: [approval(20), reminder(REMINDER_EVERY_DAYS)], now: NOW }),
    { due: true, sequence: 2 }
  );
  const all = Array.from({ length: MAX_REMINDERS }, (_, i) => reminder(40 - i * 10));
  assert.deepEqual(reminderDecision({ claimedAt: daysAgo(60), events: all, now: NOW }), { due: false, reason: "max_reached" });
});

test("reminderDecision never sends for a listing with no claim date", () => {
  assert.deepEqual(reminderDecision({ claimedAt: null, events: [], now: NOW }), { due: false, reason: "not_claimed" });
  assert.deepEqual(reminderDecision({ claimedAt: "garbage", events: [], now: NOW }), { due: false, reason: "not_claimed" });
});

test("opt-out links verify only for the user they were made for, and not as newsletter tokens", () => {
  const prev = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = "test-secret";
  try {
    const user = "5b0e2a52-3f5d-4d49-9a43-1d1e7f6c9a10";
    const url = optOutUrl(user);
    assert.ok(url && url.startsWith("https://groomlocal.com/api/owner-reminders/unsubscribe?"));
    const params = new URL(url!).searchParams;
    assert.equal(params.get("u"), user);
    assert.equal(verifyOptOutToken(user, params.get("token")!), true);
    assert.equal(verifyOptOutToken("00000000-0000-4000-8000-000000000000", params.get("token")!), false);
    assert.equal(verifyOptOutToken(user, "short"), false);
  } finally {
    if (prev === undefined) delete process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
    else process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = prev;
  }
});

test("optOutUrl is null when no signing secret is configured", () => {
  const saved = { a: process.env.NEWSLETTER_UNSUBSCRIBE_SECRET, b: process.env.CRON_SECRET };
  delete process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  delete process.env.CRON_SECRET;
  try {
    assert.equal(optOutUrl("5b0e2a52-3f5d-4d49-9a43-1d1e7f6c9a10"), null);
  } finally {
    if (saved.a !== undefined) process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = saved.a;
    if (saved.b !== undefined) process.env.CRON_SECRET = saved.b;
  }
});

const OPT_OUT = "https://groomlocal.com/api/owner-reminders/unsubscribe?u=abc&token=def";

test("approval email lists the gaps, links to the edit page and escapes the listing name", () => {
  const e = claimApprovedEmail({ listingName: `Paws & <b>Claws</b>`, slug: "paws-claws", gaps: profileGaps(THIN), optOutUrl: OPT_OUT });
  assert.equal(e.subject, "Your GroomLocal claim for Paws & <b>Claws</b> is approved");
  assert.ok(!e.html.includes("<b>Claws</b>"));
  assert.ok(e.html.includes("Paws &amp; &lt;b&gt;Claws&lt;/b&gt;"));
  assert.ok(e.html.includes("https://groomlocal.com/dashboard/listing/paws-claws"));
  assert.ok(e.html.includes("Photos of your shop and your work"));
  assert.ok(e.html.includes("u=abc&amp;token=def"), "opt-out href is HTML-escaped");
  assert.ok(e.text.includes("- Your logo:"));
  assert.ok(e.text.includes(OPT_OUT));
});

test("approval email for an already complete profile skips the checklist and the reminder promise", () => {
  const e = claimApprovedEmail({ listingName: "Full Shop", slug: "full-shop", gaps: [], optOutUrl: OPT_OUT });
  assert.ok(e.html.includes("https://groomlocal.com/dashboard"));
  assert.ok(!e.html.includes("/dashboard/listing/"));
  assert.ok(!e.html.includes("reminders"));
  assert.ok(!e.text.includes("Turn them off"));
});

test("approval email still reads fine without an opt-out link", () => {
  const e = claimApprovedEmail({ listingName: "Shop", slug: "shop", gaps: profileGaps(THIN), optOutUrl: null });
  assert.ok(!e.html.includes("Turn them off"));
  assert.ok(!e.text.includes("reminders"));
});

test("reminder email: unsubscribe in the footer, last one says so, subject varies", () => {
  const gaps = profileGaps(THIN);
  const first = profileReminderEmail({ listingName: "Shop", slug: "shop", gaps, sequence: 1, optOutUrl: OPT_OUT });
  assert.equal(first.subject, "Finish your Shop profile on GroomLocal");
  assert.ok(first.html.includes(">Unsubscribe</a>"));
  assert.ok(!first.html.includes("last reminder"));
  const last = profileReminderEmail({ listingName: "Shop", slug: "shop", gaps, sequence: MAX_REMINDERS, optOutUrl: OPT_OUT });
  assert.equal(last.subject, "Last reminder: finish your Shop profile");
  assert.ok(last.html.includes("This is the last reminder we will send."));
  assert.ok(last.text.includes("This is the last reminder we will send."));
});

test("owner emails contain no em dashes", () => {
  const gaps = profileGaps(THIN);
  const all = [
    claimApprovedEmail({ listingName: "Shop", slug: "shop", gaps, optOutUrl: OPT_OUT }),
    claimApprovedEmail({ listingName: "Shop", slug: "shop", gaps: [], optOutUrl: OPT_OUT }),
    profileReminderEmail({ listingName: "Shop", slug: "shop", gaps, sequence: 1, optOutUrl: OPT_OUT }),
    profileReminderEmail({ listingName: "Shop", slug: "shop", gaps, sequence: MAX_REMINDERS, optOutUrl: OPT_OUT }),
  ];
  for (const e of all) for (const part of [e.subject, e.text, e.html]) assert.ok(!part.includes("—"), "em dash found");
});

test("sendEmail forwards custom headers to Resend", async () => {
  const origFetch = globalThis.fetch;
  const prev = { k: process.env.RESEND_API_KEY, f: process.env.EMAIL_FROM };
  process.env.RESEND_API_KEY = "k";
  process.env.EMAIL_FROM = "GroomLocal <hello@groomlocal.com>";
  let body: Record<string, unknown> = {};
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    body = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
  }) as typeof fetch;
  try {
    await sendEmail({ site: "test", to: "a@b.co", subject: "s", text: "t", headers: { "List-Unsubscribe": "<https://x>" } });
    assert.deepEqual(body.headers, { "List-Unsubscribe": "<https://x>" });
    await sendEmail({ site: "test", to: "a@b.co", subject: "s", text: "t" });
    assert.ok(!("headers" in body));
  } finally {
    globalThis.fetch = origFetch;
    if (prev.k === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = prev.k;
    if (prev.f === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = prev.f;
  }
});
