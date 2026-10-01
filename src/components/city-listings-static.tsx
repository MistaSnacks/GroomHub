import { ListingCard } from "./listing-card";
import type { ListingCardData } from "@/lib/types";

const PAGE_SIZE = 36;

interface CityListingsStaticProps {
  listings: ListingCardData[];
  heading: string;
  preFilterService?: string;
  preFilterSpecialty?: string;
}

/**
 * Server-rendered first view of a listing grid, used as the Suspense fallback for the
 * interactive CityListingsInner (which needs useSearchParams and so renders client-side).
 * Without it the server HTML had no profile links at all, so crawlers that do not run
 * JavaScript saw an empty city page. Mirrors the client's default view: pre-filter,
 * "top-rated" sort, first PAGE_SIZE cards.
 */
export function CityListingsStatic({
  listings,
  heading,
  preFilterService,
  preFilterSpecialty,
}: CityListingsStaticProps) {
  let view = listings;
  if (preFilterService) view = view.filter((l) => l.service_tags.includes(preFilterService));
  if (preFilterSpecialty) view = view.filter((l) => l.specialty_tags.includes(preFilterSpecialty));
  view = [...view].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const visible = view.slice(0, PAGE_SIZE);

  return (
    <div>
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">{heading}</h2>
        <p className="text-sm text-text-muted mt-0.5">
          {view.length} groomer{view.length !== 1 ? "s" : ""} found
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visible.map((listing, i) => (
          <ListingCard key={listing.id || listing.slug} listing={listing} index={i} variant="horizontal" />
        ))}
      </div>
    </div>
  );
}
