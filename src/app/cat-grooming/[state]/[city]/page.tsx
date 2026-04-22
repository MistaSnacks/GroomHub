import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CaretRight, MapPin, Cat, Question } from "@phosphor-icons/react/dist/ssr";
import { CityListingsClient } from "@/components/city-listings-client";

export const revalidate = 300;
import { getListingsByServiceTag, getCitiesByState, getCityBySlug, getFeaturedByCity } from "@/lib/supabase/queries";
import { stateAbbrFromSlug, stateNameFromSlug, getNearbyCities, buildServiceCityPath } from "@/lib/geography";
import { getMetroNeighbors } from "@/lib/metro-clusters";
import { buildCatGroomingFaqs } from "@/lib/city-faqs";
import { cityFaqSchema } from "@/lib/schema";
import { FeaturedSection } from "@/components/featured-section";
import { WaveDivider } from "@/components/wave-divider";
import { CityStatsBlock } from "@/components/city-stats-block";
import { clampDescription, clampTitle } from "@/lib/seo-utils";
import { CityPricingSection } from "@/components/city-pricing-section";
import { getCityPricingBreakdown } from "@/lib/city-pricing";

interface Props {
  params: Promise<{ state: string; city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const cityData = await getCityBySlug(city, stateAbbrFromSlug(state));
  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);

  const stateAbbr = stateAbbrFromSlug(state);
  const ogImage = `/api/og/city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&service=cat`;
  const title = clampTitle(`Cat Groomers in ${cityName}, ${stateAbbr}`);
  const description = clampDescription(`Find cat groomers in ${cityName}, ${stateAbbr}. Browse feline-friendly salons with gentle handling and stress-free grooming. Compare services and book on GroomLocal.`);

  return {
    title,
    description,
    alternates: { canonical: `/cat-grooming/${state}/${city}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/cat-grooming/${state}/${city}`,
      siteName: "GroomLocal",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Cat groomers in ${cityName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CatGroomingCityPage({ params }: Props) {
  const { state, city } = await params;
  const stateAbbr = stateAbbrFromSlug(state);
  const stateName = stateNameFromSlug(state);

  const [listings, cityData, relatedCities, featuredListings] = await Promise.all([
    getListingsByServiceTag("cat-grooming", city, stateAbbr),
    getCityBySlug(city, stateAbbr),
    getCitiesByState(stateAbbr),
    getFeaturedByCity(city, stateAbbr),
  ]);

  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);
  const nearby = getNearbyCities(city, relatedCities, getMetroNeighbors(city), 6);
  const faqs = buildCatGroomingFaqs(cityName, stateAbbr, listings.length);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-bg py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href="/cat-grooming" className="hover:text-brand-primary transition-colors">Cat Grooming</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-text-muted">{stateName}</span>
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
          <CityStatsBlock
            groomerCount={listings.length}
            metroCityCount={getMetroNeighbors(city).length + 1}
            serviceCount={new Set(listings.flatMap((l) => l.service_tags ?? [])).size}
            lastUpdated={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          />
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FDF8F0" />

      <FeaturedSection listings={featuredListings} cityName={cityName} />

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

      {/* Pricing Guide */}
      <CityPricingSection
        cityName={cityName}
        pricing={getCityPricingBreakdown(cityName, "cat-grooming")}
        serviceLabel="Cat Grooming"
      />

      {/* FAQ Section */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Question weight="duotone" className="w-6 h-6 text-brand-secondary" />
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              Frequently Asked Questions About Cat Grooming in {cityName}
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-border bg-bg/50 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 text-brand-primary font-medium text-sm hover:bg-bg transition-colors">
                  <span>{faq.question}</span>
                  <CaretRight weight="bold" className="w-4 h-4 text-text-muted group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-sm text-text-muted leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Cities */}
      {nearby.length > 0 && (
        <>
          <WaveDivider variant="gentle" fromColor="#FFFFFF" toColor="#FDF8F0" />
          <section className="bg-bg py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                Cat Grooming in Nearby Cities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {nearby.map((c) => (
                  <Link
                    key={c.slug}
                    href={buildServiceCityPath("cat-grooming", state, c.slug)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-center hover:border-brand-accent/40 hover:shadow-sm transition-all"
                  >
                    <div className="text-sm font-medium text-brand-primary">{c.name}</div>
                    <div className="text-xs text-text-muted">{c.groomer_count} groomers</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <WaveDivider variant="footer" fromColor={nearby.length > 0 ? "#FDF8F0" : "#FFFFFF"} toColor="#4ECDC4" />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cityFaqSchema(faqs)) }}
      />
    </div>
  );
}
