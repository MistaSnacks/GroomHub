import Link from "next/link";
import { Star, MapPin, Trophy, ArrowRight, CheckCircle, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { ListingImage } from "./listing-image";
import { getServiceLabel } from "@/lib/tags";
import type { NormalizedListing } from "@/lib/types";

interface FeaturedListingBannerProps {
  listing: NormalizedListing;
}

export function FeaturedListingBanner({ listing }: FeaturedListingBannerProps) {
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : "";
  const isStockOrPlaceholder = firstImage.includes("placehold.co") || firstImage.includes("placeholder") || firstImage.includes("unsplash.com") || firstImage.includes("pexels.com");
  const hasImage = !!firstImage && !isStockOrPlaceholder;

  return (
    <div className="relative rounded-2xl border-2 border-brand-secondary/40 bg-gradient-to-r from-brand-secondary/5 to-white overflow-hidden mb-6">
      {/* Featured badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-brand-secondary px-3 py-1 text-xs font-semibold text-brand-primary shadow-sm">
        <Trophy weight="fill" className="w-3.5 h-3.5" />
        Featured
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-72 h-48 md:h-auto shrink-0 overflow-hidden">
          {hasImage ? (
            <ListingImage src={firstImage} alt={listing.name} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-brand-secondary/10">
              <ImageSquare weight="duotone" className="w-12 h-12 text-text-muted/25 mb-2" />
              <span className="text-xs text-text-muted/40">Photo coming soon</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6">
          <h3 className="font-heading text-xl font-semibold text-brand-primary mb-1">
            {listing.name}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin weight="fill" className="w-3 h-3 text-brand-secondary" />
              {listing.city}, {listing.state}
            </span>
            {listing.rating > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <Star weight="fill" className="w-3.5 h-3.5 text-[#FBC02D]" />
                <span className="font-semibold text-text">{listing.rating}</span>
                {listing.review_count > 0 && (
                  <span className="text-text-muted">({listing.review_count})</span>
                )}
              </span>
            )}
            {listing.is_paw_verified && (
              <span className="flex items-center gap-0.5 text-xs text-brand-accent">
                <CheckCircle weight="fill" className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          <p className="text-sm text-text-muted leading-relaxed mb-3 line-clamp-2">
            {listing.short_description || listing.description}
          </p>

          {/* Service tags */}
          {listing.service_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {listing.service_tags.slice(0, 5).map((slug) => (
                <span
                  key={slug}
                  className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20 font-medium"
                >
                  {getServiceLabel(slug)}
                </span>
              ))}
            </div>
          )}

          <Link
            href={`/groomer/${listing.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
          >
            View Profile <ArrowRight weight="bold" className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
