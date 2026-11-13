import { test } from "node:test";
import assert from "node:assert/strict";
import { profileIndexing, type IndexingListing } from "@/lib/profile-indexing";
import { ABOUT_FALLBACK } from "@/lib/profile-description";
import type { HarvestedPriceSet } from "@/lib/harvested-prices";

const FAR_FUTURE = "2099-01-01T00:00:00.000Z";
const none = new Set<string>();
const harvested: HarvestedPriceSet = { seenOn: "2026-10-01", prices: [{ service: "bath", from: 40, sourceUrl: "https://example.com" }] };
const photo = "https://example.com/dog.jpg";

const thin: IndexingListing = { slug: "thin-groomer", description: "", images: [], price_min: 0 };
const text = (n: number) => "a".repeat(n);

test("a profile with no price, description or photo is thin", () => {
  assert.deepEqual(profileIndexing(thin, null, none), { index: false, reason: "thin" });
});

test("each page field alone gives has-data", () => {
  assert.deepEqual(profileIndexing({ ...thin, price_min: 35 }, null, none), { index: true, reason: "has-data" });
  assert.deepEqual(profileIndexing(thin, harvested, none), { index: true, reason: "has-data" });
  assert.deepEqual(profileIndexing({ ...thin, description: text(120) }, null, none), { index: true, reason: "has-data" });
  assert.deepEqual(profileIndexing({ ...thin, images: [photo] }, null, none), { index: true, reason: "has-data" });
});

test("a junk photo is not data", () => {
  assert.equal(profileIndexing({ ...thin, images: ["https://placehold.co/600x400"] }, null, none).reason, "thin");
});

test("a description counts from 80 characters, measured after sanitizing", () => {
  assert.equal(profileIndexing({ ...thin, description: text(79) }, null, none).reason, "thin");
  assert.equal(profileIndexing({ ...thin, description: text(80) }, null, none).reason, "has-data");
  assert.equal(profileIndexing({ ...thin, description: `${text(79)} https://example.com/long/path/here` }, null, none).reason, "thin");
  assert.equal(profileIndexing({ ...thin, description: `## ${text(79)}` }, null, none).reason, "thin");
});

test("the page placeholder and a missing description are not data", () => {
  assert.equal(profileIndexing({ ...thin, description: ABOUT_FALLBACK }, null, none).reason, "thin");
  assert.equal(profileIndexing({ ...thin, description: undefined }, null, none).reason, "thin");
  assert.equal(profileIndexing({ ...thin, description: null }, null, none).reason, "thin");
});

test("an owner, a live sponsorship, or a search-visible slug keeps a thin profile indexed", () => {
  assert.deepEqual(profileIndexing({ ...thin, owner_id: "u1" }, null, none), { index: true, reason: "claimed" });
  assert.deepEqual(profileIndexing({ ...thin, is_featured: true, sponsor_paid_until: FAR_FUTURE, sponsor_comp: true }, null, none), {
    index: true,
    reason: "sponsored",
  });
  assert.deepEqual(profileIndexing(thin, null, new Set(["thin-groomer"])), { index: true, reason: "search-visible" });
});

test("a lapsed sponsorship does not count", () => {
  const lapsed = { ...thin, is_featured: true, sponsor_paid_until: "2020-01-01T00:00:00.000Z" };
  assert.equal(profileIndexing(lapsed, null, none).reason, "thin");
});

test("the reason is the first match in order: has-data, claimed, sponsored, search-visible", () => {
  const all: IndexingListing = { ...thin, price_min: 35, owner_id: "u1", is_featured: true, sponsor_paid_until: FAR_FUTURE };
  const keep = new Set(["thin-groomer"]);
  assert.equal(profileIndexing(all, null, keep).reason, "has-data");
  assert.equal(profileIndexing({ ...all, price_min: 0 }, null, keep).reason, "claimed");
  assert.equal(profileIndexing({ ...all, price_min: 0, owner_id: undefined }, null, keep).reason, "sponsored");
  assert.equal(profileIndexing({ ...all, price_min: 0, owner_id: undefined, is_featured: false }, null, keep).reason, "search-visible");
});
