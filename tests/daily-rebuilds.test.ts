import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { LISTING_ROUTES } from "@/lib/refresh-listing-pages";

// Each directory page rebuild reads Supabase, and bots crawl every page. A
// 5-minute window used up the Supabase egress quota in Nov 2026.
const MIN_SECONDS = 86400;

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === "page.tsx" ? [path] : [];
  });
}

test("no page rebuilds more often than once a day", () => {
  const short: string[] = [];
  for (const file of pages("src/app")) {
    const m = readFileSync(file, "utf8").match(/export const revalidate = (\d+)/);
    if (m && Number(m[1]) < MIN_SECONDS && !/src\/app\/(about|pricing)\//.test(file)) short.push(`${file}: ${m[1]}`);
  }
  assert.deepEqual(short, []);
});

test("every listing save refreshes the pages", () => {
  const actions = ["get-listed", "admin/dashboard/listings", "admin/dashboard/claims", "dashboard", "dashboard/photos", "claim"];
  for (const dir of actions) {
    const src = readFileSync(join("src/app", dir, "actions.ts"), "utf8");
    assert.ok(src.includes("refreshListingPages()"), dir);
    assert.ok(!src.includes('updateTag("listings")'), dir);
  }
});

// A page rebuilds as often as its shortest cache. A 300 s guide-link entry and the
// CMS SDK's 15 s fetches once made "daily" pages rebuild every few minutes.
test("caches read by directory pages last a day", () => {
  const short: string[] = [];
  for (const file of ["src/lib/blog.ts", "src/lib/cms/marketing.ts", "src/lib/supabase/queries.ts"]) {
    for (const m of readFileSync(file, "utf8").matchAll(/(.*)revalidate: ?(\d+)/g)) {
      if (Number(m[2]) < MIN_SECONDS && !m[1].includes("retryInFiveMinutes")) short.push(`${file}: ${m[2]}`);
    }
  }
  assert.deepEqual(short, []);
});

test("directory pages do not read the CMS directly", () => {
  const files = [...LISTING_ROUTES.map((r) => join("src/app", r, "page.tsx")), "src/components/home-guides-section.tsx"];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /\b(getBlogPosts|getMarketingPages?|readCollection|getGuideTopics)\(/, file);
  }
});

test("a failed database read never renders as an empty page", () => {
  const src = readFileSync("src/lib/supabase/queries.ts", "utf8");
  for (const name of ["getFeaturedListings", "getFeaturedByCity", "getMobileGroomersVisitingCity", "getCityBySlugUncached", "getTotalListingCount"]) {
    const start = src.indexOf(`function ${name}(`);
    assert.ok(start > 0, name);
    const body = src.slice(start, src.indexOf("\n}\n", start));
    assert.ok(body.includes("throw new Error("), name);
    assert.doesNotMatch(body, /if \((error|\w+Error)[^)]*\) (return|\{[^}]*return)/, name);
  }
});
