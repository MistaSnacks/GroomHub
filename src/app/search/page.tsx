import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CaretRight, PawPrint } from "@phosphor-icons/react/dist/ssr";
import { searchListings } from "@/lib/supabase/queries";
import { ListingCard } from "@/components/listing-card";
import { SearchRefiner } from "./search-refiner";
import {
  getServiceLabel,
  getSpecialtyLabel,
} from "@/lib/tags";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    tag?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

function buildSearchHref(q: string, type: string, tag: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (type) params.set("type", type);
  if (tag) params.set("tag", tag);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/search${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q ?? "";
  const tag = params.tag ?? "";
  const type = params.type ?? "";

  let title = "Search Results";
  if (q) title = `Search results for "${q}"`;
  else if (type === "service" && tag)
    title = `${getServiceLabel(tag)} Groomers`;
  else if (type === "specialty" && tag)
    title = `${getSpecialtyLabel(tag)} Groomers`;

  const description = "Search for dog groomers across the Pacific Northwest. Filter by service, specialty, or location.";

  return {
    title,
    description,
    alternates: { canonical: "/search" },
    robots: { index: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/search",
      siteName: "GroomLocal",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Search GroomLocal" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const type = params.type ?? "";
  const tag = params.tag ?? "";
  const requestedPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  let listings = await searchListings(q || tag);
  let didTagFallback = false;

  if (type === "service" && tag) {
    listings = listings.filter((l) => l.service_tags.includes(tag));
    if (listings.length === 0) {
      const { getListingsByServiceTag } = await import(
        "@/lib/supabase/queries"
      );
      listings = await getListingsByServiceTag(tag);
      didTagFallback = q.length > 0 && listings.length > 0;
    }
  } else if (type === "specialty" && tag) {
    listings = listings.filter((l) => l.specialty_tags.includes(tag));
    if (listings.length === 0) {
      const { getListingsBySpecialtyTag } = await import(
        "@/lib/supabase/queries"
      );
      listings = await getListingsBySpecialtyTag(tag);
      didTagFallback = q.length > 0 && listings.length > 0;
    }
  }

  const fallbackTagLabel =
    type === "service" ? getServiceLabel(tag) : type === "specialty" ? getSpecialtyLabel(tag) : tag;

  // Build display title
  let heading = "Search Results";
  if (q) heading = `Results for "${q}"`;
  else if (type === "service" && tag) heading = `${getServiceLabel(tag)} Groomers`;
  else if (type === "specialty" && tag)
    heading = `${getSpecialtyLabel(tag)} Groomers`;

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Search Results", href: `/search${q ? `?q=${encodeURIComponent(q)}` : ""}` },
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-gradient-to-b from-bg to-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <CaretRight weight="bold" className="w-3 h-3" />}
                {i < breadcrumbs.length - 1 ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-brand-primary transition-colors"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-text font-medium">{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Search refinement */}
        <div className="max-w-2xl mb-8">
          <Suspense fallback={<div className="h-11 rounded-xl bg-surface animate-pulse" />}>
            <SearchRefiner initialQuery={q} />
          </Suspense>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-brand-primary">
            {heading}
          </h1>
          {didTagFallback && (
            <p className="text-sm text-brand-primary mt-2">
              No exact matches for &apos;{q}&apos; — showing all {fallbackTagLabel} groomers
            </p>
          )}
          <p className="text-sm text-text-muted mt-1">
            {listings.length === 0
              ? "No results found"
              : `${listings.length} groomer${listings.length === 1 ? "" : "s"} found`}
          </p>
        </div>

        {/* Results */}
        {listings.length > 0 ? (
          (() => {
            const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
            const page = Math.min(requestedPage, totalPages);
            const pageListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

            return (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pageListings.map((listing, i) => (
                    <ListingCard
                      key={listing.slug}
                      listing={listing}
                      index={i}
                      variant="horizontal"
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Search results pages"
                    className="flex items-center justify-center gap-4 mt-10"
                  >
                    {page > 1 ? (
                      <Link
                        href={buildSearchHref(q, type, tag, page - 1)}
                        className="text-sm px-4 py-2 rounded-xl border border-brand-primary/25 text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-medium"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="text-sm px-4 py-2 rounded-xl border border-border text-text-muted/50 cursor-not-allowed">
                        Previous
                      </span>
                    )}
                    <span className="text-sm text-text-muted">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages ? (
                      <Link
                        href={buildSearchHref(q, type, tag, page + 1)}
                        className="text-sm px-4 py-2 rounded-xl border border-brand-primary/25 text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-medium"
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="text-sm px-4 py-2 rounded-xl border border-border text-text-muted/50 cursor-not-allowed">
                        Next
                      </span>
                    )}
                  </nav>
                )}
              </>
            );
          })()
        ) : (
          <EmptyState query={q} />
        )}
      </div>
    </>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <PawPrint
        weight="duotone"
        className="w-16 h-16 text-text-muted/20 mx-auto mb-4"
      />
      <h2 className="font-heading text-lg font-semibold text-brand-primary mb-2">
        No groomers found
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {query
          ? `We couldn't find any results for "${query}". Try a different search term or browse by city.`
          : "Try searching for a city, zip code, service, or groomer name."}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/dog-grooming"
          className="text-sm px-4 py-2 rounded-xl border border-brand-primary/25 text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-medium"
        >
          Browse All Cities
        </Link>
        <Link
          href="/"
          className="text-sm px-4 py-2 rounded-xl bg-brand-secondary text-brand-primary font-semibold hover:bg-brand-secondary/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
