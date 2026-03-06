import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getCityBrowseSummary, getTotalListingCount } from "@/lib/supabase/queries";
import { stateSlugFromAbbr, buildServicePath, buildSpecialtyPath } from "@/lib/geography";
import { isValidServiceSlug, isValidSpecialtySlug } from "@/lib/tags";
import { WaveDivider } from "@/components/wave-divider";
import { CityPillGrid } from "@/components/city-pill-grid";

export const metadata: Metadata = {
  title: "Dog Groomers — Browse All Cities",
  description: "Browse dog groomers across Washington and Oregon. Find verified groomers in every PNW city.",
  alternates: { canonical: "/dog-grooming" },
  openGraph: {
    title: "Dog Groomers — Browse All Cities",
    description: "Browse dog groomers across Washington and Oregon. Find verified groomers in every PNW city.",
    type: "website",
    url: "/dog-grooming",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Dog groomers in the PNW" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dog Groomers — Browse All Cities",
    images: ["/og-image.png"],
  },
};

interface HubProps {
  searchParams: Promise<{ service?: string; specialty?: string }>;
}

export default async function DogGroomingHub({ searchParams }: HubProps) {
  const sp = await searchParams;

  if (sp.service && isValidServiceSlug(sp.service)) {
    redirect(buildServicePath(sp.service));
  }
  if (sp.specialty && isValidSpecialtySlug(sp.specialty)) {
    redirect(buildSpecialtyPath(sp.specialty));
  }

  const [waSummary, orSummary, totalCount] = await Promise.all([
    getCityBrowseSummary("WA"),
    getCityBrowseSummary("OR"),
    getTotalListingCount(),
  ]);

  const waCities = waSummary.cities;
  const orCities = orSummary.cities;
  const cityCount = waCities.length + orCities.length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Dog Grooming</span>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
            Explore the Pacific Northwest
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3 text-brand-primary">
            Dog Groomers in the <span className="text-brand-secondary">PNW</span>
          </h1>
          <p className="text-text-muted text-lg">
            {totalCount} groomers across {cityCount} cities in Washington & Oregon
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* State Sections */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-10">
          <CityPillGrid
            cities={waCities}
            stateSlug={stateSlugFromAbbr("WA")}
            stateAbbr="WA"
            stateName="Washington"
            cardBg="bg-brand-secondary/10"
            badgeBg="bg-brand-primary text-white"
            totalGroomers={waSummary.totalListings}
            uncategorizedGroomers={waSummary.uncategorizedListings}
            initialLimit={20}
            showSearch={true}
            ctaHref="/dog-grooming/wa"
            ctaLabel={`View all ${waSummary.totalListings} Washington groomers`}
          />

          <CityPillGrid
            cities={orCities}
            stateSlug={stateSlugFromAbbr("OR")}
            stateAbbr="OR"
            stateName="Oregon"
            cardBg="bg-brand-accent/10"
            badgeBg="bg-brand-accent text-white"
            totalGroomers={orSummary.totalListings}
            uncategorizedGroomers={orSummary.uncategorizedListings}
            initialLimit={20}
            showSearch={true}
            ctaHref="/dog-grooming/or"
            ctaLabel={`View all ${orSummary.totalListings} Oregon groomers`}
          />
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
