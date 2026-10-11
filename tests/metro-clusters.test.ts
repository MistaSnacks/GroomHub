import { test } from "node:test";
import assert from "node:assert/strict";
import {
  METRO_CLUSTERS,
  getMetroClusterBySlug,
  getMetroClusterForCity,
  getMetroNeighbors,
  getMetroNeighborSlugs,
  metroMembers,
  visitsCityViaMetro,
} from "@/lib/metro-clusters";

test("metro slugs are unique and every city belongs to at most one metro", () => {
  const slugs = METRO_CLUSTERS.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const seen = new Map<string, string>();
  for (const c of METRO_CLUSTERS) {
    for (const city of metroMembers(c)) {
      const key = `${city.state}:${city.slug}`;
      assert.ok(!seen.has(key), `${key} is in both ${seen.get(key)} and ${c.slug}`);
      seen.set(key, c.slug);
    }
  }
});

test("metro lookups accept plain and state-suffixed city slugs", () => {
  assert.equal(getMetroClusterForCity("keizer", "OR")?.slug, "salem-metro");
  assert.equal(getMetroClusterForCity("keizer-or", "or")?.slug, "salem-metro");
  assert.equal(getMetroClusterForCity("vancouver-wa", "WA")?.slug, "portland-metro");
  assert.equal(getMetroClusterForCity("nowhere", "WA"), null);
  assert.equal(getMetroClusterBySlug("salem-metro")?.name, "Salem Metro");
  assert.equal(getMetroClusterBySlug("made-up"), null);
  assert.equal(getMetroClusterBySlug(null), null);
});

const salemMobile = { service_metro: "salem-metro", service_tags: ["mobile-grooming", "full-groom"], city_slug: "salem", state: "OR" };

test("a Salem mobile groomer who picked Salem Metro visits Keizer, Silverton and Woodburn", () => {
  assert.equal(visitsCityViaMetro(salemMobile, "keizer", "OR"), true);
  assert.equal(visitsCityViaMetro(salemMobile, "silverton-or", "OR"), true);
  assert.equal(visitsCityViaMetro(salemMobile, "woodburn", "OR"), true);
});

test("visitors never repeat on their own city's page or leak outside the metro", () => {
  assert.equal(visitsCityViaMetro(salemMobile, "salem", "OR"), false, "already in Salem's main list");
  assert.equal(visitsCityViaMetro({ ...salemMobile, city_slug: "salem-or" }, "salem", "OR"), false);
  assert.equal(visitsCityViaMetro(salemMobile, "portland", "OR"), false);
  assert.equal(visitsCityViaMetro(salemMobile, "eugene", "OR"), false);
});

test("only mobile groomers with a real metro choice count as visitors", () => {
  assert.equal(visitsCityViaMetro({ ...salemMobile, service_tags: ["full-groom"] }, "keizer", "OR"), false, "salons do not travel");
  assert.equal(visitsCityViaMetro({ ...salemMobile, service_metro: null }, "keizer", "OR"), false);
  assert.equal(visitsCityViaMetro({ ...salemMobile, service_metro: "made-up" }, "keizer", "OR"), false);
});

test("Portland Metro crosses the state line: a Vancouver WA groomer visits Portland OR", () => {
  const vancouver = { service_metro: "portland-metro", service_tags: ["mobile-grooming"], city_slug: "vancouver", state: "WA" };
  assert.equal(visitsCityViaMetro(vancouver, "portland", "OR"), true);
  assert.equal(visitsCityViaMetro(vancouver, "vancouver", "WA"), false);
});

test("a slug that exists in both states only joins the metro in its own state", () => {
  assert.equal(getMetroClusterForCity("redmond", "WA")?.slug, "seattle-metro");
  assert.equal(getMetroClusterForCity("redmond", "OR"), null, "Redmond OR is in central Oregon, not Seattle Metro");
  assert.deepEqual(getMetroNeighbors("redmond", "OR"), []);
  const seattleMobile = { service_metro: "seattle-metro", service_tags: ["mobile-grooming"], city_slug: "kirkland", state: "WA" };
  assert.equal(visitsCityViaMetro(seattleMobile, "redmond", "WA"), true);
  assert.equal(visitsCityViaMetro(seattleMobile, "redmond", "OR"), false);
});

test("Vancouver WA and Portland OR share featured spillover across the state line", () => {
  const fromPortland = getMetroNeighbors("portland", "OR");
  assert.ok(fromPortland.some((c) => c.slug === "vancouver" && c.state === "WA"));
  const fromVancouver = getMetroNeighbors("vancouver", "WA");
  assert.ok(fromVancouver.some((c) => c.slug === "portland" && c.state === "OR"));
  assert.ok(fromVancouver.some((c) => c.slug === "forest-grove" && c.state === "OR"));
  assert.ok(!fromVancouver.some((c) => c.slug === "vancouver"), "a city is never its own neighbor");
});

test("nearby-city links stay in the page's own state", () => {
  assert.deepEqual(getMetroNeighborSlugs("vancouver", "WA"), [], "Vancouver's other metro cities are all in Oregon");
  assert.ok(!getMetroNeighborSlugs("portland", "OR").includes("vancouver"));
  assert.ok(getMetroNeighborSlugs("portland", "OR").includes("beaverton"));
});

test("Kitsap County is its own metro", () => {
  assert.equal(getMetroClusterForCity("poulsbo", "WA")?.slug, "kitsap-county");
  assert.deepEqual(getMetroNeighborSlugs("poulsbo", "WA").sort(), ["bainbridge-island", "bremerton", "port-orchard", "silverdale"]);
  assert.equal(getMetroClusterForCity("forest-grove", "OR")?.slug, "portland-metro");
});

test("Tacoma Metro (Pierce County) is separate from Seattle Metro", () => {
  for (const city of ["tacoma", "lakewood", "puyallup", "gig-harbor", "university-place"]) {
    assert.equal(getMetroClusterForCity(city, "WA")?.slug, "tacoma-metro", city);
  }
  for (const city of ["seattle", "kirkland", "federal-way", "auburn"]) {
    assert.equal(getMetroClusterForCity(city, "WA")?.slug, "seattle-metro", city);
  }
  assert.ok(!getMetroNeighborSlugs("seattle", "WA").includes("tacoma"));
  assert.ok(!getMetroNeighborSlugs("lakewood", "WA").includes("seattle"));
});
