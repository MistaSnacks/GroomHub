// src/lib/metro-clusters.ts
// Maps city slugs to metro area groups for featured listing spillover.
// When a city has fewer than 3 featured groomers, we pull from
// other cities in the same metro cluster.

export interface MetroCluster {
  name: string;
  cities: string[]; // city_slug values (plain format, no state suffix)
}

export const METRO_CLUSTERS: MetroCluster[] = [
  {
    name: "Seattle Metro",
    cities: [
      "seattle", "bellevue", "redmond", "kirkland", "renton",
      "kent", "tacoma", "federal-way", "lynnwood", "everett",
      "bothell", "issaquah", "burien", "auburn", "sammamish",
      "shoreline", "edmonds", "woodinville", "tukwila", "seatac",
      "mercer-island", "kenmore", "lake-forest-park",
    ],
  },
  {
    name: "Portland Metro",
    cities: [
      "portland", "beaverton", "tigard", "lake-oswego", "gresham",
      "hillsboro", "vancouver", "milwaukie", "tualatin", "oregon-city",
      "west-linn", "sherwood", "happy-valley", "clackamas",
      "wilsonville", "canby", "troutdale", "wood-village",
    ],
  },
  {
    name: "Olympia Area",
    cities: ["olympia", "lacey", "tumwater"],
  },
  {
    name: "Spokane Metro",
    cities: ["spokane", "spokane-valley", "liberty-lake", "cheney"],
  },
  {
    name: "Salem Metro",
    cities: ["salem", "keizer", "silverton", "woodburn"],
  },
  {
    name: "Tri-Cities",
    cities: ["kennewick", "richland", "pasco"],
  },
];

const cityToCluster = new Map<string, MetroCluster>();
for (const cluster of METRO_CLUSTERS) {
  for (const city of cluster.cities) {
    cityToCluster.set(city, cluster);
  }
}

/**
 * Get all city slugs in the same metro cluster as the given city.
 * Returns an empty array if the city is not in any cluster.
 * Excludes the input city itself.
 */
export function getMetroNeighbors(citySlug: string): string[] {
  const plain = citySlug.replace(/-wa$|-or$/, "");
  const cluster = cityToCluster.get(plain);
  if (!cluster) return [];
  return cluster.cities.filter((c) => c !== plain);
}

/**
 * Get the metro cluster name for a city, or null if not in a cluster.
 */
export function getMetroClusterName(citySlug: string): string | null {
  const plain = citySlug.replace(/-wa$|-or$/, "");
  return cityToCluster.get(plain)?.name ?? null;
}

/** Maximum featured listings shown per city page */
export const FEATURED_SPOTS_PER_CITY = 3;
