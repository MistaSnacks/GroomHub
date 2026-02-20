import Link from "next/link";
import { Star, MapPin, ArrowRight, CheckCircle, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { BadgePill } from "./badge-pill";
import { ListingImage } from "./listing-image";
import { getServiceLabel, getSpecialtyLabel } from "@/lib/tags";
import type { BusinessListing, NormalizedListing, Badge } from "@/lib/types";

interface ListingCardProps {
  listing: BusinessListing | NormalizedListing;
  index?: number;
  compact?: boolean;
  variant?: "vertical" | "horizontal";
}

function isNormalized(listing: BusinessListing | NormalizedListing): listing is NormalizedListing {
  return "service_tags" in listing;
}

export function ListingCard({ listing, index = 0, compact = false, variant = "vertical" }: ListingCardProps) {
  const normalized = isNormalized(listing);
  const serviceTags = normalized ? listing.service_tags.slice(0, 4) : [];
  const specialtyTags = normalized ? listing.specialty_tags.slice(0, 3) : [];

  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : "";
  const isStockOrPlaceholder = firstImage.includes("placehold.co") || firstImage.includes("placeholder") || firstImage.includes("unsplash.com") || firstImage.includes("pexels.com");
  const hasImage = !!firstImage && !isStockOrPlaceholder;

  if (variant === "horizontal") {
    return <HorizontalCard listing={listing} normalized={normalized} serviceTags={serviceTags} specialtyTags={specialtyTags} hasImage={hasImage} index={index} />;
  }

  // Derive premium badges dynamically if subscription_tier is present
  let displayBadges = listing.badges || [];
  if (listing.subscription_tier === "premium") {
    displayBadges = Array.from(new Set(["best-in-show", "paw-verified", ...displayBadges])) as Badge[];
  } else if (listing.subscription_tier === "featured") {
    displayBadges = Array.from(new Set(["paw-verified", ...displayBadges])) as Badge[];
  }

  // Vertical variant (existing behavior)
  const rotations = ['rotate-1', '-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1', '-rotate-1'];
  const rotationClass = rotations[index % rotations.length];

  return (
    <article
      className={`bg-white rounded-xl relative group cursor-pointer animate-fade-slide-up paper-shadow hover:-translate-y-1 transition-transform duration-300 ${rotationClass} hover:rotate-0 z-10 hover:z-20`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="washi-tape absolute -top-3 left-1/2 transform -translate-x-1/2 z-30"></div>

      <div className="rounded-xl overflow-hidden flex flex-col h-full border-t-[6px] border border-border border-t-brand-accent">

        {/* Image or placeholder */}
        {hasImage ? (
          <ListingImage src={listing.images[0]} alt={listing.name} compact={compact} />
        ) : (
          <div className={`relative w-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-brand-secondary/5 border-b border-border/50 ${compact ? 'h-40' : 'h-48'}`}>
            <ImageSquare weight="duotone" className="w-12 h-12 text-text-muted/25 mb-2" />
            <span className="text-xs font-medium text-text-muted/40">Photo coming soon</span>
          </div>
        )}

        <div className={compact ? "p-4" : "p-5"}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-lg text-brand-primary leading-tight mb-1 truncate">
                {listing.name}
              </h3>
              <div className="flex items-center gap-1.5 text-text-muted text-xs">
                <MapPin weight="fill" className="w-3 h-3 shrink-0 text-brand-secondary" />
                <span className="truncate">{listing.city}, {listing.state}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              {(listing.price_min || listing.price_max) && listing.price_min > 0 ? (
                <div className="text-sm font-semibold text-text">${listing.price_min} - ${listing.price_max}</div>
              ) : (
                <div className="text-sm font-semibold text-text">{listing.price_range || "$$"}</div>
              )}
              {(listing.is_paw_verified || listing.subscription_tier === 'premium' || listing.subscription_tier === 'featured') && (
                <div className="flex items-center gap-0.5 text-brand-accent text-xs mt-0.5 justify-end">
                  <CheckCircle weight="fill" className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Rating */}
          {listing.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    weight="fill"
                    className={`w-3.5 h-3.5 shrink-0 ${star <= Math.round(listing.rating)
                      ? "text-[#FBC02D]"
                      : "text-text-muted/30"
                      }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-sm text-text">{listing.rating}</span>
              {listing.review_count > 0 && (
                <span className="text-text-muted text-xs">({listing.review_count} reviews)</span>
              )}
            </div>
          )}

          {/* Badges */}
          {displayBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayBadges.map((badge) => (
                <BadgePill key={badge} badge={badge} />
              ))}
            </div>
          )}

          {/* Service tags */}
          {normalized && serviceTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {serviceTags.map((slug) => (
                <span
                  key={slug}
                  className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20 font-medium"
                >
                  {getServiceLabel(slug)}
                </span>
              ))}
              {listing.service_tags.length > 4 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-muted">
                  +{listing.service_tags.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Specialty tags */}
          {normalized && specialtyTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {specialtyTags.map((slug) => (
                <span
                  key={slug}
                  className="text-xs px-2 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 font-medium"
                >
                  {getSpecialtyLabel(slug)}
                </span>
              ))}
            </div>
          )}

          {/* Raw services fallback */}
          {!normalized && listing.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {listing.services.slice(0, 4).map((service) => (
                <span
                  key={service}
                  className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-muted border border-border"
                >
                  {service}
                </span>
              ))}
              {listing.services.length > 4 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-muted">
                  +{listing.services.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">
            {listing.short_description || listing.description}
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-1">
            <Link
              href={`/groomer/${listing.slug}`}
              className="flex flex-1 items-center justify-center border border-brand-primary/25 text-brand-primary hover:bg-brand-primary hover:text-white text-xs font-medium rounded-xl transition-all h-9"
            >
              View Profile
              <ArrowRight weight="bold" className="w-3 h-3 ml-1" />
            </Link>
            {listing.website && (
              <a
                href={listing.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center cta-gradient text-brand-primary font-semibold text-xs rounded-xl hover:opacity-90 border-0 h-9"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Horizontal Card ────────────────────────────────────── */
function HorizontalCard({
  listing,
  normalized,
  serviceTags,
  specialtyTags,
  hasImage,
  index,
}: {
  listing: BusinessListing | NormalizedListing;
  normalized: boolean;
  serviceTags: string[];
  specialtyTags: string[];
  hasImage: boolean;
  index: number;
}) {
  return (
    <article
      className="bg-white rounded-xl border border-border group hover:shadow-md transition-all animate-fade-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link href={`/groomer/${listing.slug}`} className="flex flex-col sm:flex-row h-full">
        {/* Image */}
        <div className="sm:w-40 md:w-48 shrink-0">
          {hasImage ? (
            <div className="relative w-full h-40 sm:h-full overflow-hidden rounded-t-xl sm:rounded-t-none sm:rounded-l-xl">
              <ListingImage src={listing.images[0]} alt={listing.name} compact fill />
            </div>
          ) : (
            <div className="relative w-full h-40 sm:h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-brand-secondary/5 rounded-t-xl sm:rounded-t-none sm:rounded-l-xl">
              <ImageSquare weight="duotone" className="w-10 h-10 text-text-muted/25 mb-1" />
              <span className="text-xs font-medium text-text-muted/40">Photo coming soon</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-5 flex flex-col min-w-0">
          {/* Name + badges */}
          <div className="mb-1">
            <h3 className="font-heading font-semibold text-base text-brand-primary leading-tight truncate group-hover:text-brand-accent transition-colors mb-1">
              {listing.name}
            </h3>

            {(listing.is_paw_verified || listing.subscription_tier === 'featured' || listing.subscription_tier === 'premium' || (listing.badges && listing.badges.length > 0)) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {(listing.is_paw_verified || listing.subscription_tier === 'featured' || listing.subscription_tier === 'premium') && (
                  <span className="inline-flex items-center gap-0.5 text-brand-accent text-xs font-medium">
                    <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
                {(() => {
                  let hBadges = listing.badges || [];
                  if (listing.subscription_tier === "premium") hBadges = Array.from(new Set(["best-in-show", "paw-verified", ...hBadges])) as Badge[];
                  else if (listing.subscription_tier === "featured") hBadges = Array.from(new Set(["paw-verified", ...hBadges])) as Badge[];

                  return hBadges.map((badge) => <BadgePill key={badge} badge={badge} />);
                })()}
              </div>
            )}
          </div>

          {/* Rating + location */}
          <div className="flex items-center gap-3 mb-2 text-xs text-text-muted">
            {listing.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star weight="fill" className="w-3.5 h-3.5 text-[#FBC02D]" />
                <span className="font-semibold text-text">{listing.rating}</span>
                {listing.review_count > 0 && (
                  <span>({listing.review_count})</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin weight="fill" className="w-3 h-3 text-brand-secondary" />
              <span>{listing.city}, {listing.state}</span>
            </div>
          </div>

          {/* Tags */}
          {(serviceTags.length > 0 || specialtyTags.length > 0) && normalized && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {serviceTags.map((slug) => (
                <span key={slug} className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20 font-medium">
                  {getServiceLabel(slug)}
                </span>
              ))}
              {specialtyTags.map((slug) => (
                <span key={slug} className="text-xs px-2 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 font-medium">
                  {getSpecialtyLabel(slug)}
                </span>
              ))}
            </div>
          )}

          {/* Raw services fallback */}
          {!normalized && listing.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {listing.services.slice(0, 4).map((service) => (
                <span key={service} className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-muted border border-border">
                  {service}
                </span>
              ))}
            </div>
          )}

          {/* CTA link */}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-accent group-hover:text-brand-accent mt-auto pt-1">
            View profile
            <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </Link>
    </article>
  );
}
