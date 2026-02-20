// ─── Geography Registry ─────────────────────────────────
// State/city constants and helpers for the PNW directory.

export interface StateRecord {
  abbr: string;
  name: string;
  slug: string;
}

export interface CityRecord {
  slug: string;
  name: string;
  stateAbbr: string;
}

export const STATES: StateRecord[] = [
  { abbr: "WA", name: "Washington", slug: "wa" },
  { abbr: "OR", name: "Oregon", slug: "or" },
];

const stateByAbbr = new Map(STATES.map((s) => [s.abbr, s]));
const stateBySlug = new Map(STATES.map((s) => [s.slug, s]));

export function getStateByAbbr(abbr: string): StateRecord | undefined {
  return stateByAbbr.get(abbr.toUpperCase());
}

export function getStateBySlug(slug: string): StateRecord | undefined {
  return stateBySlug.get(slug.toLowerCase());
}

export function stateSlugFromAbbr(abbr: string): string {
  return abbr.toLowerCase();
}

export function stateAbbrFromSlug(slug: string): string {
  return slug.toUpperCase();
}

export function stateNameFromAbbr(abbr: string): string {
  return getStateByAbbr(abbr)?.name ?? abbr;
}

export function stateNameFromSlug(slug: string): string {
  return getStateBySlug(slug)?.name ?? slug;
}

export function isValidStateSlug(slug: string): boolean {
  return stateBySlug.has(slug.toLowerCase());
}

/**
 * Build the canonical directory URL for a city.
 * e.g., buildCityPath("wa", "seattle") → "/dog-grooming/wa/seattle"
 */
export function buildCityPath(stateSlug: string, citySlug: string): string {
  return `/dog-grooming/${stateSlug}/${citySlug}`;
}

/**
 * Build the canonical URL for a service landing page.
 * e.g., buildServicePath("full-groom") → "/services/full-groom"
 */
export function buildServicePath(slug: string): string {
  return `/services/${slug}`;
}

/**
 * Build the canonical URL for a specialty landing page.
 * e.g., buildSpecialtyPath("doodle-poodle") → "/specialties/doodle-poodle"
 */
export function buildSpecialtyPath(slug: string): string {
  return `/specialties/${slug}`;
}

/**
 * Build a service-specific city path.
 * e.g., buildServiceCityPath("cat-grooming", "wa", "seattle") → "/cat-grooming/wa/seattle"
 */
export function buildServiceCityPath(
  service: string,
  stateSlug: string,
  citySlug: string
): string {
  return `/${service}/${stateSlug}/${citySlug}`;
}
