import { test } from "node:test";
import assert from "node:assert/strict";
import { profileMetaDescription } from "@/lib/profile-description";

const spokane = { name: "4 Paws Grooming", city: "Spokane", state: "WA" };
const bend = { name: "Bo", city: "Bend", state: "OR" };
const long =
  "Family-run salon offering full grooms, baths, nail trims and de-shedding for dogs of every size, with calm handling and same-week appointments.";

const cases = {
  long: { ...spokane, text: long },
  padded: { ...spokane, text: "Pet grooming in Spokane, WA" },
  fallback: { ...bend, text: "Gentle grooming for dogs" },
  empty: { ...spokane, text: "" },
};

test("profile description never mentions prices when the page shows none", () => {
  for (const [branch, input] of Object.entries(cases)) {
    const out = profileMetaDescription({ ...input, showsPrices: false });
    assert.doesNotMatch(out, /pric/i, `${branch}: ${out}`);
  }
});

test("profile description may mention pricing when the page shows prices", () => {
  for (const branch of ["padded", "fallback", "empty"] as const) {
    const out = profileMetaDescription({ ...cases[branch], showsPrices: true });
    assert.match(out, /pricing/i, `${branch}: ${out}`);
  }
});

test("padded description ends the raw text with a period", () => {
  for (const showsPrices of [false, true]) {
    const out = profileMetaDescription({ ...cases.padded, showsPrices });
    assert.match(out, /Pet grooming in Spokane, WA\. /, out);
  }
});

test("profile description stays within the 155 char limit", () => {
  for (const input of Object.values(cases)) {
    for (const showsPrices of [false, true]) {
      const out = profileMetaDescription({ ...input, showsPrices });
      assert.ok(out.length <= 155, `${out.length}: ${out}`);
    }
  }
});
