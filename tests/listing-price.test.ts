import { test } from "node:test";
import assert from "node:assert/strict";
import { listingPriceLabel } from "@/lib/listing-price";
import { pricingTiers } from "@/lib/pricing";

test("listingPriceLabel covers range, starting price, tier and fallback", () => {
  assert.equal(listingPriceLabel({ price_min: 60, price_max: 90 }), "$60–$90");
  assert.equal(listingPriceLabel({ price_min: 60, price_max: 0 }), "From $60");
  assert.equal(listingPriceLabel({ price_min: 0, price_max: 0, price_range: "$$" }), "$$");
  assert.equal(listingPriceLabel({ price_min: 0, price_max: 0, price_range: "cheap" }), "Ask for a quote");
  assert.equal(listingPriceLabel({ price_min: NaN, price_max: 0, price_range: null }), "Ask for a quote");
});

test("pricing offers exactly Free and Sponsored with the promised annual discount", () => {
  assert.deepEqual(pricingTiers.map((t) => t.slug), ["free", "premium"]);
  const sponsored = pricingTiers[1];
  assert.equal(sponsored.name, "Sponsored");
  assert.equal(sponsored.annualPrice, Math.round((sponsored.price * 10) / 12));
  assert.ok(sponsored.features.some((f) => /labeled "Sponsored"/.test(f.text)));
});
