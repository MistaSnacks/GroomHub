"use client";

import { useState } from "react";
import { FadersHorizontal, CaretDown } from "@phosphor-icons/react/dist/ssr";

const sortOptions = [
  { value: "top-rated", label: "Top Rated" },
  { value: "most-reviewed", label: "Most Reviewed" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const filterChips = [
  "Paw-Verified",
  "Mobile Grooming",
  "Cats",
  "Fear-Free",
  "Eco-Friendly",
  "Walk-Ins Welcome",
];

interface FilterBarProps {
  resultCount: number;
  cityName: string;
  activeFilters: string[];
  setActiveFilters: (filters: string[] | ((prev: string[]) => string[])) => void;
  sort: string;
  setSort: (sort: string) => void;
}

export function FilterBar({ resultCount, cityName, activeFilters, setActiveFilters, sort, setSort }: FilterBarProps) {

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="space-y-4">
      {/* Top row: result count + sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-fredoka)] text-2xl font-semibold text-brand-primary">
            Best Dog Groomers in {cityName}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {resultCount} groomers found — sniffing out the best for you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Sort by</span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <CaretDown weight="bold" className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <FadersHorizontal weight="bold" className="h-4 w-4 text-text-muted" />
        <span className="text-xs text-text-muted mr-1">Narrow the pack:</span>
        {filterChips.map((filter) => (
          <button
            key={filter}
            onClick={() => toggleFilter(filter)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${activeFilters.includes(filter)
              ? "border-brand-secondary bg-brand-secondary/10 text-brand-secondary"
              : "border-border bg-white text-text-muted hover:border-brand-secondary/50"
              }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
