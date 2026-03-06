import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CaretRight, MapPin, PawPrint, Park, MapTrifold, Storefront } from "@phosphor-icons/react/dist/ssr";
import { CityListingsClient } from "@/components/city-listings-client";
import { getListingsByCity, getCitiesByState, getCityBySlug } from "@/lib/supabase/queries";
import { stateNameFromSlug, stateAbbrFromSlug, buildCityPath } from "@/lib/geography";
import { getCityContent } from "@/lib/city-data";
import { WaveDivider } from "@/components/wave-divider";
import { AdSlot } from "@/components/ad-slot";

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state, city } = await params;
  const stateAbbr = stateAbbrFromSlug(state);
  const cityData = await getCityBySlug(city, stateAbbr);
  const stateName = stateNameFromSlug(state);
  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);
  const content = getCityContent(stateAbbr, city);

  const title = `Best Dog Groomers in ${cityName}, ${stateAbbr}`;
  const description = content
    ? `Find the best dog groomers in ${cityName}, ${stateName}. Browse ${cityData?.groomer_count ? cityData.groomer_count + " " : ""}verified groomers, plus dog parks, neighborhoods, and dog-friendly spots.`
    : `Find the best dog groomers in ${cityName}, ${stateName}. Browse ${cityData?.groomer_count ? cityData.groomer_count + " " : ""}verified groomers with reviews, pricing, and services.`;
  const ogImage = `/api/og/city?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;

  return {
    title,
    description,
    alternates: { canonical: `/dog-grooming/${state}/${city}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/dog-grooming/${state}/${city}`,
      siteName: "GroomLocal",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Dog Grooming in ${cityName}, ${stateAbbr}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { state, city } = await params;
  const stateAbbr = stateAbbrFromSlug(state);
  const stateName = stateNameFromSlug(state);

  const [listings, cityData, relatedCities] = await Promise.all([
    getListingsByCity(city, stateAbbr),
    getCityBySlug(city, stateAbbr),
    getCitiesByState(stateAbbr),
  ]);

  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);
  const nearby = relatedCities.filter((c) => c.slug !== city).slice(0, 6);
  const content = getCityContent(stateAbbr, city);

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

          {content && (
            <p className="mt-4 text-text-muted text-sm leading-relaxed max-w-3xl">
              {content.intro}
            </p>
          )}
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FDF8F0" />

      {/* Main content — Listings */}
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

      {/* Enhanced city content */}
      {content && (
        <>
          <WaveDivider variant="asymmetric" fromColor="#FDF8F0" toColor="#FFFFFF" />

          {/* Ad slot between listings and city content */}
          <section className="bg-white py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <AdSlot slot={`city-${city}-mid`} format="leaderboard" />
            </div>
          </section>

          {/* Neighborhoods */}
          {content.neighborhoods.length > 0 && (
            <section className="bg-white py-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-6">
                  <MapTrifold weight="duotone" className="w-6 h-6 text-brand-secondary" />
                  <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                    Dog-Friendly Neighborhoods in {cityName}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.neighborhoods.map((n) => (
                    <div
                      key={n.name}
                      className="rounded-xl border border-border bg-bg/50 p-5"
                    >
                      <h3 className="font-heading text-base font-semibold text-brand-primary mb-1.5">
                        {n.name}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {n.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Dog Parks */}
          {content.dogParks.length > 0 && (
            <section className="bg-white pt-2 pb-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-6">
                  <Park weight="duotone" className="w-6 h-6 text-brand-secondary" />
                  <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                    Dog Parks in {cityName}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.dogParks.map((park) => (
                    <div
                      key={park.name}
                      className="rounded-xl border border-border bg-bg/50 p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h3 className="font-heading text-base font-semibold text-brand-primary">
                          {park.name}
                        </h3>
                        {park.offLeash && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-brand-secondary bg-brand-secondary/10 rounded-full px-2 py-0.5">
                            Off-Leash
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted leading-relaxed mb-2">
                        {park.description}
                      </p>
                      {park.features && park.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {park.features.map((f) => (
                            <span
                              key={f}
                              className="text-[10px] font-medium text-text-muted bg-white rounded-full px-2 py-0.5 border border-border"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Dog-Friendly Spots */}
          {content.dogFriendlySpots.length > 0 && (
            <section className="bg-white pt-2 pb-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-6">
                  <Storefront weight="duotone" className="w-6 h-6 text-brand-secondary" />
                  <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                    Dog-Friendly Spots in {cityName}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {content.dogFriendlySpots.map((spot) => (
                    <div
                      key={spot.name}
                      className="rounded-xl border border-border bg-bg/50 p-5"
                    >
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-accent mb-2">
                        {spot.type.replace("-", " ")}
                      </span>
                      <h3 className="font-heading text-sm font-semibold text-brand-primary mb-1">
                        {spot.name}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {spot.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Bottom ad slot */}
          <section className="bg-white pb-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <AdSlot slot={`city-${city}-bottom`} format="leaderboard" />
            </div>
          </section>
        </>
      )}

      {/* Related Cities */}
      {nearby.length > 0 && (
        <>
          <WaveDivider variant={content ? "gentle" : "asymmetric"} fromColor={content ? "#FFFFFF" : "#FDF8F0"} toColor={content ? "#FDF8F0" : "#FFFFFF"} />
          <section className={content ? "bg-bg py-10" : "bg-white py-10"}>
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
      <WaveDivider variant="gentle" fromColor={nearby.length > 0 ? (content ? "#FDF8F0" : "#FFFFFF") : "#FDF8F0"} toColor="#FDF8F0" />
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
