import { test } from "node:test";
import assert from "node:assert/strict";
import { cityPublishedPrices, formatCollectedOn, PUBLISHED_PRICES_ARTICLE_PATH } from "@/lib/city-price-tables";
import { dollars } from "../scripts/build-city-price-tables";

function row(state: string, city: string, service: string) {
  const found = cityPublishedPrices(state, city)?.rows.find((r) => r.service === service);
  assert.ok(found, `${state} ${city} ${service} row`);
  return found;
}

test("Seattle bath and brush matches the published index", () => {
  const bath = row("WA", "seattle", "bath");
  assert.equal(bath.label, "Bath and brush");
  assert.deepEqual(
    [bath.groomers, bath.median, bath.p25, bath.p75, bath.min, bath.max],
    [4, 41, 25, 55, 20, 55],
  );
});

test("Eugene full groom and Portland nail trim match the published index", () => {
  assert.deepEqual([row("OR", "eugene", "full_groom").groomers, row("OR", "eugene", "full_groom").median], [6, 70]);
  assert.deepEqual([row("OR", "portland", "nail_trim").groomers, row("OR", "portland", "nail_trim").median], [5, 15]);
});

test("groomer counts match the published index", () => {
  const counts = [
    ["WA", "seattle", 8],
    ["WA", "tacoma", 6],
    ["OR", "portland", 6],
    ["OR", "eugene", 7],
    ["WA", "vancouver", 9],
  ] as const;
  for (const [state, city, count] of counts) {
    assert.equal(cityPublishedPrices(state, city)?.groomerCount, count, `${state} ${city}`);
  }
});

test("city snapshot medians match the published article table", () => {
  const snapshot: [string, string, string, number, number][] = [
    ["WA", "seattle", "bath", 41, 4],
    ["WA", "seattle", "nail_trim", 18, 7],
    ["WA", "tacoma", "bath", 50, 5],
    ["WA", "tacoma", "nail_trim", 12, 3],
    ["WA", "vancouver", "full_groom", 78, 4],
    ["WA", "vancouver", "bath", 35, 7],
    ["WA", "vancouver", "nail_trim", 16, 5],
    ["WA", "everett", "full_groom", 92, 4],
    ["WA", "everett", "bath", 50, 4],
    ["WA", "puyallup", "full_groom", 75, 4],
    ["WA", "puyallup", "bath", 50, 3],
    ["WA", "puyallup", "nail_trim", 15, 3],
    ["WA", "spokane", "full_groom", 64, 3],
    ["WA", "spokane", "nail_trim", 10, 3],
    ["OR", "portland", "nail_trim", 15, 5],
    ["OR", "eugene", "full_groom", 70, 6],
    ["OR", "eugene", "bath", 40, 5],
    ["OR", "eugene", "nail_trim", 20, 5],
    ["OR", "bend", "full_groom", 80, 3],
    ["OR", "bend", "bath", 37, 3],
  ];
  for (const [state, city, service, median, groomers] of snapshot) {
    const r = row(state, city, service);
    assert.deepEqual([r.median, r.groomers], [median, groomers], `${city} ${service}`);
  }
});

test("a city with no published prices returns null", () => {
  assert.equal(cityPublishedPrices("OR", "ontario"), null);
  assert.equal(cityPublishedPrices("WA", "portland"), null);
});

test("lookup canonicalizes the state and the city slug", () => {
  const expected = cityPublishedPrices("WA", "seattle");
  assert.ok(expected);
  assert.deepEqual(cityPublishedPrices("wa", "Seattle"), expected);
  assert.deepEqual(cityPublishedPrices("WA", "seattle-wa"), expected);
  assert.equal(cityPublishedPrices("OR", "port-orchard"), null);
  assert.ok(cityPublishedPrices("WA", "port-orchard"));
});

test("every row has at least three groomers and ordered percentiles", () => {
  for (const [state, city] of [["WA", "seattle"], ["WA", "tacoma"], ["OR", "portland"], ["WA", "puyallup"]]) {
    const prices = cityPublishedPrices(state, city);
    assert.ok(prices && prices.rows.length > 0);
    for (const r of prices.rows) {
      assert.ok(r.groomers >= 3);
      assert.ok(r.min <= r.p25 && r.p25 <= r.median && r.median <= r.p75 && r.p75 <= r.max, `${city} ${r.service}`);
    }
  }
});

test("collection date reads as a plain date", () => {
  assert.equal(cityPublishedPrices("WA", "seattle")?.collectedOn, "2026-10-01");
  assert.equal(formatCollectedOn("2026-10-01"), "October 1, 2026");
});

test("dollars rounds ties to the even dollar like the published tables", () => {
  assert.deepEqual([67.5, 7.5, 8.5, 12.5, 77.5, 4.5, 25.25, 51.25].map(dollars), [68, 8, 8, 12, 78, 4, 25, 51]);
});

test("the article path points at the price index post", () => {
  assert.equal(PUBLISHED_PRICES_ARTICLE_PATH, "/blog/dog-grooming-prices-pnw-price-index-2026");
});
