import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
