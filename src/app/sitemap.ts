import type { MetadataRoute } from "next";
import { getCities, getAllListings, canonicalCitySlug } from "@/lib/supabase/queries";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import { STATES, stateSlugFromAbbr } from "@/lib/geography";
import { getBlogPosts } from "@/lib/blog";

const BASE_URL = "https://groomlocal.com";
const STATIC_LASTMOD = new Date("2026-09-02T00:00:00.000Z");
const INDEX_THRESHOLD = 3;

// Split sitemap into chunks to stay well under Google's 50MB / 50k URL limits
// and the 2MB Googlebot crawl-size limit per response.
// IDs: 0 = static + taxonomy, 1 = groomer profiles, 2 = city pages (all 3 route types)

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

function lastModFrom(value: unknown): Date {
  if (typeof value === "string" && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return STATIC_LASTMOD;
}

function maxLastMod(dates: Date[]): Date {
  if (dates.length === 0) return STATIC_LASTMOD;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

function cityKey(state: string, slug: string): string {
  return `${state.toUpperCase()}:${canonicalCitySlug(slug)}`;
}

export default async function sitemap(args: {
  id: Promise<number> | number;
}): Promise<MetadataRoute.Sitemap> {
  // Next.js 16 makes id a Promise (like params/searchParams)
  const chunkId = Number(await args.id);

  // ── Chunk 0: Static pages, states, services, specialties, blog ──
  if (chunkId === 0) {

    const staticPages: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: STATIC_LASTMOD, changeFrequency: "daily", priority: 1.0 },
      { url: `${BASE_URL}/dog-grooming`, lastModified: STATIC_LASTMOD, changeFrequency: "daily", priority: 0.9 },
      { url: `${BASE_URL}/services`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/specialties`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/cat-grooming`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/mobile-grooming`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/for-groomers`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/pricing`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/get-listed`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/get-quotes`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/blog`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/resources`, lastModified: STATIC_LASTMOD, changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/about`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.4 },
      { url: `${BASE_URL}/contact`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.4 },
      { url: `${BASE_URL}/privacy`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.2 },
      { url: `${BASE_URL}/terms`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.2 },
    ];

    // State pages
    const statePages: MetadataRoute.Sitemap = STATES.map((state) => ({
      url: `${BASE_URL}/dog-grooming/${state.slug}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Service landing pages
    const servicePages: MetadataRoute.Sitemap = SERVICE_TAGS.map((tag) => ({
      url: `${BASE_URL}/services/${tag.slug}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Specialty landing pages
    const specialtyPages: MetadataRoute.Sitemap = SPECIALTY_TAGS.map((tag) => ({
      url: `${BASE_URL}/specialties/${tag.slug}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Blog posts
    const blogPages: MetadataRoute.Sitemap = getBlogPosts().map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified || post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...statePages, ...servicePages, ...specialtyPages, ...blogPages];
  }

  // ── Chunk 1: Individual groomer profiles ──
  if (chunkId === 1) {

    const listings = await getAllListings();

    return listings.map((listing) => ({
      url: `${BASE_URL}/groomer/${listing.slug}`,
      lastModified: lastModFrom(listing.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  }

  // ── Chunk 2: City pages (dog-grooming, cat-grooming, mobile-grooming) ──

  const [cities, listings] = await Promise.all([getCities(), getAllListings()]);

  const aggs = new Map<string, { cat: number; mobile: number; lastMods: Date[] }>();
  for (const listing of listings) {
    if (!listing.state || !listing.city_slug || listing.city === "Unknown") continue;
    const key = cityKey(listing.state, listing.city_slug);
    let agg = aggs.get(key);
    if (!agg) {
      agg = { cat: 0, mobile: 0, lastMods: [] };
      aggs.set(key, agg);
    }
    agg.lastMods.push(lastModFrom(listing.updated_at));
    if (listing.service_tags.includes("cat-grooming")) agg.cat += 1;
    if (listing.service_tags.includes("mobile-grooming")) agg.mobile += 1;
  }

  const cityPages: MetadataRoute.Sitemap = cities
    .filter((city) => city.groomer_count >= INDEX_THRESHOLD)
    .map((city) => ({
      url: `${BASE_URL}/dog-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
      lastModified: maxLastMod(aggs.get(cityKey(city.state_abbr, city.slug))?.lastMods ?? []),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  const catCityPages: MetadataRoute.Sitemap = cities
    .filter((city) => (aggs.get(cityKey(city.state_abbr, city.slug))?.cat ?? 0) >= INDEX_THRESHOLD)
    .map((city) => ({
      url: `${BASE_URL}/cat-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
      lastModified: maxLastMod(aggs.get(cityKey(city.state_abbr, city.slug))?.lastMods ?? []),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  const mobileCityPages: MetadataRoute.Sitemap = cities
    .filter((city) => (aggs.get(cityKey(city.state_abbr, city.slug))?.mobile ?? 0) >= INDEX_THRESHOLD)
    .map((city) => ({
      url: `${BASE_URL}/mobile-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
      lastModified: maxLastMod(aggs.get(cityKey(city.state_abbr, city.slug))?.lastMods ?? []),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  return [...cityPages, ...catCityPages, ...mobileCityPages];
}
