/** Reviewed 2026-09-12. Preserve source records and owner assets; serve one public profile per location. */
export const LISTING_REDIRECTS: Record<string, string> = {
  "sarahs-groomingdales-pet-salon-tacoma": "sarah-s-groomingdale-s-pet-salon",
  "best-in-show": "best-in-show-dog-grooming-brookings",
  // Same Shoreline shop imported twice (2026-02-24 and 2026-02-25); the -wa record carries the real profile data.
  "beast-brush": "beast-brush-wa",
  // Same shops imported twice (2026-02-24 and 2026-03-01), same address and phone; found 2026-10-04.
  // The kept records have the photos, booking link and outreach history.
  "floof-pet-grooming-greenlake-seattle": "floof-pet-grooming-seattle",
  "pawfect-wash-lake-city-seattle": "pawfect-wash-seattle",
  // Same Renton address and phone; the -wa record preserves the verified profile and booking link.
  // Seattle's Rainier Avenue location remains separate. Reviewed 2026-10-04 against grooming4pets.com.
  "happy-paws-salon-camino": "happy-paws-salon-camino-wa",
  "happy-paws-salon-cats-dogs-grooming-w-pick-up-and-drop-off-services-renton": "happy-paws-salon-camino-wa",
};

// Young Style announced closure on its official business page (2018–2025).
export const PUBLIC_EXCLUDED_SLUGS = [
  ...Object.keys(LISTING_REDIRECTS),
  "young-style-pet-beauty-and-spa-bellevue",
  // Supply retailer, not a grooming salon: https://www.cgsupplies.com/about-us (reviewed 2026-10-04).
  "cascade-grooming-supplies-llc-monroe",
];
export const PUBLIC_EXCLUDED_FILTER = `(${PUBLIC_EXCLUDED_SLUGS.join(",")})`;
