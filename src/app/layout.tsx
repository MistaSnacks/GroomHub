import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCities } from "@/lib/supabase/queries";

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
    "Find the pawfect dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. 1,177+ verified listings with services, pricing, and contact info.",
  manifest: "/manifest.json",
  openGraph: {
    title: "GroomLocal | Find Dog Groomers in the PNW",
    description:
      "Find the pawfect dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. 1,177+ verified groomer listings.",
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
      "Find the pawfect dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. 1,177+ verified groomer listings.",
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
  const cities = await getCities();

  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${inter.variable} antialiased min-h-screen flex flex-col bg-bg text-text`}
      >
        <SiteHeader cities={cities} />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
