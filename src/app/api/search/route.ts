import { NextRequest, NextResponse } from "next/server";
import { getCities, searchListings } from "@/lib/supabase/queries";
import { SERVICE_TAGS, SPECIALTY_TAGS, type TagDefinition } from "@/lib/tags";
import Fuse from "fuse.js";
import type { CityWithCount } from "@/lib/types";

export const dynamic = "force-dynamic";

// Tag lists are static, so build their indexes once per server instance
// instead of on every keystroke request.
const TAG_FUSE_OPTIONS = {
  keys: ["label", "aliases"],
  threshold: 0.3,
  ignoreLocation: true,
};
const serviceFuse = new Fuse(SERVICE_TAGS, TAG_FUSE_OPTIONS);
const specialtyFuse = new Fuse(SPECIALTY_TAGS, TAG_FUSE_OPTIONS);

function matchTags(query: string, fuse: Fuse<TagDefinition>) {
  return fuse.search(query).map(result => ({
    slug: result.item.slug,
    label: result.item.label,
  }));
}

// Cities change rarely; rebuild their index on the same 5-min cadence as the
// underlying query cache.
let cityFuseCache: { fuse: Fuse<CityWithCount>; builtAt: number; count: number } | null = null;
const CITY_FUSE_TTL_MS = 5 * 60 * 1000;

function getCityFuse(cities: CityWithCount[]): Fuse<CityWithCount> {
  const now = Date.now();
  if (cityFuseCache && now - cityFuseCache.builtAt < CITY_FUSE_TTL_MS && cityFuseCache.count === cities.length) {
    return cityFuseCache.fuse;
  }
  const fuse = new Fuse(cities, {
    keys: ["name", "slug"],
    threshold: 0.3,
    ignoreLocation: true,
  });
  cityFuseCache = { fuse, builtAt: now, count: cities.length };
  return fuse;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({
      cities: [],
      groomers: [],
      services: [],
      specialties: [],
    });
  }

  const isZip = /^\d{5}$/.test(q);

  // Run all searches in parallel
  const [allCities, groomers] = await Promise.all([
    getCities(),
    searchListings(q),
  ]);

  const cities = getCityFuse(allCities).search(q).map(res => res.item).slice(0, 5);

  // Tag matches only make sense for word-like queries, not full ZIP codes
  const services = isZip ? [] : matchTags(q, serviceFuse).slice(0, 4);
  const specialties = isZip ? [] : matchTags(q, specialtyFuse).slice(0, 4);

  // Limit groomer results for dropdown
  const groomerResults = groomers.slice(0, 6);

  return NextResponse.json({
    cities,
    groomers: groomerResults,
    services,
    specialties,
  });
}
