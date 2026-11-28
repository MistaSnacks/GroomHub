import { getHomeCopy, getSitemapMarketingPages, RESERVED_MARKETING_SLUGS } from "@/lib/cms/marketing";
import type { MetadataRoute } from "next";
import { getCities, getAllListings, canonicalCitySlug } from "@/lib/supabase/queries";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import { STATES, stateSlugFromAbbr } from "@/lib/geography";
import { getSitemapBlogPosts } from "@/lib/blog";
import { harvestedPricesFor } from "@/lib/harvested-prices";
import { profileIndexing, SEARCH_KEEP_SLUGS } from "@/lib/profile-indexing";

const BASE_URL = "https://groomlocal.com";
const STATIC_LASTMOD = new Date("2026-09-02T00:00:00.000Z");
const INDEX_THRESHOLD = 3;

export const revalidate = 86400;

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

// Serve one flat /sitemap.xml (~670 URLs, ~120 KB — well under Google's 50k URL / 50 MB limits).
// Child sitemaps (/sitemap/0..2.xml) sat pending in Search Console for months without being fetched.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    { url: `${BASE_URL}/about`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/contact`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.2 },
  ];

  const statePages: MetadataRoute.Sitemap = STATES.map((state) => ({
    url: `${BASE_URL}/dog-grooming/${state.slug}`,
    lastModified: STATIC_LASTMOD,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const servicePages: MetadataRoute.Sitemap = SERVICE_TAGS.map((tag) => ({
    url: `${BASE_URL}/services/${tag.slug}`,
    lastModified: STATIC_LASTMOD,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const specialtyPages: MetadataRoute.Sitemap = SPECIALTY_TAGS.map((tag) => ({
    url: `${BASE_URL}/specialties/${tag.slug}`,
    lastModified: STATIC_LASTMOD,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const [posts, marketingPages, home, cities, listings] = await Promise.all([
    getSitemapBlogPosts(),
    getSitemapMarketingPages(),
    getHomeCopy(true),
    getCities(),
    getAllListings(),
  ]);

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified || post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const hidden = new Set(
    marketingPages.filter((page) => page.noIndex).map((page) => `${BASE_URL}/${page.slug}`),
  );
  if (home?.seo?.noIndex) hidden.add(BASE_URL);

  const extraPages: MetadataRoute.Sitemap = marketingPages
    .filter((page) => !page.noIndex && !RESERVED_MARKETING_SLUGS.has(page.slug))
    .map((page) => ({
      url: `${BASE_URL}/${page.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const groomerPages: MetadataRoute.Sitemap = listings
    .filter((listing) => profileIndexing(listing, harvestedPricesFor(listing.id), SEARCH_KEEP_SLUGS).index)
    .map((listing) => ({
      url: `${BASE_URL}/groomer/${listing.slug}`,
      lastModified: lastModFrom(listing.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

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

  return [
    ...staticPages.filter((page) => !hidden.has(page.url)),
    ...statePages,
    ...servicePages,
    ...specialtyPages,
    ...blogPages,
    ...extraPages,
    ...groomerPages,
    ...cityPages,
    ...catCityPages,
    ...mobileCityPages,
  ];
}
