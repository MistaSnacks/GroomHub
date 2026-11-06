import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GUIDE_SLUGS,
  LINK_TOKEN,
  guideLinksFor,
  homeGuideSlugs,
  type GuideLink,
  type LinkContext,
} from "@/lib/internal-links";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";

const COST = "dog-grooming-cost-seattle-portland-2026";
const MOBILE = "mobile-dog-grooming-cost-guide";
const PRICE_INDEX = "dog-grooming-prices-pnw-price-index-2026";
const ALL_LIVE: ReadonlySet<string> = new Set([...GUIDE_SLUGS, PRICE_INDEX]);

const city = (cityName: string, state: string, hasMobile = false): LinkContext => ({
  kind: "city",
  state,
  citySlug: cityName.toLowerCase().replace(/ /g, "-"),
  cityName,
  hasMobile,
});

const groomer = (cityName: string, state: string, isMobile = false): LinkContext => ({
  kind: "groomer",
  state,
  citySlug: cityName.toLowerCase().replace(/ /g, "-"),
  cityName,
  isMobile,
});

const everyContext: LinkContext[] = [
  { kind: "mobile-hub" },
  city("Seattle", "WA", true),
  city("Spokane", "WA", true),
  groomer("Portland", "OR", true),
  groomer("Bend", "OR"),
  ...SERVICE_TAGS.map((t): LinkContext => ({ kind: "service", slug: t.slug })),
  ...SPECIALTY_TAGS.map((t): LinkContext => ({ kind: "specialty", slug: t.slug })),
];

const costAnchor = (links: GuideLink[]) => links.find((l) => l.slug === COST)?.anchor;

test("city pages anchor the cost guide by metro", () => {
  assert.equal(costAnchor(guideLinksFor(city("Seattle", "WA"), ALL_LIVE)), "how much dog grooming costs");
  assert.equal(costAnchor(guideLinksFor(city("Portland", "OR"), ALL_LIVE)), "how much dog grooming costs");
  assert.equal(costAnchor(guideLinksFor(city("Bellevue", "WA"), ALL_LIVE)), "Seattle dog grooming prices");
  assert.equal(costAnchor(guideLinksFor(city("Mercer Island", "WA"), ALL_LIVE)), "Seattle dog grooming prices");
  assert.equal(costAnchor(guideLinksFor(city("Oregon City", "OR"), ALL_LIVE)), "Portland dog grooming prices");
  assert.equal(costAnchor(guideLinksFor(city("Spokane", "WA"), ALL_LIVE)), "how much dog grooming costs in Washington");
  assert.equal(costAnchor(guideLinksFor(city("Tacoma", "WA"), ALL_LIVE)), "how much dog grooming costs in Washington");
  assert.equal(costAnchor(guideLinksFor(city("Bend", "OR"), ALL_LIVE)), "how much it costs to groom a dog in Oregon");
});

test("a metro city name in the wrong state does not take the metro anchor", () => {
  assert.equal(costAnchor(guideLinksFor(city("Portland", "WA"), ALL_LIVE)), "how much dog grooming costs in Washington");
});

test("the mobile guide appears on a city page only when the page shows mobile groomers", () => {
  const without = guideLinksFor(city("Bend", "OR", false), ALL_LIVE).map((l) => l.slug);
  const withMobile = guideLinksFor(city("Bend", "OR", true), ALL_LIVE).map((l) => l.slug);
  assert.deepEqual(without, [COST]);
  assert.deepEqual(withMobile, [COST, MOBILE]);
});

test("a groomer profile gets one sentence at most", () => {
  assert.deepEqual(guideLinksFor(groomer("Bend", "OR"), ALL_LIVE), []);
  assert.deepEqual(guideLinksFor(groomer("Spokane", "WA"), ALL_LIVE), []);
  assert.deepEqual(guideLinksFor(groomer("Bellevue", "WA"), ALL_LIVE).map((l) => l.slug), [COST]);
  assert.equal(costAnchor(guideLinksFor(groomer("Beaverton", "OR"), ALL_LIVE)), "how much a groom costs around Portland");
  assert.deepEqual(guideLinksFor(groomer("Bend", "OR", true), ALL_LIVE).map((l) => l.slug), [MOBILE]);
});

