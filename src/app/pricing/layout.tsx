import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Free Listings for Groomers",
  description:
    "Free $0 listings for grooming businesses in Washington and Oregon. Add your hours, services, photos and booking link. No credit card or trial period.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | Free Listings for Groomers",
    description:
      "Free $0 listings for grooming businesses in Washington and Oregon. Add your hours, services, photos and booking link. No credit card or trial period.",
    type: "website",
    url: "/pricing",
    siteName: "GroomLocal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GroomLocal free listings for groomers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Free Listings for Groomers",
    description:
      "Free $0 listings for grooming businesses in Washington and Oregon. Add your hours, services, photos and booking link. No credit card or trial period.",
    images: ["/og-image.png"],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
