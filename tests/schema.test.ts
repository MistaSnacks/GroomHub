import { test } from "node:test";
import assert from "node:assert/strict";
import { localBusinessSchema, itemListSchema, cityFaqSchema, cityPageSchema } from "@/lib/schema";
import type { NormalizedListing } from "@/lib/types";

function listing(overrides: Partial<NormalizedListing> = {}): NormalizedListing {
  return {
    id: "l1", slug: "happy-paws", name: "Happy Paws", description: "A friendly neighborhood salon for dogs and cats of every size.",
    short_description: "", address: "1 Main St", city: "Seattle", city_slug: "seattle", state: "WA", zip: "98101",
    phone: "206-555-0100", website: "https://happypaws.example", email: "hi@happypaws.example", rating: 4.8, review_count: 12,
    price_range: "$$", price_min: 60, price_max: 90, transparent_pricing: true, services: ["full groom"], specialties: [],
    hours: [{ day: "Monday", open: "9:00", close: "17:00" }, { day: "Funday", open: "9:00", close: "17:00" }, { day: "Tuesday", open: "9am", close: "5pm" }],
    images: ["http://cdn.example/a.jpg"], badges: [], is_featured: false, is_paw_verified: false, breeds: [], lat: 47.6, lng: -122.3,
    service_tags: ["full-groom"], specialty_tags: [], feature_tags: [], price_tag: "$$",
    ...overrides,
  } as unknown as NormalizedListing;
}

test("localBusinessSchema normalizes image, validates hours and website, sanitizes description", () => {
  const s = localBusinessSchema(listing()) as Record<string, unknown>;
  assert.equal(s.image, "https://cdn.example/a.jpg");
  const hours = s.openingHoursSpecification as { dayOfWeek: string }[];
  assert.deepEqual(hours.map((h) => h.dayOfWeek), ["Monday"]);
  assert.equal(s.url, "https://happypaws.example");
  assert.equal(s.telephone, "206-555-0100");

  const bad = localBusinessSchema(listing({ website: "javascript:alert(1)", description: "short", images: ["javascript:x"], lat: 0, lng: 0 })) as Record<string, unknown>;
  assert.equal(bad.url, undefined);
  assert.equal(bad.description, undefined);
  assert.equal(bad.image, undefined);
  assert.equal(bad.geo, undefined);

  const long = localBusinessSchema(listing({ description: "x".repeat(400) + " https://spam.example/<b>hi</b>" })) as Record<string, unknown>;
  assert.equal((long.description as string).length, 300);
  assert.ok((long.description as string).endsWith("..."));
});

test("localBusinessSchema omits maxPrice when it is not above minPrice", () => {
  const s = localBusinessSchema(listing({ price_min: 60, price_max: 60 })) as Record<string, unknown>;
  const spec = s.priceSpecification as Record<string, unknown> | undefined;
  assert.ok(!spec || spec.maxPrice === undefined);
});

test("itemListSchema caps at 20 and cityPageSchema has a single @context", () => {
  const many = Array.from({ length: 25 }, (_, i) => listing({ id: `l${i}`, slug: `s${i}` }));
  const list = itemListSchema(many, "Test");
  assert.equal(list.numberOfItems, 20);
  assert.equal(list.itemListElement.length, 20);

  const page = cityPageSchema(many, "Seattle", "WA", "wa", "seattle", [{ question: "Q?", answer: "A." }, { question: " ", answer: "x" }]);
  const json = JSON.stringify(page);
  assert.equal((json.match(/"@context"/g) ?? []).length, 1);
  const faq = (page["@graph"] as Record<string, unknown>[]).find((g) => g["@type"] === "FAQPage") as { mainEntity: unknown[] };
  assert.equal(faq.mainEntity.length, 1);
});

test("cityFaqSchema drops blank pairs", () => {
  const s = cityFaqSchema([{ question: "Q", answer: "" }, { question: "", answer: "A" }, { question: " Q2 ", answer: " A2 " }]);
  assert.deepEqual(s.mainEntity.map((m) => m.name), ["Q2"]);
});
