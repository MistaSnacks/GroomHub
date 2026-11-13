// Read-only. Writes src/data/search-keep-list.json: every groomer profile Google showed in the last 90 days.
// Thin profiles on this list stay indexed so they never lose a ranking they already have.
//   npx tsx --import ./tests/setup-env.ts scripts/build-search-keep-list.ts
import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { googleAccessToken, listingSlugFromPageUrl, searchAnalytics, searchWindow } from "../src/lib/search-console";

config({ path: ".env.local", quiet: true });

const WINDOW_DAYS = 90;

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const { startDate, endDate } = searchWindow(today, WINDOW_DAYS);
  const token = await googleAccessToken();
  const rows = await searchAnalytics(token, {
    startDate,
    endDate,
    dimensions: ["page"],
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/groomer/" }] }],
    rowLimit: 25000,
  });
  const slugs = new Set<string>();
  for (const row of rows) {
    const slug = listingSlugFromPageUrl(row.keys?.[0] ?? "");
    if (slug && row.impressions >= 1) slugs.add(slug);
  }
  const out = join(__dirname, "..", "src", "data", "search-keep-list.json");
  const list = { generatedAt: new Date().toISOString(), windowDays: WINDOW_DAYS, slugs: [...slugs].sort() };
  writeFileSync(out, `${JSON.stringify(list, null, 1)}\n`);
  console.log(`${rows.length} page rows, ${startDate} to ${endDate}, ${slugs.size} profile slugs written to ${out}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
