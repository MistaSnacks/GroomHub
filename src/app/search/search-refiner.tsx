"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export function SearchRefiner({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <MagnifyingGlass
          weight="bold"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
        />
        <input
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
  );
}
