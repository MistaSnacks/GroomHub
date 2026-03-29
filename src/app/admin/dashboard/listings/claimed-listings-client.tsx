"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { toggleFeatured } from "./actions";

interface ClaimedListing {
  slug: string;
  name: string;
  city: string;
  state: string;
  subscription_tier: string | null;
  is_featured: boolean;
  claimed_at: string | null;
  owner_id: string;
}

const tierColors: Record<string, string> = {
  premium: "bg-amber-100 text-amber-800",
  featured: "bg-teal-100 text-teal-800",
  standard: "bg-blue-100 text-blue-800",
  free: "bg-gray-100 text-gray-600",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ClaimedListingsClient({ listings: initialListings }: { listings: ClaimedListing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [toggling, setToggling] = useState<string | null>(null);

  const featuredCount = listings.filter((l) => l.is_featured).length;

  async function handleToggle(slug: string, currentValue: boolean) {
    setToggling(slug);
    const newValue = !currentValue;

    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (l.slug === slug ? { ...l, is_featured: newValue } : l))
    );

    const result = await toggleFeatured(slug, newValue);
    if (!result.success) {
      // Revert on failure
      setListings((prev) =>
        prev.map((l) => (l.slug === slug ? { ...l, is_featured: currentValue } : l))
      );
    }
    setToggling(null);
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Claimed Listings</h1>
        <p className="text-sm text-gray-500 mt-1">
          {listings.length} claimed listings, {featuredCount} featured
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">City</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Claimed</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Featured</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr
                key={listing.slug}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  listing.is_featured ? "bg-amber-50/50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/groomer/${listing.slug}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    target="_blank"
                  >
                    {listing.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{listing.city}</td>
                <td className="px-4 py-3 text-gray-700">{listing.state}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      tierColors[listing.subscription_tier || "free"] || tierColors.free
                    }`}
                  >
                    {listing.subscription_tier || "free"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(listing.claimed_at)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggle(listing.slug, listing.is_featured)}
                    disabled={toggling === listing.slug}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      listing.is_featured
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    } ${toggling === listing.slug ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${listing.is_featured ? "fill-amber-500" : ""}`}
                    />
                    {listing.is_featured ? "Featured" : "Set Featured"}
                  </button>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No claimed listings yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
