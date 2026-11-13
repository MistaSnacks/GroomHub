import data from "@/data/city-price-tables.json";
import { canonicalCityRouteSlug } from "@/lib/city-route";

/**
 * Published starting prices by city, read off groomer websites on 2026-10-01.
 * scripts/build-city-price-tables.ts rebuilds src/data/city-price-tables.json from
 * docs/price-harvest/2026-10-01/city_price_tables.json. A city and service appears
 * only when 3 or more of its groomers post a price.
 */

export const PUBLISHED_PRICES_ARTICLE_PATH = "/blog/dog-grooming-prices-pnw-price-index-2026";

export type PublishedService =
  | "full_groom"
  | "bath"
  | "puppy_groom"
  | "deshed"
  | "nail_trim"
  | "face_feet_fanny"
  | "teeth"
  | "add_on";

export interface PublishedPriceRow {
  service: PublishedService;
  label: string;
  /** Groomers in the city that publish a price for the service. */
  groomers: number;
  /** Whole dollars. */
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
}

export interface CityPublishedPrices {
  /** Day the prices were read, YYYY-MM-DD. */
  collectedOn: string;
  /** Groomers in the city with any published price. */
  groomerCount: number;
  rows: readonly PublishedPriceRow[];
}

interface CityEntry {
  groomerCount: number;
  rows: PublishedPriceRow[];
}

const CITIES: Record<string, CityEntry> = data.cities as Record<string, CityEntry>;

export function cityPublishedPrices(stateAbbr: string, citySlug: string): CityPublishedPrices | null {
  const entry = CITIES[`${stateAbbr.toUpperCase()}:${canonicalCityRouteSlug(citySlug)}`];
  return entry ? { collectedOn: data.collectedOn, ...entry } : null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-10-01" becomes "October 1, 2026". */
export function formatCollectedOn(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
