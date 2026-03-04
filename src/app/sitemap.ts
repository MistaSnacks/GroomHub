import type { MetadataRoute } from "next";
import { getCities, getAllListings } from "@/lib/supabase/queries";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import { STATES, stateSlugFromAbbr } from "@/lib/geography";
import { getBlogPosts } from "@/lib/blog";

const BASE_URL = "https://groomlocal.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, listings] = await Promise.all([getCities(), getAllListings()]);

  // Static pages
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
  ];

  // State pages
  const statePages: MetadataRoute.Sitemap = STATES.map((state) => ({
    url: `${BASE_URL}/dog-grooming/${state.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // City pages (dog-grooming)
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/dog-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Cat grooming city pages
  const catCityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/cat-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Mobile grooming city pages
  const mobileCityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE_URL}/mobile-grooming/${stateSlugFromAbbr(city.state_abbr)}/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
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

  // Individual groomer profiles
  const groomerPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${BASE_URL}/groomer/${listing.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = getBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...statePages,
    ...cityPages,
    ...catCityPages,
    ...mobileCityPages,
    ...servicePages,
    ...specialtyPages,
    ...groomerPages,
    ...blogPages,
  ];
}
