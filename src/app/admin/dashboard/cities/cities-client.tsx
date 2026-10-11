"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Search } from "lucide-react";

export interface CityRow {
  slug: string;
  /** Canonical public city page path. */
  href: string;
  city: string;
  state: string;
  listings: number;
  claimed: number;
  seats: number;
  avgScore: number;
  views: number;
  taps: number;
  emailed: number;
  withEmail: number;
}

type SortKey = "city" | "listings" | "claimed" | "seats" | "avgScore" | "views" | "taps" | "emailed";

const COLUMNS: { key: SortKey; label: string; numeric: boolean; title?: string }[] = [
  { key: "city", label: "City", numeric: false },
  { key: "listings", label: "Listings", numeric: true },
  { key: "views", label: "Views 90d", numeric: true },
  { key: "taps", label: "Taps 90d", numeric: true },
  { key: "claimed", label: "Owners", numeric: true },
  { key: "seats", label: "Seats", numeric: true, title: "Sponsored spots in use, of 3" },
  { key: "emailed", label: "Emailed", numeric: true, title: "Listings the outreach job has emailed" },
  { key: "avgScore", label: "Quality", numeric: true, title: "Average listing quality, 0 to 100" },
];

export function CitiesClient({ rows }: { rows: CityRow[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"all" | "WA" | "OR">("all");
  const [view, setView] = useState<"all" | "thin" | "prune" | "deep">("all");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "views", desc: true });
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (state !== "all" && r.state !== state) return false;
      if (view === "thin" && r.listings >= 3) return false;
      if (view === "prune" && (r.listings >= 3 || r.views > 0)) return false;
      if (view === "deep" && r.listings < 10) return false;
      return !q || r.city.toLowerCase().includes(q) || r.slug.includes(q);
    });
    const dir = sort.desc ? -1 : 1;
    return list.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return cmp * dir || a.city.localeCompare(b.city);
    });
  }, [rows, query, state, view, sort]);

  async function copySlugs() {
    try {
      await navigator.clipboard.writeText(filtered.map((r) => r.href).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${active ? "bg-brand-primary text-white" : "bg-white text-stone-600 ring-1 ring-inset ring-adm-line hover:text-brand-primary"}`;

  return (
    <div className="adm-rise rounded-2xl border border-adm-line bg-white">
      <div className="flex flex-col gap-3 border-b border-adm-line p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={chip(view === "all")} onClick={() => setView("all")}>
            All cities
          </button>
          <button type="button" className={chip(view === "deep")} onClick={() => setView("deep")}>
            10+ listings
          </button>
          <button type="button" className={chip(view === "thin")} onClick={() => setView("thin")}>
            Thin (under 3)
          </button>
          <button type="button" className={chip(view === "prune")} onClick={() => setView("prune")}>
            Thin and no views
          </button>
          <span className="mx-1 h-4 w-px bg-adm-line" aria-hidden />
          {(["all", "WA", "OR"] as const).map((s) => (
            <button key={s} type="button" className={chip(state === s)} onClick={() => setState(s)}>
              {s === "all" ? "Both states" : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" aria-hidden />
            <span className="sr-only">Search cities</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities"
              className="w-48 rounded-lg border border-adm-line bg-white py-1.5 pl-8 pr-2 text-sm placeholder:text-stone-400"
            />
          </label>
          <button type="button" onClick={copySlugs} className="inline-flex items-center gap-1.5 rounded-lg border border-adm-line px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-brand-primary" title="Copy the city page paths for the rows shown">
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? "Copied" : `Copy ${filtered.length} URLs`}
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_var(--color-adm-line)]">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500 ${c.numeric ? "text-right" : "text-left"}`} title={c.title}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 uppercase hover:text-brand-primary"
                    onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : c.numeric }))}
                  >
                    {c.label}
                    {sort.key === c.key && (sort.desc ? <ChevronDown className="h-3 w-3" aria-hidden /> : <ChevronUp className="h-3 w-3" aria-hidden />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${r.state}-${r.slug}`} className="border-t border-adm-line/70 hover:bg-adm-plane/40">
                <td className="px-4 py-2.5">
                  <a href={r.href} target="_blank" className="font-medium text-brand-primary hover:underline">
                    {r.city}
                  </a>
                  <span className="ml-1.5 text-xs text-stone-400">{r.state}</span>
                  {r.listings < 3 && <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">thin</span>}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.listings}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${r.views ? "font-semibold text-brand-primary" : "text-stone-400"}`}>{r.views}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${r.taps ? "text-emerald-700" : "text-stone-400"}`}>{r.taps}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${r.claimed ? "font-semibold text-emerald-700" : "text-stone-400"}`}>{r.claimed}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-flex gap-0.5" aria-label={`${r.seats} of 3 sponsored spots used`}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className={`h-2.5 w-2.5 rounded-sm ${i < r.seats ? "bg-amber-500" : "bg-stone-200"}`} />
                    ))}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${r.emailed ? "" : "text-stone-400"}`}>
                  {r.emailed}
                  <span className="text-stone-400">/{r.listings}</span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <span className={r.avgScore >= 60 ? "text-emerald-700" : r.avgScore >= 40 ? "text-amber-700" : "text-red-700"}>{r.avgScore}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-stone-500">
                  No cities match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
