type ListingPrice = { price_min: number; price_max: number; price_range?: string | null };

/** Zero maximum means the salon publishes a starting price, not a ceiling. */
export function listingPriceLabel(listing: ListingPrice): string {
  const min = listing.price_min;
  const max = listing.price_max;
  if (Number.isFinite(min) && min > 0) {
    if (Number.isFinite(max) && max > min) return `$${min}–$${max}`;
    return `From $${min}`;
  }
  return /^\${1,4}$/.test(listing.price_range || "") ? listing.price_range! : "Ask for a quote";
}
