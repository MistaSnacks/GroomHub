"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ListingCard } from "./listing-card";
import { TagFilterBar } from "./tag-filter-bar";
import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { AdSlot } from "./ad-slot";
import type { NormalizedListing } from "@/lib/types";
import type { PriceTag } from "@/lib/tags";

interface CityListingsClientProps {
  listings: NormalizedListing[];
  heading: string;
  preFilterService?: string;
  preFilterSpecialty?: string;
}

function parseList(val: string | null): string[] {
  if (!val) return [];
  return val.split(",").filter(Boolean);
}

function serializeList(arr: string[]): string | null {
  return arr.length > 0 ? arr.join(",") : null;
}

export function CityListingsClient({
  listings,
  heading,
  preFilterService,
  preFilterSpecialty,
}: CityListingsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial state from URL params, falling back to pre-filter props
  const urlServices = parseList(searchParams.get("services"));
  const urlSpecialties = parseList(searchParams.get("specialties"));
  const urlFeatures = parseList(searchParams.get("features"));
  const urlPrice = searchParams.get("price") as PriceTag | null;
  const urlSort = searchParams.get("sort") || "top-rated";

  const [activeServiceTags, setActiveServiceTags] = useState<string[]>(
    urlServices.length > 0 ? urlServices : preFilterService ? [preFilterService] : []
  );
  const [activeSpecialtyTags, setActiveSpecialtyTags] = useState<string[]>(
    urlSpecialties.length > 0 ? urlSpecialties : preFilterSpecialty ? [preFilterSpecialty] : []
  );
  const [activeFeatureTags, setActiveFeatureTags] = useState<string[]>(urlFeatures);
  const [activePriceTag, setActivePriceTag] = useState<PriceTag | null>(urlPrice);
  const [sort, setSort] = useState(urlSort);

  // Sync state to URL
  const updateUrl = useCallback(
    (updates: {
      services?: string[];
      specialties?: string[];
      features?: string[];
      price?: PriceTag | null;
      sort?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      const services = updates.services ?? activeServiceTags;
      const specialties = updates.specialties ?? activeSpecialtyTags;
      const features = updates.features ?? activeFeatureTags;
      const price = updates.price !== undefined ? updates.price : activePriceTag;
      const sortVal = updates.sort ?? sort;

      const svc = serializeList(services);
      const spec = serializeList(specialties);
      const feat = serializeList(features);

      if (svc) params.set("services", svc);
      else params.delete("services");
      if (spec) params.set("specialties", spec);
      else params.delete("specialties");
      if (feat) params.set("features", feat);
      else params.delete("features");
      if (price) params.set("price", price);
      else params.delete("price");
      if (sortVal && sortVal !== "top-rated") params.set("sort", sortVal);
      else params.delete("sort");

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "", { scroll: false });
    },
    [searchParams, router, activeServiceTags, activeSpecialtyTags, activeFeatureTags, activePriceTag, sort]
  );

  const filtered = useMemo(() => {
    let result = [...listings];

    if (activeServiceTags.length > 0) {
      result = result.filter((l) =>
        activeServiceTags.some((tag) => l.service_tags.includes(tag))
      );
    }

    if (activeSpecialtyTags.length > 0) {
      result = result.filter((l) =>
        activeSpecialtyTags.some((tag) => l.specialty_tags.includes(tag))
      );
    }

    if (activeFeatureTags.length > 0) {
      result = result.filter((l) =>
        activeFeatureTags.every((tag) => l.feature_tags.includes(tag))
      );
    }

    if (activePriceTag) {
      result = result.filter((l) => l.price_tag === activePriceTag);
    }

    switch (sort) {
      case "top-rated":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "most-reviewed":
        result.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
        break;
      case "price-low":
        result.sort((a, b) => (a.price_min ?? 0) - (b.price_min ?? 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.price_max ?? 0) - (a.price_max ?? 0));
        break;
    }

    result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));

    return result;
  }, [listings, activeServiceTags, activeSpecialtyTags, activeFeatureTags, activePriceTag, sort]);

  const toggleIn = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  return (
    <div>
      <TagFilterBar
        resultCount={filtered.length}
        heading={heading}
        activeServiceTags={activeServiceTags}
        activeSpecialtyTags={activeSpecialtyTags}
        activeFeatureTags={activeFeatureTags}
        activePriceTag={activePriceTag}
        onServiceToggle={(slug) => {
          const next = toggleIn(activeServiceTags, slug);
          setActiveServiceTags(next);
          updateUrl({ services: next });
        }}
        onSpecialtyToggle={(slug) => {
          const next = toggleIn(activeSpecialtyTags, slug);
          setActiveSpecialtyTags(next);
          updateUrl({ specialties: next });
        }}
        onFeatureToggle={(slug) => {
          const next = toggleIn(activeFeatureTags, slug);
          setActiveFeatureTags(next);
          updateUrl({ features: next });
        }}
        onPriceToggle={(price) => {
          const next = activePriceTag === price ? null : price;
          setActivePriceTag(next);
          updateUrl({ price: next });
        }}
        onClearAll={() => {
          const svc = preFilterService ? [preFilterService] : [];
          const spec = preFilterSpecialty ? [preFilterSpecialty] : [];
          setActiveServiceTags(svc);
          setActiveSpecialtyTags(spec);
          setActiveFeatureTags([]);
          setActivePriceTag(null);
          setSort("top-rated");
          updateUrl({ services: svc, specialties: spec, features: [], price: null, sort: "top-rated" });
        }}
        sort={sort}
        setSort={(s) => {
          setSort(s);
          updateUrl({ sort: s });
        }}
      />

      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <PawPrint
              weight="fill"
              className="w-12 h-12 text-text-muted/30 mx-auto mb-3"
            />
            <p className="font-heading text-lg">No groomers match your filters</p>
            <p className="text-sm mt-1">Try adjusting your filters above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((listing, i) => (
              <React.Fragment key={listing.id || listing.slug}>
                <ListingCard listing={listing} index={i} variant="horizontal" />
                {/* Ad slot after every 6th listing, spanning full width */}
                {(i + 1) % 6 === 0 && i < filtered.length - 1 && (
                  <div className="lg:col-span-2">
                    <AdSlot slot={`city-results-${Math.floor(i / 6)}`} format="leaderboard" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
