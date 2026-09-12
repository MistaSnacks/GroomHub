"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { MagnifyingGlass, MapPin, ArrowRight, Spinner } from "@phosphor-icons/react";

interface GroomerResult {
  slug: string;
  name: string;
  city: string;
  state: string;
}

export function ListingSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroomerResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { requestId.current++; if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++requestId.current;
    setError(false);

    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Search unavailable");
        const data = await res.json();
        if (id !== requestId.current) return;
        setResults(
          (data.groomers || []).slice(0, 5).map((g: GroomerResult) => ({
            slug: g.slug,
            name: g.name,
            city: g.city,
            state: g.state,
          }))
        );
        setSearched(true);
      } catch {
        if (id !== requestId.current) return;
        setResults([]);
        setSearched(false);
        setError(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 300);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-border p-5 md:p-6">
      <h3 className="font-heading font-bold text-brand-primary mb-1">
        Find and claim your listing
      </h3>
      <p className="text-sm text-text-muted mb-4">
        Search for your business first. If we have it, you can claim it right away.
      </p>

      <div className="relative">
        <MagnifyingGlass
          weight="bold"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
        />
        <label htmlFor="claim-listing-search" className="sr-only">Search by business name</label>
        <input
          id="claim-listing-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Search by business name..."
          className="w-full rounded-xl border border-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
        />
        {loading && (
          <Spinner className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
        )}
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-700">Search is temporarily unavailable. Please try again before submitting a new business.</p>}

      {searched && results.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Found in directory
          </p>
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/claim/${r.slug}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:border-brand-accent/40 hover:bg-surface transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-primary truncate">
                  {r.name}
                </p>
                <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <MapPin weight="fill" className="w-3 h-3 shrink-0" />
                  {r.city}, {r.state}
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-accent whitespace-nowrap flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Claim
                <ArrowRight weight="bold" className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {searched && results.length === 0 && query.length >= 2 && (
        <p className="mt-3 text-sm text-text-muted">
          No matching businesses found. Fill out the form below to get listed.
        </p>
      )}
    </div>
  );
}
