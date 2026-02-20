import { NextRequest, NextResponse } from "next/server";
import { getCities, searchListings } from "@/lib/supabase/queries";
import { SERVICE_TAGS, SPECIALTY_TAGS, type TagDefinition } from "@/lib/tags";
import Fuse from "fuse.js";

export const dynamic = "force-dynamic";

function matchTags(query: string, tags: TagDefinition[]) {
  const fuse = new Fuse(tags, {
    keys: ["label", "aliases"],
    threshold: 0.3,
    ignoreLocation: true,
  });

  return fuse.search(query).map(result => ({
    slug: result.item.slug,
    label: result.item.label,
  }));
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

  // Match cities using Fuse.js
  const cityFuse = new Fuse(allCities, {
    keys: ["name", "slug"],
    threshold: 0.3,
    ignoreLocation: true,
  });

  const cities = cityFuse.search(q).map(res => res.item).slice(0, 5);

  // Match service tags
  const services = isZip ? [] : matchTags(q, SERVICE_TAGS).slice(0, 4);

  // Match specialty tags
  const specialties = isZip ? [] : matchTags(q, SPECIALTY_TAGS).slice(0, 4);

  // Limit groomer results for dropdown
  const groomerResults = groomers.slice(0, 6);

  return NextResponse.json({
    cities,
    groomers: groomerResults,
    services,
    specialties,
  });
}
