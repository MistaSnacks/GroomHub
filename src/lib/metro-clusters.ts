// src/lib/metro-clusters.ts
// Maps city slugs to metro area groups. Used for featured listing spillover
// (when a city has fewer than 3 featured groomers, we pull from other cities in
// the same metro cluster) and for mobile groomers' service areas: a mobile
// groomer can pick one metro and is shown on every city page in it.
//
// Cities are listed under their state because some slugs exist in both states
// (Redmond WA is in Seattle Metro; Redmond OR is not). A metro may cross the
// state line: Vancouver WA belongs to Portland Metro.

export type MetroState = "WA" | "OR";

export interface MetroCluster {
  /** Stable id stored in business_listings.service_metro. Never rename. */
  slug: string;
  name: string;
  /** Plain city_slug values (no "-wa"/"-or" suffix), grouped by state. */
  cities: Partial<Record<MetroState, string[]>>;
}

export interface MetroCity {
  slug: string;
  state: MetroState;
}

export const METRO_CLUSTERS: MetroCluster[] = [
  {
    slug: "seattle-metro",
    name: "Seattle Metro",
    cities: {
      WA: [
        // King and Snohomish counties. Tacoma and the rest of Pierce County are Tacoma Metro.
        "seattle", "bellevue", "redmond", "kirkland", "renton",
        "kent", "federal-way", "lynnwood", "everett",
        "bothell", "issaquah", "burien", "auburn", "sammamish",
        "shoreline", "edmonds", "woodinville", "tukwila", "seatac",
        "mercer-island", "kenmore", "lake-forest-park",
        // King County towns that got listings when the Seattle listings were corrected (2026-10-04).
        "normandy-park", "duvall", "black-diamond",
      ],
    },
  },
  {
    // Split from Seattle Metro 2026-10-04 (owner decision): Pierce County.
    slug: "tacoma-metro",
    name: "Tacoma Metro",
    cities: {
      WA: [
        "tacoma", "lakewood", "university-place", "puyallup", "gig-harbor",
        "fircrest", "fife", "steilacoom", "dupont", "spanaway", "parkland",
        "graham", "bonney-lake", "sumner", "edgewood", "orting", "buckley", "eatonville",
      ],
    },
  },
  {
    slug: "portland-metro",
    name: "Portland Metro",
    cities: {
      OR: [
        "portland", "beaverton", "tigard", "lake-oswego", "gresham",
        "hillsboro", "milwaukie", "tualatin", "oregon-city",
        "west-linn", "sherwood", "happy-valley", "clackamas",
        "wilsonville", "canby", "troutdale", "wood-village",
        // Added 2026-10-02 so featured groomers in Forest Grove reach the region.
        "forest-grove",
      ],
      // Across the river from Portland; shares spots with the Oregon side (owner decision 2026-10-04).
      WA: ["vancouver"],
    },
  },
  {
    slug: "olympia-area",
    name: "Olympia Area",
    cities: { WA: ["olympia", "lacey", "tumwater"] },
  },
  {
    slug: "spokane-metro",
    name: "Spokane Metro",
    cities: { WA: ["spokane", "spokane-valley", "liberty-lake", "cheney"] },
  },
  {
    slug: "salem-metro",
    name: "Salem Metro",
    cities: { OR: ["salem", "keizer", "silverton", "woodburn"] },
  },
  {
    slug: "tri-cities",
    name: "Tri-Cities",
    cities: { WA: ["kennewick", "richland", "pasco"] },
  },
  {
    // Added 2026-10-04 (owner decision). Kitsap County only; Gig Harbor (Pierce County) is in Tacoma Metro.
    slug: "kitsap-county",
    name: "Kitsap County",
    cities: { WA: ["poulsbo", "bremerton", "silverdale", "port-orchard", "bainbridge-island"] },
  },
];

function plainCity(citySlug: string): string {
  return citySlug.replace(/-wa$|-or$/, "");
}

function cityKey(citySlug: string, stateAbbr: string): string {
  return `${stateAbbr.toUpperCase()}:${plainCity(citySlug)}`;
}

/** Every city in a metro, with its state. */
export function metroMembers(cluster: MetroCluster): MetroCity[] {
  return (Object.entries(cluster.cities) as [MetroState, string[]][]).flatMap(([state, slugs]) =>
    slugs.map((slug) => ({ slug, state }))
  );
}

const cityToCluster = new Map<string, MetroCluster>();
for (const cluster of METRO_CLUSTERS) {
  for (const city of metroMembers(cluster)) {
    cityToCluster.set(cityKey(city.slug, city.state), cluster);
  }
}

/** The cluster a city belongs to, or null. Accepts plain or state-suffixed slugs. */
export function getMetroClusterForCity(citySlug: string, stateAbbr: string): MetroCluster | null {
  return cityToCluster.get(cityKey(citySlug, stateAbbr)) ?? null;
}

/** True when the city (in that state) is part of the cluster. */
export function isMetroMember(cluster: MetroCluster, citySlug: string, stateAbbr: string): boolean {
  return getMetroClusterForCity(citySlug, stateAbbr) === cluster;
}

/**
 * The other cities in the same metro as the given city, in any state.
 * Returns an empty array if the city is not in any cluster.
 */
export function getMetroNeighbors(citySlug: string, stateAbbr: string): MetroCity[] {
  const cluster = getMetroClusterForCity(citySlug, stateAbbr);
  if (!cluster) return [];
  const self = cityKey(citySlug, stateAbbr);
  return metroMembers(cluster).filter((c) => cityKey(c.slug, c.state) !== self);
}

/** Neighbor slugs in the same state only, for "nearby cities" links built from a one-state city list. */
export function getMetroNeighborSlugs(citySlug: string, stateAbbr: string): string[] {
  const state = stateAbbr.toUpperCase();
  return getMetroNeighbors(citySlug, stateAbbr)
    .filter((c) => c.state === state)
    .map((c) => c.slug);
}

export function getMetroClusterBySlug(slug: string | null | undefined): MetroCluster | null {
  if (!slug) return null;
  return METRO_CLUSTERS.find((c) => c.slug === slug) ?? null;
}

export interface MetroServiceFields {
  service_metro?: string | null;
  service_tags: string[];
  city_slug: string;
  state: string;
}

/**
 * True when a mobile groomer based in another city has chosen the metro this
 * city belongs to, so they should appear on this city's pages as a visitor.
 * Listings based in the city itself are already in its main list.
 */
export function visitsCityViaMetro(listing: MetroServiceFields, citySlug: string, stateAbbr: string): boolean {
  if (!listing.service_tags.includes("mobile-grooming")) return false;
  const cluster = getMetroClusterBySlug(listing.service_metro);
  if (!cluster || !isMetroMember(cluster, citySlug, stateAbbr)) return false;
  const basedHere = cityKey(listing.city_slug, listing.state) === cityKey(citySlug, stateAbbr);
  return !basedHere;
}

/** Maximum featured listings shown per city page */
export const FEATURED_SPOTS_PER_CITY = 3;
