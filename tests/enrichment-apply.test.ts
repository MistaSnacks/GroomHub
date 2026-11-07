import assert from "node:assert/strict";
import test from "node:test";
import { bookingUrl, mapToTags, planListing, type ListingRow, type Proposal } from "../scripts/apply-enrichment-2026-10-14";

const row = (over: Partial<ListingRow> = {}): ListingRow => ({
  id: "id-1",
  slug: "acme",
  owner_id: null,
  services: ["full groom"],
  specialties: [],
  booking_url: null,
  grooms_cats: false,
  year_established: null,
  ...over,
});

const proposal: Proposal = {
  slug: "acme",
  fields: {
    services: { value: [], verified_value: ["nail trim", "bath & brush", "sanitary trim", "dematting"] },
    specialties: { value: [], verified_value: ["senior dogs", "appointment only"] },
    booking_url: { value: "https://booking.moego.pet/ol/Acme/book", verified: true },
    grooms_cats: { value: true, verified: true },
    year_established: { value: 2011, verified: true },
  },
};

test("services and specialties map to tag labels; unmatched values are dropped", () => {
  assert.deepEqual(mapToTags(["nail trim", "bath & brush", "sanitary trim", "dematting"], ["senior dogs", "appointment only"]), {
    services: ["Nail Care", "Dog Bath"],
    specialties: ["De-Matting Specialist", "Senior Pets"],
    unmatched: ["sanitary trim", "appointment only"],
  });
});

test("an unclaimed listing gets the placeholder replaced and empty fields filled", () => {
  const { plan } = planListing(row(), proposal);
  assert.deepEqual(
    plan.changes.map((c) => c.field),
    ["services", "specialties", "booking_url", "grooms_cats", "year_established"]
  );
});

test("a claimed listing keeps its placeholder services and its cats flag; only empty fields fill", () => {
  const { plan } = planListing(row({ owner_id: "owner" }), proposal);
  assert.deepEqual(
    plan.changes.map((c) => c.field),
    ["specialties", "booking_url", "year_established"]
  );
});

test("owner-entered values are never replaced", () => {
  const { plan } = planListing(row({ owner_id: "owner", services: ["Nail Care"], specialties: ["Large Dogs"], booking_url: "https://x.example/book", year_established: 1999, grooms_cats: true }), proposal);
  assert.deepEqual(plan.changes, []);
});

test("a platform's bare home page is not a booking link", () => {
  assert.equal(bookingUrl("http://daysmartpet.com"), null);
  assert.equal(bookingUrl("https://dogspaw.portal.gingrapp.com/"), "https://dogspaw.portal.gingrapp.com/");
  assert.equal(bookingUrl("javascript:alert(1)"), null);
});
