/** Reviewed 2026-09-12. Preserve source records and owner assets; serve one public profile per location. */
export const LISTING_REDIRECTS: Record<string, string> = {
  "sarahs-groomingdales-pet-salon-tacoma": "sarah-s-groomingdale-s-pet-salon",
  "best-in-show": "best-in-show-dog-grooming-brookings",
};

// Young Style announced closure on its official business page (2018–2025).
export const PUBLIC_EXCLUDED_SLUGS = [
  ...Object.keys(LISTING_REDIRECTS),
  "young-style-pet-beauty-and-spa-bellevue",
];
export const PUBLIC_EXCLUDED_FILTER = `(${PUBLIC_EXCLUDED_SLUGS.join(",")})`;
