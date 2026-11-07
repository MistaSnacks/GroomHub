import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { hoursUnconfirmed, isDefaultHours, listedServiceTags, servicesUnknown, SERVICES_NOT_LISTED_LINE, UNCONFIRMED_HOURS_LINE } from "@/lib/listing-facts";
import { dollars, selectHarvestedPrices, shouldShowHarvestedPrices, type PriceRow } from "@/lib/harvested-prices";
import { HarvestedPricesSection, HoursSection, ServicesSection } from "@/components/profile/profile-sections";
import { localBusinessSchema } from "@/lib/schema";
import type { NormalizedListing } from "@/lib/types";

// --- Placeholder services ----------------------------------------------------

test("the import placeholder on an unclaimed listing is not a known service list", () => {
  assert.equal(servicesUnknown({ services: ["full groom"], owner_id: null }), true);
  assert.equal(servicesUnknown({ services: [" Full Groom "], owner_id: undefined }), true);
  assert.equal(servicesUnknown({ services: [], owner_id: null }), true);
  assert.deepEqual(listedServiceTags({ services: ["full groom"] }, ["full-groom"]), []);
});

test("real services, and a claimed listing's services, are shown", () => {
  assert.equal(servicesUnknown({ services: ["full groom", "cat grooming"] }), false);
  assert.equal(servicesUnknown({ services: ["Nail Care"] }), false);
  assert.equal(servicesUnknown({ services: ["full groom"], owner_id: "owner-1" }), false);
  assert.deepEqual(listedServiceTags({ services: ["Full Groom", "Nail Care"] }, ["full-groom", "nail-care"]), ["full-groom", "nail-care"]);
});

test("a placeholder profile says services are not listed; an enriched one lists them", () => {
  const placeholder = renderToStaticMarkup(createElement(ServicesSection, { listing: { listed_service_tags: [] } }));
  assert.match(placeholder, new RegExp(SERVICES_NOT_LISTED_LINE));
  assert.doesNotMatch(placeholder, /Full Groom/);

  // The shape a listing takes once the enrichment diff is applied (services stored as tag labels).
  const enriched = renderToStaticMarkup(createElement(ServicesSection, { listing: { listed_service_tags: listedServiceTags({ services: ["Full Groom", "Nail Care", "Ear Cleaning"] }, ["full-groom", "nail-care", "ear-cleaning"]) } }));
  assert.match(enriched, /Full Groom/);
  assert.match(enriched, /Nail Care/);
  assert.match(enriched, /Ear Cleaning/);
  assert.doesNotMatch(enriched, new RegExp(SERVICES_NOT_LISTED_LINE));
});

// --- Default hours -----------------------------------------------------------

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const week = (open: string, close: string) => DAYS.map((day) => ({ day, open, close, closed: false }));

test("isDefaultHours matches seven open days of 9 to 5 in either time format", () => {
  assert.equal(isDefaultHours(week("9:00 AM", "5:00 PM")), true);
  assert.equal(isDefaultHours(week("9:00 AM", "5:00 PM")), true);
  assert.equal(isDefaultHours(week("09:00", "17:00")), true);
});

test("isDefaultHours leaves real hours alone", () => {
  const sundayOff = week("9:00 AM", "5:00 PM").map((h) => (h.day === "Sunday" ? { ...h, open: "", close: "", closed: true } : h));
  assert.equal(isDefaultHours(sundayOff), false);
  assert.equal(isDefaultHours(week("8:00 AM", "5:00 PM")), false);
  assert.equal(isDefaultHours(week("9:00 AM", "5:00 PM").slice(0, 6)), false);
  assert.equal(isDefaultHours([]), false);
  assert.equal(isDefaultHours(null), false);
});

test("the hours card says hours are unconfirmed for the default week", () => {
  const html = renderToStaticMarkup(createElement(HoursSection, { hours: week("9:00 AM", "5:00 PM") }));
  assert.match(html, new RegExp(UNCONFIRMED_HOURS_LINE.replace(".", "\\.")));
  assert.doesNotMatch(html, /Monday/);
  const real = renderToStaticMarkup(createElement(HoursSection, { hours: week("8:00 AM", "6:00 PM") }));
  assert.match(real, /Monday/);
});

