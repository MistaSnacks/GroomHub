import type { MetadataRoute } from "next";

const BASE_URL = "https://groomlocal.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/", "/login", "/signup"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/claim/", "/dashboard/"],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap/0.xml`,
      `${BASE_URL}/sitemap/1.xml`,
      `${BASE_URL}/sitemap/2.xml`,
    ],
  };
}
