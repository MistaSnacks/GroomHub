"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface BlogCategoryFilterProps {
  categories: { slug: string; label: string }[];
}

export function BlogCategoryFilter({ categories }: BlogCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  function handleClick(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === activeCategory) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    const qs = params.toString();
    router.push(qs ? `/blog?${qs}` : "/blog");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleClick("")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !activeCategory
            ? "bg-brand-primary text-white"
            : "bg-white border border-border text-text-muted hover:border-brand-primary/30"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => handleClick(cat.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === cat.slug
              ? "bg-brand-primary text-white"
              : "bg-white border border-border text-text-muted hover:border-brand-primary/30"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
