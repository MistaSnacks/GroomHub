// Read-only. Counts which groomer profiles are noindex under profileIndexing() on live data and writes
// .audit/thin-profile-report.md. The listed profiles are the first candidates for data enrichment.
//   npx tsx --import ./tests/setup-env.ts scripts/thin-profile-report.ts
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import keepList from "../src/data/search-keep-list.json";
import { harvestedPricesFor } from "../src/lib/harvested-prices";
import { hasProfileData, profileIndexing, SEARCH_KEEP_SLUGS, type IndexReason } from "../src/lib/profile-indexing";

// tests/setup-env.ts pre-fills placeholder Supabase variables, so the real ones override them
// before queries.ts builds its client.
config({ path: ".env.local", override: true, quiet: true });

const CITIES = [
  { name: "Tacoma", state: "WA" },
  { name: "Lakewood", state: "WA" },
  { name: "Seattle", state: "WA" },
  { name: "Portland", state: "OR" },
];
const NAMES_PER_CITY = 15;
const REASONS: IndexReason[] = ["has-data", "claimed", "sponsored", "search-visible", "thin"];
const percent = (part: number, whole: number) => `${((100 * part) / whole).toFixed(1)}%`;

async function main() {
  const { fetchAllListingRows, hasKnownCity, withTagsAll } = await import("../src/lib/supabase/queries");
  const listings = withTagsAll(await fetchAllListingRows()).filter(hasKnownCity);
  const rated = listings.map((listing) => {
    const harvested = harvestedPricesFor(listing.id);
    return { listing, belowFloor: !hasProfileData(listing, harvested), ...profileIndexing(listing, harvested, SEARCH_KEEP_SLUGS) };
  });

  const total = rated.length;
  const byReason = new Map(REASONS.map((r) => [r, rated.filter((x) => x.reason === r).length]));
  const belowFloor = rated.filter((x) => x.belowFloor);
  const belowFloorNoTags = belowFloor.filter((x) => x.listing.listed_service_tags.length === 0);
  const noindex = rated.filter((x) => !x.index);
  const slugs = new Set(listings.map((l) => l.slug));
  const keepMatched = keepList.slugs.filter((s) => slugs.has(s)).length;
  const rescued = belowFloor.filter((x) => x.index).length;

  const warning =
    noindex.length / total > 0.7
      ? `WARNING: the noindex share is over 70%. Check that the rule is not too strict.\n`
      : noindex.length / total < 0.05
        ? `WARNING: the noindex share is under 5%. The rule may be too loose to matter.\n`
        : "";

  const lines: string[] = [];
  lines.push(`# Thin profile report\n`, warning, `Live data read ${new Date().toISOString()}. Keep list generated ${keepList.generatedAt}.\n`);
  lines.push(`| Measure | Count | Share of profiles |`, `| --- | ---: | ---: |`);
  lines.push(`| Total profiles | ${total} | 100% |`);
  for (const r of REASONS) lines.push(`| Reason \`${r}\` | ${byReason.get(r)} | ${percent(byReason.get(r)!, total)} |`);
  lines.push(`| Thin by the 3-field floor, before exemptions | ${belowFloor.length} | ${percent(belowFloor.length, total)} |`);
  lines.push(`| Of those, with no real service tags | ${belowFloorNoTags.length} | ${percent(belowFloorNoTags.length, total)} |`);
  lines.push(`| Kept indexed by an exemption (claimed, sponsored, search-visible) | ${rescued} | ${percent(rescued, total)} |`);
  lines.push(`| **Final noindex** | **${noindex.length}** | **${percent(noindex.length, total)}** |`);
  lines.push(`| Profiles in the keep list | ${keepList.slugs.length} (${keepMatched} match a current profile) | |\n`);

  lines.push(`## Noindex by city\n`, `| City | Profiles | Noindex | Share |`, `| --- | ---: | ---: | ---: |`);
  const cityLists: string[] = [];
  for (const c of CITIES) {
    const inCity = rated.filter((x) => x.listing.city.trim().toLowerCase() === c.name.toLowerCase() && x.listing.state.toUpperCase() === c.state);
    const thinHere = inCity.filter((x) => !x.index);
    lines.push(`| ${c.name}, ${c.state} | ${inCity.length} | ${thinHere.length} | ${percent(thinHere.length, inCity.length || 1)} |`);
    cityLists.push(`### ${c.name}, ${c.state}\n`, ...thinHere.slice(0, NAMES_PER_CITY).map((x) => `- ${x.listing.name} (\`${x.listing.slug}\`)`), "");
  }
  lines.push("", `## Enrichment candidates\n`, `Up to ${NAMES_PER_CITY} noindex profiles per city, in rating order.\n`, ...cityLists);

  const dir = join(__dirname, "..", ".audit");
  mkdirSync(dir, { recursive: true });
  const text = `${lines.join("\n")}\n`;
  writeFileSync(join(dir, "thin-profile-report.md"), text);
  console.log(text);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
