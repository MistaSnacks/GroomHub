import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CaretRight, MapPin, Cat } from "@phosphor-icons/react/dist/ssr";
import { CityListingsClient } from "@/components/city-listings-client";
import { getListingsByServiceTag, getCityBySlug } from "@/lib/supabase/queries";
import { stateAbbrFromSlug } from "@/lib/geography";
import { WaveDivider } from "@/components/wave-divider";

interface Props {
  params: Promise<{ state: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const cityData = await getCityBySlug(city, stateAbbrFromSlug(state));
  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);

  const ogImage = `/api/og/city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&service=cat`;

  return {
    title: `Cat Groomers in ${cityName}, ${stateAbbrFromSlug(state)}`,
    description: `Find cat groomers in ${cityName}. Feline-friendly salons with gentle handling and dedicated cat suites.`,
    alternates: { canonical: `/cat-grooming/${state}/${city}` },
    openGraph: {
      title: `Cat Groomers in ${cityName}, ${stateAbbrFromSlug(state)}`,
      description: `Find cat groomers in ${cityName}. Feline-friendly salons with gentle handling and dedicated cat suites.`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Cat groomers in ${cityName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Cat Groomers in ${cityName}, ${stateAbbrFromSlug(state)}`,
      images: [ogImage],
    },
  };
}

export default async function CatGroomingCityPage({ params }: Props) {
  const { state, city } = await params;
  const stateAbbr = stateAbbrFromSlug(state);
  const [listings, cityData] = await Promise.all([
    getListingsByServiceTag("cat-grooming", city, stateAbbr),
    getCityBySlug(city, stateAbbr),
  ]);
  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-bg py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href="/cat-grooming" className="hover:text-brand-primary transition-colors">Cat Grooming</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">{cityName}</span>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <Cat weight="duotone" className="w-8 h-8 text-brand-secondary" />
            <h1 className="font-heading text-3xl md:text-4xl font-semibold text-brand-primary">
              Cat Groomers in <span className="text-brand-secondary">{cityName}, {stateAbbr}</span>
            </h1>
          </div>
          <p className="text-text-muted flex items-center gap-1.5">
            <MapPin weight="fill" className="w-4 h-4 text-brand-secondary" />
            {listings.length} cat groomers found
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FDF8F0" />

      <section className="bg-bg flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading filters...</div>}>
            <CityListingsClient
              listings={listings}
              heading={`Cat Groomers in ${cityName}`}
              preFilterService="cat-grooming"
            />
          </Suspense>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
    </div>
  );
}
