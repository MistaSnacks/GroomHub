import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SnackboxScript } from "@/lib/cms/Overlay";
import { SiteFooter } from "@/components/site-footer";
import { getCities } from "@/lib/supabase/queries";
import { logEvent, errorFields } from "@/lib/log";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://groomlocal.com"),
  title: {
    default: "GroomLocal | Find Dog Groomers in the PNW",
    template: "%s | GroomLocal",
  },
  description:
    "Find the pawfect dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. Local listings with services, pricing, and contact info.",
  manifest: "/manifest.json",
  openGraph: {
    title: "GroomLocal | Find Dog Groomers in the PNW",
    description:
      "Find the pawfect dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. Local groomer listings.",
    type: "website",
    url: "https://groomlocal.com",
    locale: "en_US",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GroomLocal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GroomLocal | Find Dog Groomers in the PNW",
    description:
      "Find the pawfect dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. Local groomer listings.",
    images: ["/og-image.png"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The header city menu is a convenience; a database hiccup must not turn every page into a 500.
  const cities = await getCities().catch((err: unknown) => {
    logEvent("error", "layout", "cities_unavailable", errorFields(err));
    return [];
  });

  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${inter.variable} antialiased min-h-screen flex flex-col bg-bg text-text`}
      >
        <SiteHeader cities={cities} />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
        <Analytics />
        <SnackboxScript />
      </body>
    </html>
  );
}
