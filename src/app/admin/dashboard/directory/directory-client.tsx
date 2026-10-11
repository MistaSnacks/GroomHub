"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export interface DirectoryRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  score: number;
  missing: string[];
  photos: number;
  phone: string | null;
  website: string | null;
  hasEmail: boolean;
  outreachEmail: boolean;
  claimed: boolean;
  sponsored: boolean;
  views: number;
  taps: number;
  contact: "sent" | "bounced" | "no_email" | "researched" | null;
  contactSent: string | null;
}

export interface DirectoryFilters {
  q: string;
  state: string;
  owner: string;
  outreach: string;
  missing: string;
  sort: string;
}

const MISSING_OPTIONS: [string, string][] = [
  ["", "Any"],
  ["email", "No email"],
  ["photos", "Under 3 photos"],
  ["description", "No real description"],
  ["website", "No website"],
  ["phone", "No phone"],
  ["services", "Under 3 services"],
  ["logo", "No logo"],
  ["price", "No price"],
  ["booking", "No booking link"],
  ["none", "Nothing missing"],
];

const PAGE = 50;

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-adm-line bg-white px-2 py-1.5 text-sm normal-case tracking-normal text-stone-800">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function contactLabel(r: DirectoryRow): { text: string; cls: string } | null {
  if (r.contact === "sent") return { text: `Emailed ${r.contactSent ? new Date(`${r.contactSent}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : ""}`, cls: "bg-teal-50 text-teal-800" };
  if (r.contact === "bounced") return { text: "Bounced", cls: "bg-red-50 text-red-800" };
  if ((r.contact === "no_email" || r.contact === "researched") && !r.claimed) return { text: "Call list", cls: "bg-amber-50 text-amber-800" };
  return null;
}

export function DirectoryClient({ rows, initial }: { rows: DirectoryRow[]; initial: DirectoryFilters }) {
  const [f, setF] = useState<DirectoryFilters>(initial);
  const [page, setPage] = useState(0);

  function set<K extends keyof DirectoryFilters>(key: K, value: DirectoryFilters[K]) {
    setF((prev) => {
      const next = { ...prev, [key]: value };
      // Keep the URL shareable without a navigation.
      const params = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
      window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
      return next;
    });
    setPage(0);
  }

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (f.state && r.state !== f.state) return false;
      if (f.owner === "claimed" && !r.claimed) return false;
      if (f.owner === "unclaimed" && r.claimed) return false;
      if (f.outreach === "sent" && r.contact !== "sent") return false;
      if (f.outreach === "bounced" && r.contact !== "bounced") return false;
      if (f.outreach === "call" && r.contact !== "no_email" && r.contact !== "researched") return false;
      if (f.outreach === "none" && r.contact !== null) return false;
      if (f.missing === "none" && r.missing.length > 0) return false;
      if (f.missing && f.missing !== "none" && !r.missing.includes(f.missing)) return false;
      return !q || r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.slug.includes(q);
    });
    const sorters: Record<string, (a: DirectoryRow, b: DirectoryRow) => number> = {
      views: (a, b) => b.views - a.views || b.score - a.score,
      score: (a, b) => b.score - a.score,
      worst: (a, b) => a.score - b.score || b.views - a.views,
      name: (a, b) => a.name.localeCompare(b.name),
      city: (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
    };
    return list.sort(sorters[f.sort] ?? sorters.views);
  }, [rows, f]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="adm-rise rounded-2xl border border-adm-line bg-white">
      <div className="grid gap-3 border-b border-adm-line p-4 sm:grid-cols-3 xl:grid-cols-7">
        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-stone-500 sm:col-span-3 xl:col-span-2">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" aria-hidden />
            <input
              value={f.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Business, city or slug"
              className="w-full rounded-lg border border-adm-line bg-white py-1.5 pl-8 pr-2 text-sm normal-case tracking-normal placeholder:text-stone-400"
            />
          </span>
        </label>
        <Select label="State" value={f.state} onChange={(v) => set("state", v)} options={[["", "Both"], ["WA", "Washington"], ["OR", "Oregon"]]} />
        <Select label="Owner" value={f.owner} onChange={(v) => set("owner", v)} options={[["", "Any"], ["claimed", "Claimed"], ["unclaimed", "Unclaimed"]]} />
        <Select
          label="Outreach"
          value={f.outreach}
          onChange={(v) => set("outreach", v)}
          options={[["", "Any"], ["sent", "Emailed"], ["bounced", "Bounced"], ["call", "Call list"], ["none", "Not contacted"]]}
        />
        <Select label="Missing" value={f.missing} onChange={(v) => set("missing", v)} options={MISSING_OPTIONS} />
        <Select
          label="Sort"
          value={f.sort}
          onChange={(v) => set("sort", v)}
          options={[["views", "Most viewed"], ["worst", "Weakest first"], ["score", "Strongest first"], ["name", "Name"], ["city", "City"]]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500">Listing</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500">Quality</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500">Missing</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-stone-500">Views 30d</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const c = contactLabel(r);
              const fill = r.score >= 75 ? "bg-emerald-600" : r.score >= 45 ? "bg-amber-500" : "bg-red-500";
              return (
                <tr key={r.id} className="border-t border-adm-line/70 hover:bg-adm-plane/40">
                  <td className="px-4 py-2.5">
                    <a href={`/groomer/${r.slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                      {r.name}
                    </a>
                    <p className="text-xs text-stone-500">
                      {r.city}, {r.state}
                      {r.phone && <> · {r.phone}</>}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex w-28 items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-stone-100">
                        <div className={`h-full rounded-full ${fill}`} style={{ width: `${r.score}%` }} />
                      </div>
                      <span className="w-6 text-right text-[11px] font-semibold tabular-nums text-stone-600">{r.score}</span>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {r.missing.slice(0, 4).map((m) => (
                        <span key={m} className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">
                          {m === "email" && r.outreachEmail ? "email (outreach has one)" : m}
                        </span>
                      ))}
                      {r.missing.length > 4 && <span className="text-[10px] text-stone-400">+{r.missing.length - 4}</span>}
                    </div>
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${r.views ? "font-semibold text-brand-primary" : "text-stone-400"}`}>{r.views}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {r.claimed && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Owner</span>}
                      {r.sponsored && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Sponsored</span>}
                      {c && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.cls}`}>{c.text}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-500">
                  No listings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-adm-line px-4 py-3 text-xs text-stone-500">
        <span>
          {filtered.length.toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} listings
        </span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md p-1 hover:bg-stone-100 disabled:opacity-30" aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums">
            Page {page + 1} of {pages}
          </span>
          <button type="button" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-md p-1 hover:bg-stone-100 disabled:opacity-30" aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
