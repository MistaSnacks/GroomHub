import data from "@/data/harvested-prices.json";

/**
 * Starting prices read off groomers' own websites on 2026-10-01 (docs/price-harvest).
 * scripts/build-harvested-prices.ts turns prices.csv into src/data/harvested-prices.json
 * with selectHarvestedPrices(); profiles read it with harvestedPricesFor().
 */

export const HARVESTED_SERVICES = [
  { key: "full_groom", label: "Full groom" },
  { key: "bath", label: "Bath and brush" },
  { key: "puppy_groom", label: "Puppy groom" },
  { key: "nail_trim", label: "Nail trim" },
  { key: "face_feet_fanny", label: "Face, feet and fanny trim" },
  { key: "deshed", label: "Deshedding" },
  { key: "teeth", label: "Teeth brushing" },
] as const;

export type HarvestedService = (typeof HARVESTED_SERVICES)[number]["key"];

const SERVICE_ORDER = new Map<string, number>(HARVESTED_SERVICES.map((s, i) => [s.key, i]));

export interface HarvestedPrice {
  service: HarvestedService;
  /** Dollars, the lowest published price for the service. */
  from: number;
  sourceUrl: string;
}

export interface HarvestedPriceSet {
  /** Pacific day the prices were read, YYYY-MM-DD. */
  seenOn: string;
  prices: HarvestedPrice[];
}

export interface PriceRow {
  listing_id: string;
  normalized_service: string;
  price_low: string;
  price_type: string;
  source_url: string;
  retrieved_at: string;
}

/**
 * The lowest published price per service for each listing. Hourly rates, add-ons and
 * "other" rows are left out: they do not say what a service costs.
 */
export function selectHarvestedPrices(rows: PriceRow[]): Record<string, HarvestedPriceSet> {
  const best = new Map<string, Map<HarvestedService, HarvestedPrice & { seenOn: string }>>();
  for (const r of rows) {
    if (r.price_type === "hourly" || !SERVICE_ORDER.has(r.normalized_service)) continue;
    const price = Number(r.price_low);
    if (!Number.isFinite(price) || price < 1) continue;
    let url: URL;
    try {
      url = new URL(r.source_url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const service = r.normalized_service as HarvestedService;
    const byService = best.get(r.listing_id) ?? new Map();
    const current = byService.get(service);
    if (!current || price < current.from) {
      byService.set(service, { service, from: price, sourceUrl: url.toString(), seenOn: r.retrieved_at.slice(0, 10) });
    }
    best.set(r.listing_id, byService);
  }
  const out: Record<string, HarvestedPriceSet> = {};
  for (const id of [...best.keys()].sort()) {
    const prices = [...best.get(id)!.values()].sort((a, b) => SERVICE_ORDER.get(a.service)! - SERVICE_ORDER.get(b.service)!);
    out[id] = {
      seenOn: prices.map((p) => p.seenOn).sort()[0],
      prices: prices.map(({ service, from, sourceUrl }) => ({ service, from, sourceUrl })),
    };
  }
  return out;
}

const SETS = data as Record<string, HarvestedPriceSet>;

export function harvestedPricesFor(listingId: string): HarvestedPriceSet | null {
  return SETS[listingId] ?? null;
}

export function harvestedServiceLabel(service: HarvestedService): string {
  return HARVESTED_SERVICES.find((s) => s.key === service)!.label;
}

/** The owner's own prices win: a listing with price_min set hides the harvested block. */
export function shouldShowHarvestedPrices(listing: { price_min?: number | null }, set: HarvestedPriceSet | null): set is HarvestedPriceSet {
  return !!set && set.prices.length > 0 && !(typeof listing.price_min === "number" && listing.price_min > 0);
}

export function listingShowsPrices(listing: { price_min?: number | null }, set: HarvestedPriceSet | null): boolean {
  return (listing.price_min ?? 0) > 0 || shouldShowHarvestedPrices(listing, set);
}

const seenFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "$40" or "$22.50" */
export function dollars(amount: number): string {
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/** "Oct 1, 2026" */
export function seenOnLabel(seenOn: string): string {
  return seenFormat.format(new Date(`${seenOn}T12:00:00Z`));
}
