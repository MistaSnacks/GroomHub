// Turn the price harvest city tables into src/data/city-price-tables.json (what the city pages read).
//   npx tsx scripts/build-city-price-tables.ts <path to city_price_tables.json>
// Source: docs/price-harvest/2026-10-01/city_price_tables.json in the site checkout.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface SourceStat {
  n: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
}

interface SourceCity {
  groomers_with_prices: number;
  services: Record<string, SourceStat>;
}

interface Source {
  meta: { retrieved: string; min_n: number; services: Record<string, string> };
  cities: Record<string, Record<string, SourceCity>>;
}

/** Whole dollars, ties to the even dollar: the rounding the published tables use. */
export function dollars(value: number): number {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

const SERVICE_ORDER = ["full_groom", "bath", "puppy_groom", "deshed", "nail_trim", "face_feet_fanny", "teeth", "add_on"];

export function buildCityPriceTables(source: Source) {
  const order = SERVICE_ORDER;
  const cities: Record<string, unknown> = {};
  for (const [state, byCity] of Object.entries(source.cities)) {
    for (const [slug, city] of Object.entries(byCity)) {
      const rows = order
        .filter((service) => city.services[service])
        .map((service) => {
          const s = city.services[service];
          if (s.n < source.meta.min_n) throw new Error(`${state}:${slug} ${service} has n=${s.n}`);
          return {
            service,
            label: source.meta.services[service],
            groomers: s.n,
            median: dollars(s.median),
            p25: dollars(s.p25),
            p75: dollars(s.p75),
            min: dollars(s.min),
            max: dollars(s.max),
          };
        });
      if (rows.length === 0) continue;
      cities[`${state}:${slug}`] = { groomerCount: city.groomers_with_prices, rows };
    }
  }
  return { collectedOn: source.meta.retrieved, cities };
}

if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.error("usage: npx tsx scripts/build-city-price-tables.ts <city_price_tables.json>");
    process.exit(1);
  }
  const tables = buildCityPriceTables(JSON.parse(readFileSync(input, "utf8")) as Source);
  const out = join(__dirname, "..", "src", "data", "city-price-tables.json");
  writeFileSync(out, `${JSON.stringify(tables, null, 1)}\n`);
  console.log(`${Object.keys(tables.cities).length} cities written to ${out}`);
}
