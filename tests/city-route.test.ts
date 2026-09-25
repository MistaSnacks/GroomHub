import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalCityRouteSlug, ensureCanonicalCityRoute } from "@/lib/city-route";

test("canonicalCityRouteSlug lowercases and strips one legacy suffix", () => {
  assert.equal(canonicalCityRouteSlug("Seattle"), "seattle");
  assert.equal(canonicalCityRouteSlug("seattle-wa"), "seattle");
  assert.equal(canonicalCityRouteSlug("portland-or"), "portland");
  assert.equal(canonicalCityRouteSlug("seattle-wa-wa"), "seattle-wa");
});

test("ensureCanonicalCityRoute returns canonical params without redirecting", () => {
  assert.deepEqual(ensureCanonicalCityRoute("/dog-grooming", "wa", "seattle"), { state: "wa", city: "seattle" });
});

test("ensureCanonicalCityRoute issues a 308 to the canonical URL", () => {
  assert.throws(
    () => ensureCanonicalCityRoute("/dog-grooming", "WA", "Seattle-wa"),
    (err: unknown) => {
      const digest = (err as { digest?: string }).digest ?? "";
      return digest.includes("NEXT_REDIRECT") && digest.includes("/dog-grooming/wa/seattle") && digest.includes("308");
    }
  );
});
