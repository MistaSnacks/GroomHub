import { permanentRedirect } from "next/navigation";

/**
 * City routes have exactly one canonical shape: lowercase state slug and a
 * lowercase city slug without a legacy "-wa" / "-or" suffix. Any other
 * spelling (e.g. "/dog-grooming/wa/Seattle" or ".../seattle-wa") would
 * otherwise render a duplicate page with a self-referencing canonical.
 */
const LEGACY_CITY_SUFFIXES = ["-wa", "-or"];

export function canonicalCityRouteSlug(city: string): string {
  let slug = city.toLowerCase();
  for (const suffix of LEGACY_CITY_SUFFIXES) {
    if (slug.endsWith(suffix)) {
      slug = slug.slice(0, -suffix.length);
      break;
    }
  }
  return slug;
}

/**
 * Permanently redirects to the canonical city URL when the requested params
 * are a non-canonical spelling. Returns the normalized params otherwise.
 */
export function ensureCanonicalCityRoute(
  basePath: string,
  rawState: string,
  rawCity: string,
): { state: string; city: string } {
  const state = rawState.toLowerCase();
  const city = canonicalCityRouteSlug(rawCity);
  if (state !== rawState || city !== rawCity) {
    permanentRedirect(`${basePath}/${state}/${city}`);
  }
  return { state, city };
}
