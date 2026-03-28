import type { MetadataRoute } from "next";
import { getCities, getAllListings } from "@/lib/supabase/queries";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import { STATES, stateSlugFromAbbr } from "@/lib/geography";
import { getBlogPosts } from "@/lib/blog";

const BASE_URL = "https://groomlocal.com";

// Split sitemap into chunks to stay well under Google's 50MB / 50k URL limits
// and the 2MB Googlebot crawl-size limit per response.
// IDs: 0 = static + taxonomy, 1 = groomer profiles, 2 = city pages (all 3 route types)

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap(args: {
  id: Promise<number> | number;
}): Promise<MetadataRoute.Sitemap> {
  // Next.js 16 makes id a Promise (like params/searchParams)
  const chunkId = Number(await args.id);

  // ── Chunk 0: Static pages, states, services, specialties, blog ──
  if (chunkId === 0) {

    const staticPages: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
      { url: `${BASE_URL}/dog-grooming`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/specialties`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/cat-grooming`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/mobile-grooming`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/for-groomers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/get-listed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/get-quotes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
      { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
      { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
      { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    ];

    // State pages
    const statePages: MetadataRoute.Sitemap = STATES.map((state) => ({
      url: `${BASE_URL}/dog-grooming/${state.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Service landing pages
    const servicePages: MetadataRoute.Sitemap = SERVICE_TAGS.map((tag) => ({
      url: `${BASE_URL}/services/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Specialty landing pages
    const specialtyPages: MetadataRoute.Sitemap = SPECIALTY_TAGS.map((tag) => ({
      url: `${BASE_URL}/specialties/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Blog posts
    const blogPages: MetadataRoute.Sitemap = getBlogPosts().map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
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
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  }

  // ── Chunk 2: City pages (dog-grooming, cat-grooming, mobile-grooming) ──

  const cities = await getCities();

  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/dog-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const catCityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/cat-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const mobileCityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/mobile-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...cityPages, ...catCityPages, ...mobileCityPages];
}
