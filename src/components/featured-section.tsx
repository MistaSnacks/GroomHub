// src/components/featured-section.tsx
import { ListingCard } from "./listing-card";
import { Star } from "@phosphor-icons/react/dist/ssr";
import type { FeaturedCityListing } from "@/lib/supabase/queries";

interface FeaturedSectionProps {
  listings: FeaturedCityListing[];
  cityName: string;
}

export function FeaturedSection({ listings, cityName }: FeaturedSectionProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-5">
        <Star weight="fill" className="w-5 h-5 text-brand-accent-ink" />
        <h2 className="font-heading text-xl font-semibold text-brand-primary">
          Featured Groomers in {cityName}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <div key={listing.slug} className="relative">
            <div className="rounded-xl border-2 border-brand-accent/30 bg-brand-accent/[0.03] p-4">
              <ListingCard listing={listing} compact />
            </div>
            {listing.isSpillover && (
              <p className="mt-1.5 text-xs text-text-muted italic px-1">
                Also serving {cityName}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
