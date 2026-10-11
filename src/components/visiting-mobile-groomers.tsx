// src/components/visiting-mobile-groomers.tsx
import { Van } from "@phosphor-icons/react/dist/ssr";
import { ListingCard } from "./listing-card";
import type { NormalizedListing } from "@/lib/types";

interface VisitingMobileGroomersProps {
  listings: NormalizedListing[];
  cityName: string;
  metroName: string;
}

/**
 * Mobile groomers based in nearby cities who travel to this one (their chosen
 * service metro). Kept separate from the city's own list so counts stay honest.
 */
export function VisitingMobileGroomers({ listings, cityName, metroName }: VisitingMobileGroomersProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-1">
        <Van weight="duotone" className="w-5 h-5 text-brand-secondary" />
        <h2 className="font-heading text-xl font-semibold text-brand-primary">
          Mobile groomers who travel to {cityName}
        </h2>
      </div>
      <p className="text-sm text-text-muted mb-5">
        Based in nearby cities and serving the {metroName} area.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <div key={listing.slug}>
            <ListingCard listing={listing} compact />
            <p className="mt-1.5 text-xs text-text-muted italic px-1">
              Based in {listing.city}, travels to {cityName}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
