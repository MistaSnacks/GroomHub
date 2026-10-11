import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSponsored,
  sortRegularList,
  activeSponsorshipFilter,
  freePromoPlacement,
  FREE_PROMO_ENDS_AT,
  NO_PLACEMENT,
} from "@/lib/listing-rules";

const now = Date.parse("2026-09-24T12:00:00Z");

test("isSponsored requires is_featured and an unexpired paid-through date", () => {
  assert.equal(isSponsored({ is_featured: true, sponsor_paid_until: null }, now), true);
  assert.equal(isSponsored({ is_featured: true, sponsor_paid_until: "2026-12-01T00:00:00Z" }, now), true);
  assert.equal(isSponsored({ is_featured: true, sponsor_paid_until: "2026-01-01T00:00:00Z" }, now), false);
  assert.equal(isSponsored({ is_featured: false, sponsor_paid_until: "2026-12-01T00:00:00Z" }, now), false);
  assert.equal(isSponsored({}, now), false);
});

test("regular list order ignores every payment signal", () => {
  const rows = [
    { id: "b", rating: 4.2, subscription_tier: "free", is_featured: false },
    { id: "a", rating: 4.9, subscription_tier: "premium", is_featured: true },
    { id: "c", rating: 4.9, subscription_tier: "free", is_featured: false },
    { id: "d", rating: 5.0, subscription_tier: "free", is_featured: false },
  ];
  assert.deepEqual(sortRegularList(rows).map((r) => r.id), ["d", "a", "c", "b"]);
  // Same ratings, sponsorship flipped: order must not change.
  const flipped = rows.map((r) => ({ ...r, is_featured: !r.is_featured, subscription_tier: r.subscription_tier === "free" ? "premium" : "free" }));
  assert.deepEqual(sortRegularList(flipped).map((r) => r.id), ["d", "a", "c", "b"]);
});

test("activeSponsorshipFilter is a PostgREST or() fragment", () => {
  const f = activeSponsorshipFilter(new Date(now));
  assert.equal(f, "sponsor_paid_until.is.null,sponsor_paid_until.gt.2026-09-24T12:00:00.000Z");
});

test("the free promo ends at 11:59 pm Pacific on December 31, 2026", () => {
  assert.equal(FREE_PROMO_ENDS_AT, "2027-01-01T08:00:00.000Z");
  // 11:59 pm PST on Dec 31 is 07:59 UTC on Jan 1, still inside the window; midnight PST is the cutoff.
  assert.equal(freePromoPlacement(Date.parse("2027-01-01T07:59:00Z")).ok, true);
  assert.equal(freePromoPlacement(Date.parse("2027-01-01T08:00:00Z")).ok, false);
});

test("freePromoPlacement features the listing, marks it comped and gives it an end date", () => {
  const r = freePromoPlacement(now);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.fields, {
    is_featured: true,
    subscription_tier: "premium",
    sponsor_paid_until: FREE_PROMO_ENDS_AT,
    sponsor_comp: true,
  });
  // It shows as Sponsored now and drops out by itself once the date passes.
  assert.equal(isSponsored(r.fields, now), true);
  assert.equal(isSponsored(r.fields, Date.parse(FREE_PROMO_ENDS_AT) + 1), false);
});

test("freePromoPlacement refuses after the window closes", () => {
  const r = freePromoPlacement(Date.parse("2027-02-01T00:00:00Z"));
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /ended/);
});

test("NO_PLACEMENT clears every placement column, including the comp flag", () => {
  assert.deepEqual(NO_PLACEMENT, { is_featured: false, subscription_tier: "free", sponsor_paid_until: null, sponsor_comp: false });
  assert.equal(isSponsored(NO_PLACEMENT, now), false);
});
