import { LISTING_REDIRECTS } from "./src/lib/listing-review";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: "/maui-assets/dog-ear-cleaning-grooming-guide.png", search: "?v=maui-20260907-alpha2" },
      { pathname: "/maui-assets/maui-grooming-cost-blog.png", search: "?v=maui-20260907-four-limbs" },
      { pathname: "/maui-assets/maui-grooming-duration-blog.png", search: "?v=maui-duration-20260904-v2" },
      { pathname: "/**", search: "" },
      { pathname: "/maui-assets/**", search: "?v=maui-halloween-20260907" },
      { pathname: "/maui-assets/**", search: "?v=maui-20260904" },
      { pathname: "/maui-characters/**", search: "?v=maui-20260904" },
      { pathname: "/maui-assets/**", search: "?v=maui-20260904-alpha1" },
      { pathname: "/maui-characters/**", search: "?v=maui-20260904-alpha1" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "afnkgwbajztnfkpijtcl.supabase.co",
      },
    ],
  },
  experimental: {
    // Bound build-time database traffic; high parallelism caused gateway timeouts.
    cpus: 2,
    staticGenerationMaxConcurrency: 1,
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      ...Object.entries(LISTING_REDIRECTS).flatMap(([from, to]) => [
        { source: `/groomer/${from}`, destination: `/groomer/${to}`, permanent: true },
        { source: `/claim/${from}/:path*`, destination: `/claim/${to}/:path*`, permanent: true },
      ]),
      {
        source: "/dog-grooming",
        has: [{ type: "query", key: "service", value: "(?<service>.*)" }],
        destination: "/services/:service",
        permanent: true,
      },
      {
        source: "/dog-grooming",
        has: [{ type: "query", key: "specialty", value: "(?<specialty>.*)" }],
        destination: "/specialties/:specialty",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
