// Shared predicate for filtering out stock, placeholder, and junk image URLs
// that leaked in from scraping (Google Maps logo assets, corrupt markdown
// fragments, expired Firecrawl screenshot links).

const JUNK_PATTERNS = [
  "placehold.co",
  "placeholder",
  "unsplash.com",
  "pexels.com",
  "google.com/images/branding",
  "firecrawl-scrape-media",
];

export function isUsableListingImage(url: string): boolean {
  if (!url) return false;
  if (JUNK_PATTERNS.some((p) => url.includes(p))) return false;
  // Corrupt markdown fragments like "...png)![](https://..." are not valid URLs
  if (url.includes(")![](") || url.includes("![](")) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  return true;
}

export function usableListingImages(images: string[] | null | undefined): string[] {
  return (images || []).filter(isUsableListingImage);
}
