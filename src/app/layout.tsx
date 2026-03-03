import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
  metadataBase: new URL("https://groomhub.com"),
  title: {
    default: "GroomHub | Find Dog Groomers in the PNW",
    template: "%s | GroomHub",
  },
  description:
    "Find the pawfect dog groomer in Seattle, Tacoma, Portland & the Pacific Northwest. Verified listings, real reviews, and instant booking.",
  keywords: [
    "dog grooming",
    "pet grooming",
    "dog groomer near me",
    "Seattle dog grooming",
    "Tacoma pet grooming",
    "Portland dog groomer",
    "PNW pet services",
  ],
  openGraph: {
    title: "GroomHub | Find Dog Groomers in the PNW",
    description:
      "Find the pawfect dog groomer in Seattle, Tacoma, Portland & the Pacific Northwest.",
    type: "website",
    locale: "en_US",
    siteName: "GroomHub",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GroomHub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GroomHub | Find Dog Groomers in the PNW",
    description:
      "Find the pawfect dog groomer in Seattle, Tacoma, Portland & the Pacific Northwest.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${inter.variable} antialiased min-h-screen flex flex-col bg-bg text-text`}
      >
        <SiteHeader />
        <main className="flex-1 flex flex-col">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
