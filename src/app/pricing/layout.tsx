import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Plans for Groomers",
  description:
    "Simple, transparent pricing for grooming businesses. Start free, upgrade when you are ready. No hidden fees, no lock-in contracts.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | Plans for Groomers",
    description:
      "Simple, transparent pricing for grooming businesses. Start free, upgrade when you are ready. No hidden fees, no lock-in contracts.",
    type: "website",
    url: "/pricing",
    siteName: "GroomLocal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GroomLocal pricing plans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Plans for Groomers",
    description:
      "Simple, transparent pricing for grooming businesses. Start free, upgrade when you are ready. No hidden fees, no lock-in contracts.",
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
