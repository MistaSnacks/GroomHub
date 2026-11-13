import { test } from "node:test";
import assert from "node:assert/strict";
import { cityPublishedPrices } from "@/lib/city-price-tables";
import { buildDogGroomingFaqs } from "@/lib/city-faqs";

test("Tacoma FAQ leads with real figures, then keeps the general guidance", () => {
  const prices = cityPublishedPrices("WA", "tacoma");
  const [cost] = buildDogGroomingFaqs("Tacoma", "WA", [], 0, prices);
  assert.ok(
    cost.answer.startsWith(
      "Groomer websites in Tacoma list a median starting price of $50 for a bath and brush (5 groomers) and $12 for a nail trim (3 groomers), collected October 1, 2026.",
    ),
    cost.answer,
  );
  assert.match(cost.answer, /typically costs \$45 to \$100 for a standard bath and haircut/);
});

test("a city without published prices keeps the old FAQ cost answer", () => {
  const [cost] = buildDogGroomingFaqs("Ontario", "OR", [], 0, null);
  assert.equal(
    cost.answer,
    "Dog grooming in Ontario, Oregon typically costs $35 to $85 for a standard bath and haircut, depending on your dog's size, breed, and coat condition. Prices may be higher for large breeds or dogs with matted fur. Compare 0 groomers on GroomLocal to find the best value.",
  );
  assert.deepEqual(buildDogGroomingFaqs("Ontario", "OR", [], 0), buildDogGroomingFaqs("Ontario", "OR", [], 0, null));
});

test("a city with only minor services gets no figures in the FAQ lead", () => {
  const prices = cityPublishedPrices("WA", "port-orchard");
  const [cost] = buildDogGroomingFaqs("Port Orchard", "WA", [], 0, prices);
  assert.ok(cost.answer.startsWith("Dog grooming in Port Orchard"));
});
