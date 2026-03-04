"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MagnifyingGlass, MapPin, ArrowRight } from "@phosphor-icons/react";
import type { CityWithCount } from "@/lib/types";
import { buildCityPath } from "@/lib/geography";

interface CityPillGridProps {
  cities: CityWithCount[];
  stateSlug: string;
  stateAbbr: string;
  stateName: string;
  cardBg: string;
  badgeBg: string;
  totalGroomers: number;
  uncategorizedGroomers?: number;
  initialLimit?: number;
  showSearch?: boolean;
  highlightSlugs?: string[];
  ctaHref?: string;
  ctaLabel?: string;
}

export function CityPillGrid({
  cities,
  stateSlug,
  stateAbbr,
  stateName,
  cardBg,
  badgeBg,
  totalGroomers,
  uncategorizedGroomers = 0,
  initialLimit = 20,
  showSearch = true,
  highlightSlugs,
  ctaHref,
  ctaLabel,
}: CityPillGridProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return cities;
    const q = query.trim().toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, query]);

  const isSearching = query.trim().length > 0;
  const displayCities = isSearching || expanded ? filtered : filtered.slice(0, initialLimit);
  const hasMore = !isSearching && !expanded && filtered.length > initialLimit;

  return (
    <div className={`${cardBg} rounded-2xl p-6 md:p-8`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full ${badgeBg} font-heading font-bold text-lg shrink-0`}
        >
          {stateAbbr}
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold text-brand-primary">
            {stateName}
          </h3>
          <p className="text-sm text-text-muted">
            {cities.length} cities &middot; {totalGroomers} groomers
            {uncategorizedGroomers > 0 && ` · ${uncategorizedGroomers} unassigned`}
          </p>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative mb-5">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${stateName} cities...`}
            className="w-full rounded-full border border-border bg-white pl-9 pr-4 py-2 text-sm text-brand-primary placeholder:text-text-muted focus:outline-none focus:border-brand-secondary/50 focus:ring-1 focus:ring-brand-secondary/30 transition-all"
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
              {filtered.length} of {cities.length} cities
            </span>
          )}
        </div>
      )}

      {/* Pills */}
      {displayCities.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-5">
          {displayCities.map((city) => {
            const isHighlighted = highlightSlugs?.includes(city.slug);
            return (
              <Link
                key={city.slug}
                href={buildCityPath(stateSlug, city.slug)}
                className={`inline-flex items-center gap-1.5 rounded-full border bg-white hover:border-brand-accent/40 hover:shadow-sm transition-all group ${
                  isHighlighted
                    ? "border-brand-secondary/30 px-4 py-2.5"
                    : "border-border px-3 py-1.5"
                }`}
              >
                {isHighlighted && (
                  <MapPin
                    weight="fill"
                    className="w-3.5 h-3.5 text-brand-secondary shrink-0"
                  />
                )}
                <span
                  className={`text-brand-primary group-hover:text-brand-accent transition-colors ${
                    isHighlighted ? "text-sm font-semibold" : "text-sm font-medium"
                  }`}
                >
                  {city.name}
                </span>
                <span className="text-text-muted text-xs">
                  {city.groomer_count}
                </span>
              </Link>
            );
          })}

          {/* Show all / Show less toggle */}
          {hasMore && (
            <button
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-white/50 px-3 py-1.5 text-sm text-text-muted hover:text-brand-accent hover:border-brand-accent/40 transition-all cursor-pointer"
            >
              Show all {cities.length} cities
              <ArrowRight weight="bold" className="w-3 h-3" />
            </button>
          )}
          {expanded && !isSearching && cities.length > initialLimit && (
            <button
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-white/50 px-3 py-1.5 text-sm text-text-muted hover:text-brand-accent hover:border-brand-accent/40 transition-all cursor-pointer"
            >
              Show less
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-text-muted mb-5">
          <p className="text-sm">
            No cities matching &ldquo;{query}&rdquo; in {stateName}
          </p>
        </div>
      )}

      {/* CTA */}
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 text-brand-primary font-semibold text-sm hover:text-brand-accent transition-colors"
        >
          {ctaLabel}
          <ArrowRight weight="bold" className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
