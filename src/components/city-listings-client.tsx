import { CityListingsInner } from "./city-listings-inner";
import { toListingCardData } from "@/lib/listing-card-data";
import type { NormalizedListing } from "@/lib/types";

interface CityListingsClientProps {
  listings: NormalizedListing[];
  heading: string;
  preFilterService?: string;
  preFilterSpecialty?: string;
}

export function CityListingsClient({
  listings,
  heading,
  preFilterService,
  preFilterSpecialty,
}: CityListingsClientProps) {
  const cards = listings.map(toListingCardData);

  return (
    <CityListingsInner
      listings={cards}
      heading={heading}
      preFilterService={preFilterService}
      preFilterSpecialty={preFilterSpecialty}
    />
  );
}
