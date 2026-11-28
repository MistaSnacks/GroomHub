import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import robots from "@/app/robots";

test("flat sitemap is not shadowed by a static public/sitemap.xml", () => {
  assert.equal(existsSync("public/sitemap.xml"), false);
});

test("sitemap route is flat, cached daily, and avoids 15s CMS fetches", () => {
  const src = readFileSync("src/app/sitemap.ts", "utf8");
  assert.doesNotMatch(src, /export\s+(async\s+)?function\s+generateSitemaps\b/);
  assert.match(src, /export const revalidate = 86400;/);
  assert.doesNotMatch(src, /\b(getBlogPosts|getMarketingPages)\(/);
});

test("robots.txt points only to the single flat sitemap", () => {
  const config = robots();
  assert.equal(config.sitemap, "https://groomlocal.com/sitemap.xml");
});

test("revalidate route refreshes /sitemap.xml instead of chunk 0", () => {
  const src = readFileSync("src/app/api/revalidate/route.ts", "utf8");
  assert.ok(src.includes('"/sitemap.xml"'));
  assert.ok(!src.includes('"/sitemap/0.xml"'));
});
