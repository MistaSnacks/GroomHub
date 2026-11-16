import test from "node:test";
import assert from "node:assert/strict";
import { LISTING_SLUG_RANGES, compareByRatingThenId } from "../src/lib/listing-row-buckets";

function inRange(slug: string, [from, to]: readonly [string | null, string | null]): boolean {
  return (from === null || slug >= from) && (to === null || slug < to);
}

test("slug ranges start and end open and touch end to end", () => {
  assert.equal(LISTING_SLUG_RANGES[0][0], null);
  assert.equal(LISTING_SLUG_RANGES[LISTING_SLUG_RANGES.length - 1][1], null);
  for (let i = 1; i < LISTING_SLUG_RANGES.length; i++) {
    assert.equal(LISTING_SLUG_RANGES[i][0], LISTING_SLUG_RANGES[i - 1][1]);
  }
});

test("every slug falls in exactly one range", () => {
  const slugs = ["", "1-dog-spa", "a", "czz", "d", "dog-house", "j", "paws", "pz", "t", "tacoma-tails", "zz", "~"];
  for (const slug of slugs) {
    assert.equal(LISTING_SLUG_RANGES.filter((r) => inRange(slug, r)).length, 1, slug);
  }
});

test("rows sort by rating desc with nulls first, then id asc", () => {
  const rows = [
    { id: "b", rating: 4.5 },
    { id: "c", rating: null },
    { id: "a", rating: 4.5 },
    { id: "d", rating: 5 },
  ];
  assert.deepEqual(rows.sort(compareByRatingThenId).map((r) => r.id), ["c", "d", "a", "b"]);
});
