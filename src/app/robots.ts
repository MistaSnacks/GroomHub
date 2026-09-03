import type { MetadataRoute } from "next";

const BASE_URL = "https://groomlocal.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/", "/login", "/signup", "/admin/"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/", "/admin/"],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap/0.xml`,
      `${BASE_URL}/sitemap/1.xml`,
      `${BASE_URL}/sitemap/2.xml`,
    ],
  };
}
