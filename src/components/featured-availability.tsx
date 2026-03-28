// src/components/featured-availability.tsx
import { FEATURED_SPOTS_PER_CITY } from "@/lib/metro-clusters";
import { MapPin } from "@phosphor-icons/react/dist/ssr";

interface CityAvailability {
  cityName: string;
  taken: number;
}

interface FeaturedAvailabilityProps {
  cities: CityAvailability[];
}

export function FeaturedAvailability({ cities }: FeaturedAvailabilityProps) {
  if (cities.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-bg/50 p-5">
      <h3 className="font-heading text-base font-semibold text-brand-primary mb-3">
        Featured Spot Availability
      </h3>
      <div className="space-y-2">
        {cities.map(({ cityName, taken }) => {
          const available = FEATURED_SPOTS_PER_CITY - taken;
          const isFull = available <= 0;
          return (
            <div key={cityName} className="flex items-center gap-2 text-sm">
              <MapPin weight="fill" className="w-4 h-4 text-brand-secondary flex-shrink-0" />
              <span className="text-text-muted">
                {cityName}:
              </span>
              {isFull ? (
                <span className="font-medium text-brand-accent">
                  Full - join the waitlist
                </span>
              ) : (
                <span className="font-medium text-brand-primary">
                  {available} of {FEATURED_SPOTS_PER_CITY} spots available
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