test("a mobile groomer in a metro city links the mobile guide, not the cost guide", () => {
  assert.deepEqual(guideLinksFor(groomer("Seattle", "WA", true), ALL_LIVE).map((l) => l.slug), [MOBILE]);
});

test("the mobile guide shows only in mobile contexts", () => {
  const allowed = (ctx: LinkContext) =>
    ctx.kind === "mobile-hub" ||
    (ctx.kind === "city" && ctx.hasMobile) ||
    (ctx.kind === "groomer" && ctx.isMobile) ||
    (ctx.kind === "service" && (ctx.slug === "mobile-grooming" || ctx.slug === "dog-bath"));
  for (const ctx of everyContext) {
    const hasMobileLink = guideLinksFor(ctx, ALL_LIVE).some((l) => l.slug === MOBILE);
    if (hasMobileLink) assert.ok(allowed(ctx), `unexpected mobile guide link in ${JSON.stringify(ctx)}`);
  }
  assert.ok(guideLinksFor({ kind: "mobile-hub" }, ALL_LIVE).some((l) => l.slug === MOBILE));
  assert.ok(!guideLinksFor({ kind: "service", slug: "self-wash" }, ALL_LIVE).some((l) => l.slug === MOBILE));
});

test("no link is returned for a slug that is not published", () => {
  const published = new Set<string>([MOBILE]);
  for (const ctx of everyContext) {
    for (const link of guideLinksFor(ctx, published)) assert.ok(published.has(link.slug));
  }
  assert.deepEqual(guideLinksFor(city("Seattle", "WA", true), published).map((l) => l.slug), [MOBILE]);
  assert.deepEqual(guideLinksFor(city("Seattle", "WA", true), new Set()), []);
});

test("the home section lists the two cost guides first, then nail trim and tipping", () => {
  assert.deepEqual(homeGuideSlugs(ALL_LIVE), [
    COST,
    MOBILE,
    "dog-nail-trimming-cost-guide",
    "how-much-to-tip-dog-groomer",
  ]);
});

test("service and specialty pages follow the plan", () => {
  const slugs = (kind: "service" | "specialty", slug: string) =>
    guideLinksFor({ kind, slug }, ALL_LIVE).map((l) => l.slug);
  assert.deepEqual(slugs("service", "dog-bath"), [COST, MOBILE]);
  assert.deepEqual(slugs("service", "self-wash"), [COST]);
  assert.deepEqual(slugs("service", "ear-cleaning"), [COST, "dog-ear-cleaning-grooming-guide"]);
  assert.deepEqual(slugs("service", "boarding"), []);
  assert.deepEqual(slugs("service", "daycare"), []);
  assert.deepEqual(slugs("specialty", "reactive-dogs"), ["grooming-anxious-dogs-stress-free-guide"]);
  assert.deepEqual(slugs("specialty", "large-dogs"), [COST]);
  assert.deepEqual(slugs("specialty", "not-a-specialty"), []);
});

test("template links never target the price index or use the bare head-term anchor", () => {
  for (const ctx of everyContext) {
    for (const link of guideLinksFor(ctx, ALL_LIVE)) {
      assert.notEqual(link.slug as string, PRICE_INDEX);
      assert.notEqual(link.anchor.toLowerCase(), "dog grooming prices");
    }
  }
});

test("every sentence has exactly one link slot and a plain voice", () => {
  for (const ctx of everyContext) {
    for (const link of guideLinksFor(ctx, ALL_LIVE)) {
      assert.equal(link.sentence.split(LINK_TOKEN).length, 2, `${link.anchor}: ${link.sentence}`);
      assert.doesNotMatch(link.sentence + link.anchor, /[–—]|furry friend/i);
    }
  }
});
