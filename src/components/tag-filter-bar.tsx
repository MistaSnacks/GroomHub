"use client";

import { useState } from "react";
import { FadersHorizontal, CaretDown, CaretUp, X } from "@phosphor-icons/react/dist/ssr";
import { SERVICE_TAGS, SPECIALTY_TAGS, FEATURE_TAG_SLUGS, FEATURE_TAG_LABELS, getServiceLabel, getSpecialtyLabel } from "@/lib/tags";
import type { PriceTag } from "@/lib/tags";

interface TagFilterBarProps {
  resultCount: number;
  heading: string;
  activeServiceTags: string[];
  activeSpecialtyTags: string[];
  activeFeatureTags: string[];
  activePriceTag: PriceTag | null;
  onServiceToggle: (slug: string) => void;
  onSpecialtyToggle: (slug: string) => void;
  onFeatureToggle: (slug: string) => void;
  onPriceToggle: (price: PriceTag) => void;
  onClearAll: () => void;
  sort: string;
  setSort: (sort: string) => void;
}

const sortOptions = [
  { value: "top-rated", label: "Top Rated" },
  { value: "most-reviewed", label: "Most Reviewed" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const priceOptions: PriceTag[] = ["$", "$$", "$$$", "$$$$"];

export function TagFilterBar({
  resultCount,
  heading,
  activeServiceTags,
  activeSpecialtyTags,
  activeFeatureTags,
  activePriceTag,
  onServiceToggle,
  onSpecialtyToggle,
  onFeatureToggle,
  onPriceToggle,
  onClearAll,
  sort,
  setSort,
}: TagFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const totalActive =
    activeServiceTags.length +
    activeSpecialtyTags.length +
    activeFeatureTags.length +
    (activePriceTag ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Top row: heading + sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-brand-primary">
            {heading}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {resultCount} groomer{resultCount !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Sort by</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <CaretDown
              weight="bold"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Filter toggle + active pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-muted hover:border-brand-accent/50 transition-colors"
        >
          <FadersHorizontal weight="bold" className="h-3.5 w-3.5" />
          Filters
          {totalActive > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
              {totalActive}
            </span>
          )}
          {expanded ? (
            <CaretUp weight="bold" className="h-3 w-3" />
          ) : (
            <CaretDown weight="bold" className="h-3 w-3" />
          )}
        </button>

        {/* Active filter pills (always visible) */}
        {activeServiceTags.map((slug) => (
          <FilterPill
            key={slug}
            label={getServiceLabel(slug)}
            onRemove={() => onServiceToggle(slug)}
          />
        ))}
        {activeSpecialtyTags.map((slug) => (
          <FilterPill
            key={slug}
            label={getSpecialtyLabel(slug)}
            onRemove={() => onSpecialtyToggle(slug)}
          />
        ))}
        {activeFeatureTags.map((slug) => (
          <FilterPill
            key={slug}
            label={FEATURE_TAG_LABELS[slug as keyof typeof FEATURE_TAG_LABELS] ?? slug}
            onRemove={() => onFeatureToggle(slug)}
          />
        ))}
        {activePriceTag && (
          <FilterPill
            label={activePriceTag}
            onRemove={() => onPriceToggle(activePriceTag)}
          />
        )}
        {totalActive > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-fun-pop hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded filter sections */}
      {expanded && (
        <div className="rounded-xl border border-border bg-white p-4 space-y-4 animate-fade-slide-up" style={{ animationDelay: "0ms" }}>
          {/* Services */}
          <FilterSection title="Services">
            {SERVICE_TAGS.map((tag) => (
              <TogglePill
                key={tag.slug}
                label={tag.label}
                active={activeServiceTags.includes(tag.slug)}
                onClick={() => onServiceToggle(tag.slug)}
              />
            ))}
          </FilterSection>

          {/* Specialties */}
          <FilterSection title="Specialties">
            {SPECIALTY_TAGS.map((tag) => (
              <TogglePill
                key={tag.slug}
                label={tag.label}
                active={activeSpecialtyTags.includes(tag.slug)}
                onClick={() => onSpecialtyToggle(tag.slug)}
              />
            ))}
          </FilterSection>

          {/* Features */}
          <FilterSection title="Features">
            {FEATURE_TAG_SLUGS.map((slug) => (
              <TogglePill
                key={slug}
                label={FEATURE_TAG_LABELS[slug]}
                active={activeFeatureTags.includes(slug)}
                onClick={() => onFeatureToggle(slug)}
              />
            ))}
          </FilterSection>

          {/* Price */}
          <FilterSection title="Price Range">
            {priceOptions.map((p) => (
              <TogglePill
                key={p}
                label={p}
                active={activePriceTag === p}
                onClick={() => onPriceToggle(p)}
              />
            ))}
          </FilterSection>
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
          : "border-border bg-white text-text-muted hover:border-brand-accent/50"
      }`}
    >
      {label}
    </button>
  );
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-accent bg-brand-accent/10 px-2.5 py-1 text-xs font-medium text-brand-accent">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-fun-pop transition-colors"
      >
        <X weight="bold" className="h-3 w-3" />
      </button>
    </span>
  );
}
