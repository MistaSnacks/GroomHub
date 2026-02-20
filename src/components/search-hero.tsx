"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  MapPin,
  Scissors,
  PawPrint,
  Buildings,
} from "@phosphor-icons/react/dist/ssr";
import type { CityWithCount, NormalizedListing } from "@/lib/types";

const popularCities = [
  { name: "Seattle", state: "wa", slug: "seattle" },
  { name: "Portland", state: "or", slug: "portland" },
  { name: "Tacoma", state: "wa", slug: "tacoma" },
  { name: "Bellevue", state: "wa", slug: "bellevue" },
];

interface SearchResult {
  cities: CityWithCount[];
  groomers: NormalizedListing[];
  services: { slug: string; label: string }[];
  specialties: { slug: string; label: string }[];
}

interface FlatItem {
  type: "city" | "service" | "specialty" | "groomer";
  id: string;
  label: string;
  sub?: string;
}

function flattenResults(results: SearchResult): FlatItem[] {
  const items: FlatItem[] = [];

  for (const c of results.cities) {
    items.push({
      type: "city",
      id: `city-${c.slug}-${c.state}`,
      label: c.name,
      sub: `${c.state} · ${c.groomer_count} groomer${c.groomer_count === 1 ? "" : "s"}`,
    });
  }
  for (const s of results.services) {
    items.push({ type: "service", id: `svc-${s.slug}`, label: s.label });
  }
  for (const s of results.specialties) {
    items.push({ type: "specialty", id: `spec-${s.slug}`, label: s.label });
  }
  for (const g of results.groomers) {
    items.push({
      type: "groomer",
      id: `groom-${g.slug}`,
      label: g.name,
      sub: `${g.city}, ${g.state}`,
    });
  }

  return items;
}

function navigateForItem(
  item: FlatItem,
  results: SearchResult,
  router: ReturnType<typeof useRouter>
) {
  switch (item.type) {
    case "city": {
      const city = results.cities.find(
        (c) => item.id === `city-${c.slug}-${c.state}`
      );
      if (city) {
        router.push(
          `/dog-grooming/${city.state.toLowerCase()}/${city.slug}`
        );
      }
      break;
    }
    case "service": {
      const slug = item.id.replace("svc-", "");
      router.push(
        `/search?type=service&tag=${encodeURIComponent(slug)}`
      );
      break;
    }
    case "specialty": {
      const slug = item.id.replace("spec-", "");
      router.push(
        `/search?type=specialty&tag=${encodeURIComponent(slug)}`
      );
      break;
    }
    case "groomer": {
      const slug = item.id.replace("groom-", "");
      router.push(`/groomer/${slug}`);
      break;
    }
  }
}

const ICON_CLASS = "w-4 h-4 shrink-0";

function TypeIcon({ type }: { type: FlatItem["type"] }) {
  switch (type) {
    case "city":
      return <MapPin weight="fill" className={`${ICON_CLASS} text-brand-secondary`} />;
    case "service":
      return <Scissors weight="fill" className={`${ICON_CLASS} text-brand-accent`} />;
    case "specialty":
      return <PawPrint weight="fill" className={`${ICON_CLASS} text-brand-secondary`} />;
    case "groomer":
      return <Buildings weight="fill" className={`${ICON_CLASS} text-brand-primary`} />;
  }
}

const SECTION_LABELS: Record<FlatItem["type"], string> = {
  city: "Cities",
  service: "Services",
  specialty: "Specialties",
  groomer: "Groomers",
};

export function SearchHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flatItems = results ? flattenResults(results) : [];

  // Debounced search
  const fetchResults = useCallback((q: string) => {
    clearTimeout(timerRef.current);
    if (q.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q.trim())}`
        );
        if (res.ok) {
          const data: SearchResult = await res.json();
          setResults(data);
          const flat = flattenResults(data);
          setIsOpen(flat.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        // fail silently
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchResults(val);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (activeIndex >= 0 && activeIndex < flatItems.length) {
      navigateForItem(flatItems[activeIndex], results!, router);
      setIsOpen(false);
      return;
    }
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setIsOpen(false);
    } else {
      router.push("/dog-grooming");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatItems.length === 0) {
      if (e.key === "Enter") handleSubmit();
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : flatItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        handleSubmit();
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleItemClick = (item: FlatItem) => {
    navigateForItem(item, results!, router);
    setIsOpen(false);
    setQuery("");
  };

  // Group flat items by type for sectioned display
  const sections = flatItems.reduce(
    (acc, item, idx) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push({ item, flatIndex: idx });
      return acc;
    },
    {} as Record<string, { item: FlatItem; flatIndex: number }[]>
  );

  const sectionOrder: FlatItem["type"][] = [
    "city",
    "service",
    "specialty",
    "groomer",
  ];

  return (
    <div className="w-full max-w-2xl mx-auto lg:mx-0" ref={wrapperRef}>
      {/* Search box */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-2 shadow-xl border border-border/60 flex flex-col sm:flex-row gap-2 relative"
      >
        <div className="relative flex-1">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (flatItems.length > 0) setIsOpen(true);
            }}
            placeholder="Search by city, zip, service, or groomer name..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary text-text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-activedescendant={
              activeIndex >= 0 ? flatItems[activeIndex]?.id : undefined
            }
            autoComplete="off"
          />

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="flex items-center justify-center bg-brand-secondary text-brand-primary font-bold rounded-xl hover:bg-brand-secondary/90 transition-colors h-12 px-6 shrink-0"
        >
          <MagnifyingGlass weight="bold" className="w-4 h-4 mr-2" />
          Search
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && flatItems.length > 0 && (
        <div
          className="absolute z-50 w-full max-w-2xl mt-1 bg-white rounded-xl border border-border shadow-xl overflow-hidden"
          role="listbox"
        >
          {sectionOrder.map((type) => {
            const items = sections[type];
            if (!items || items.length === 0) return null;
            return (
              <div key={type}>
                <div className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted/60">
                  {SECTION_LABELS[type]}
                </div>
                {items.map(({ item, flatIndex }) => (
                  <button
                    key={item.id}
                    id={item.id}
                    role="option"
                    aria-selected={flatIndex === activeIndex}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${flatIndex === activeIndex
                        ? "bg-brand-accent/8 text-brand-primary"
                        : "hover:bg-surface text-text"
                      }`}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus on input
                      handleItemClick(item);
                    }}
                  >
                    <TypeIcon type={item.type} />
                    <span className="flex-1 min-w-0 text-left">
                      <span className="font-medium truncate block">
                        {item.label}
                      </span>
                      {item.sub && (
                        <span className="text-xs text-text-muted truncate block">
                          {item.sub}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}

          {/* "View all results" footer */}
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand-accent hover:bg-surface border-t border-border transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              setIsOpen(false);
            }}
          >
            <MagnifyingGlass weight="bold" className="w-3.5 h-3.5" />
            View all results for &ldquo;{query.trim()}&rdquo;
          </button>
        </div>
      )}

      {/* Popular cities */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center lg:justify-start items-center">
        <span className="text-text-muted text-sm font-medium">Popular:</span>
        {popularCities.map((c) => (
          <button
            key={c.slug}
            onClick={() => router.push(`/dog-grooming/${c.state}/${c.slug}`)}
            className="text-sm px-3.5 py-1.5 rounded-full border border-border text-text-muted hover:border-brand-accent/40 hover:text-brand-accent transition-all font-medium"
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
