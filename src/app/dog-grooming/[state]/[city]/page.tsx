import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CaretRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { CityListingsClient } from "@/components/city-listings-client";
import { getListingsByCity, getCitiesByState, getCityBySlug } from "@/lib/supabase/queries";
import { stateNameFromSlug, stateAbbrFromSlug, buildCityPath } from "@/lib/geography";
import { WaveDivider } from "@/components/wave-divider";

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state, city } = await params;
  const cityData = await getCityBySlug(city);
  const stateName = stateNameFromSlug(state);
  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);

  return {
    title: `Dog Groomers in ${cityName}, ${stateAbbrFromSlug(state)} — Best Local Groomers`,
    description: `Find the best dog groomers in ${cityName}, ${stateName}. Browse ${cityData?.groomer_count ? cityData.groomer_count + " " : ""}verified groomers with reviews, pricing, and services.`,
    alternates: { canonical: `/dog-grooming/${state}/${city}` },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { state, city } = await params;
  const stateAbbr = stateAbbrFromSlug(state);
  const stateName = stateNameFromSlug(state);

  const [listings, cityData, relatedCities] = await Promise.all([
    getListingsByCity(city),
    getCityBySlug(city),
    getCitiesByState(stateAbbr),
  ]);

  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);
  const nearby = relatedCities.filter((c) => c.slug !== city).slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href="/dog-grooming" className="hover:text-brand-primary transition-colors">Dog Grooming</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href={`/dog-grooming/${state}`} className="hover:text-brand-primary transition-colors">{stateName}</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">{cityName}</span>
          </nav>

          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3 text-brand-primary">
            Dog Grooming in <span className="text-brand-secondary">{cityName}, {stateAbbr}</span>
          </h1>
          <p className="text-text-muted flex items-center gap-1.5 text-lg">
            <MapPin weight="fill" className="w-5 h-5 text-brand-secondary" />
            {listings.length} verified groomers
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FDF8F0" />

      {/* Main content */}
      <section className="bg-bg flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading filters...</div>}>
            <CityListingsClient
              listings={listings}
              heading={`Best Dog Groomers in ${cityName}`}
            />
          </Suspense>
        </div>
      </section>

      {/* Related Cities */}
      {nearby.length > 0 && (
        <>
          <WaveDivider variant="asymmetric" fromColor="#FDF8F0" toColor="#FFFFFF" />
          <section className="bg-white py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                Nearby Cities in {stateName}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {nearby.map((c) => (
                  <Link
                    key={c.slug}
                    href={buildCityPath(state, c.slug)}
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

      {/* SEO text */}
      <WaveDivider variant="gentle" fromColor={nearby.length > 0 ? "#FFFFFF" : "#FDF8F0"} toColor="#FDF8F0" />
      <section className="bg-bg py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
            <h2 className="font-heading text-xl font-semibold text-brand-primary mb-3">
              Dog Grooming in {cityName}, {stateAbbr}
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Finding a reliable, skilled dog groomer in {cityName} doesn&apos;t have to be stressful.
              GroomLocal has verified and reviewed all listings in our directory so you can book with confidence.
              Whether you&apos;re looking for a quick nail trim, a full breed-specific haircut, or a mobile groomer
              who comes to your door, we have options for every need and budget in the {cityName}, {stateName} area.
            </p>
          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
    </div>
  );
}
