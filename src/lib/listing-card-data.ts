import { isUsableListingImage } from "./images";
import type { ListingCardData, NormalizedListing } from "./types";

export function toListingCardData(listing: NormalizedListing): ListingCardData {
  const firstImage = (listing.images ?? []).find(isUsableListingImage);

  return {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    city: listing.city,
    state: listing.state,
    images: firstImage ? [firstImage] : [],
    logo_url: listing.logo_url,
    price_range: listing.price_range,
    price_min: listing.price_min,
    price_max: listing.price_max,
    owner_id: listing.owner_id,
    badges: listing.badges ?? [],
    subscription_tier: listing.subscription_tier,
    service_tags: listing.service_tags,
    specialty_tags: listing.specialty_tags,
    feature_tags: listing.feature_tags,
    price_tag: listing.price_tag,
    short_description: listing.short_description || "",
    is_featured: listing.is_featured,
    rating: listing.rating,
    review_count: listing.review_count,
    waitlist_status: listing.waitlist_status,
    website: listing.website,
  };
}
