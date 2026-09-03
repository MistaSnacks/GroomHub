"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";
import { getServiceLabel, getSpecialtyLabel } from "@/lib/tags";

export function SearchRefiner({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  const type = searchParams.get("type") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const filterLabel =
    type === "service" && tag
      ? getServiceLabel(tag)
      : type === "specialty" && tag
        ? getSpecialtyLabel(tag)
        : tag
          ? tag
          : "";

  function pushSearch(nextQuery: string, keepFilter: boolean) {
    const params = new URLSearchParams();
    if (nextQuery) params.set("q", nextQuery);
    if (keepFilter && type) params.set("type", type);
    if (keepFilter && tag) params.set("tag", tag);
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ""}`);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    pushSearch(q, true);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={handleSubmit}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          />
          <label htmlFor="search-refine" className="sr-only">Refine your search</label>
          <input
            id="search-refine"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Refine your search..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary text-text"
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center bg-brand-secondary text-brand-primary font-bold rounded-xl hover:bg-brand-secondary/90 transition-colors h-11 px-5 shrink-0 text-sm"
        >
          Search
        </button>
      </form>

      {filterLabel && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">Filters</span>
          <button
            type="button"
            onClick={() => pushSearch(query.trim(), false)}
            className="inline-flex items-center gap-1 rounded-full border border-brand-accent bg-brand-accent/10 px-2.5 py-1 text-xs font-medium text-brand-accent hover:bg-brand-accent/20 transition-colors"
            aria-label={`Remove ${filterLabel} filter`}
          >
            {filterLabel}
            <X weight="bold" className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
