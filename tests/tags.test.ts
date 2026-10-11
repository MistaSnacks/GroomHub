import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTags, SERVICE_TAGS, SPECIALTY_TAGS, matchServiceTag } from "@/lib/tags";

test("normalizeTags defaults to full-groom and maps aliases in both directions", () => {
  const none = normalizeTags({ services: ["something nobody offers"] });
  assert.deepEqual(none.service_tags, ["full-groom"]);
  assert.deepEqual(none.specialty_tags, []);
  assert.equal(none.price_tag, "$$");

  const cats = normalizeTags({ services: ["Cat Grooming"], price_range: "$$$" });
  assert.ok(cats.service_tags.includes("cat-grooming"));
  assert.ok(cats.specialty_tags.includes("cat-specialist"));
  assert.equal(cats.price_tag, "$$$");
});

test("feature tags follow the boolean columns in a fixed order", () => {
  const all = normalizeTags({ is_paw_verified: true, transparent_pricing: true, walk_ins_accepted: true, vaccination_required: true });
  assert.deepEqual(all.feature_tags, ["paw-verified", "transparent-pricing", "walk-ins-welcome", "vaccinations-required"]);
});

test("labels saved by the owner dashboard resolve to their tags", () => {
  const tags = normalizeTags({ services: ["Dog Bath", "Nail Care", "Puppy Grooming"], specialties: ["Fear-Free / Anxiety", "Doodle & Poodle Expert"] });
  assert.deepEqual(tags.service_tags, ["dog-bath", "nail-care", "puppy-grooming"]);
  assert.deepEqual(tags.specialty_tags, ["fear-free", "doodle-poodle"]);
});

test("alias lookup is case and whitespace insensitive", () => {
  assert.equal(matchServiceTag("  FULL GROOM "), matchServiceTag("full groom"));
});

test("every alias resolves to exactly one tag within its table", () => {
  for (const table of [SERVICE_TAGS, SPECIALTY_TAGS]) {
    const seen = new Map<string, string>();
    for (const tag of table) {
      for (const alias of [tag.slug, tag.label, ...(tag.aliases ?? [])]) {
        const key = alias.trim().toLowerCase();
        const prior = seen.get(key);
        assert.ok(!prior || prior === tag.slug, `alias "${alias}" is claimed by both ${prior} and ${tag.slug}`);
        seen.set(key, tag.slug);
      }
    }
  }
});
