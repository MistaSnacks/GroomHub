// Turn the price harvest CSV into src/data/harvested-prices.json (lowest published price per service per listing).
//   npx tsx scripts/build-harvested-prices.ts [docs/price-harvest/2026-10-01/prices.csv]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { selectHarvestedPrices, type PriceRow } from "../src/lib/harvested-prices";

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v !== ""));
}

const source = process.argv[2] ?? join(__dirname, "..", "docs", "price-harvest", "2026-10-01", "prices.csv");
const [header, ...body] = parseCsv(readFileSync(source, "utf8"));
const rows = body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])) as unknown as PriceRow);
const sets = selectHarvestedPrices(rows);
const out = join(__dirname, "..", "src", "data", "harvested-prices.json");
writeFileSync(out, `${JSON.stringify(sets, null, 1)}\n`);
const prices = Object.values(sets).reduce((n, s) => n + s.prices.length, 0);
console.log(`${rows.length} rows read, ${Object.keys(sets).length} listings, ${prices} service prices written to ${out}`);