test("a claimed listing's default-looking hours count as the owner's", () => {
  const html = renderToStaticMarkup(createElement(HoursSection, { hours: week("9:00 AM", "5:00 PM"), ownerId: "owner-1" }));
  assert.match(html, /Monday/);
  assert.doesNotMatch(html, new RegExp(UNCONFIRMED_HOURS_LINE.replace(".", "\\.")));
  assert.equal(hoursUnconfirmed({ hours: week("9:00 AM", "5:00 PM"), owner_id: "owner-1" }), false);
  assert.equal(hoursUnconfirmed({ hours: week("9:00 AM", "5:00 PM"), owner_id: null }), true);
});

test("unknown services show nothing when the harvested price list is on the page", () => {
  const html = renderToStaticMarkup(createElement(ServicesSection, { listing: { listed_service_tags: [] }, hideWhenUnknown: true }));
  assert.equal(html, "");
  const known = renderToStaticMarkup(createElement(ServicesSection, { listing: { listed_service_tags: ["nail-care"] }, hideWhenUnknown: true }));
  assert.match(known, /Services/);
});

test("JSON-LD drops default hours and unknown services", () => {
  const base = {
    id: "id-1", slug: "acme", name: "Acme", address: "1 Main", city: "Olympia", state: "WA", zip: "98501", description: "", short_description: "",
    images: [], phone: "", price_min: 0, price_max: 0, service_tags: ["full-groom"], listed_service_tags: [], specialty_tags: [], feature_tags: [],
  } as unknown as NormalizedListing;
  const placeholder = localBusinessSchema({ ...base, hours: week("9:00 AM", "5:00 PM") });
  assert.equal("openingHoursSpecification" in placeholder, false);
  assert.equal("hasOfferCatalog" in placeholder, false);
  const real = localBusinessSchema({ ...base, hours: week("8:00 AM", "6:00 PM"), listed_service_tags: ["full-groom"] });
  assert.equal((real.openingHoursSpecification as unknown[]).length, 7);
  assert.equal("hasOfferCatalog" in real, true);
  assert.equal("makesOffer" in real, false);
});

// --- Harvested prices --------------------------------------------------------

const row = (over: Partial<PriceRow>): PriceRow => ({
  listing_id: "L1",
  normalized_service: "full_groom",
  price_low: "80",
  price_type: "fixed",
  source_url: "https://acme.example/prices",
  retrieved_at: "2026-10-01T08:20:46+00:00",
  ...over,
});

test("selectHarvestedPrices keeps the lowest non-hourly price per service and drops add-ons", () => {
  const sets = selectHarvestedPrices([
    row({ price_low: "80" }),
    row({ price_low: "65", price_type: "starting_at", source_url: "https://acme.example/full" }),
    row({ price_low: "30", price_type: "hourly" }),
    row({ normalized_service: "bath", price_low: "22.5", price_type: "range" }),
    row({ normalized_service: "add_on", price_low: "5" }),
    row({ normalized_service: "other", price_low: "3" }),
    row({ normalized_service: "nail_trim", price_low: "" }),
    row({ normalized_service: "teeth", price_low: "10", source_url: "javascript:alert(1)" }),
    row({ listing_id: "L2", normalized_service: "nail_trim", price_low: "15" }),
  ]);
  assert.deepEqual(sets.L1, {
    seenOn: "2026-10-01",
    prices: [
      { service: "full_groom", from: 65, sourceUrl: "https://acme.example/full" },
      { service: "bath", from: 22.5, sourceUrl: "https://acme.example/prices" },
    ],
  });
  assert.deepEqual(sets.L2.prices.map((p) => p.service), ["nail_trim"]);
  assert.equal(dollars(22.5), "$22.50");
  assert.equal(dollars(65), "$65");
});

test("the owner's own price hides the harvested block", () => {
  const set = { seenOn: "2026-10-01", prices: [{ service: "bath" as const, from: 40, sourceUrl: "https://acme.example/" }] };
  assert.equal(shouldShowHarvestedPrices({ price_min: 0 }, set), true);
  assert.equal(shouldShowHarvestedPrices({ price_min: 55 }, set), false);
  assert.equal(shouldShowHarvestedPrices({ price_min: 0 }, null), false);
});

test("the harvested block shows starting prices, the date seen, and each source", () => {
  const html = renderToStaticMarkup(
    createElement(HarvestedPricesSection, {
      name: "Acme",
      set: { seenOn: "2026-10-01", prices: [{ service: "full_groom", from: 65, sourceUrl: "https://acme.example/full" }] },
    })
  );
  assert.match(html, /Prices from their website/);
  assert.match(html, /Seen on their website, Oct 1, 2026/);
  assert.match(html, /Starting at \$65/);
  assert.match(html, /href="https:\/\/acme\.example\/full"/);
  assert.doesNotMatch(html, /[\u2013\u2014]/);
});
