import { test } from "node:test";
import assert from "node:assert/strict";
import { isSponsored, sortRegularList, activeSponsorshipFilter } from "@/lib/listing-rules";

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
