import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Free Listings for Groomers",
  description:
    "Every grooming business on GroomLocal is listed for free. Claim your listing to add photos, hours, services and a booking link. No credit card.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | Free Listings for Groomers",
    description:
      "Every grooming business on GroomLocal is listed for free. Claim your listing to add photos, hours, services and a booking link. No credit card.",
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
      "Every grooming business on GroomLocal is listed for free. Claim your listing to add photos, hours, services and a booking link. No credit card.",
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
