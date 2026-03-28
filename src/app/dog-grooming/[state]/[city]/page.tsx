import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CaretRight, MapPin, PawPrint, Park, MapTrifold, Storefront, TreeStructure, Question } from "@phosphor-icons/react/dist/ssr";
import { CityListingsClient } from "@/components/city-listings-client";

export const revalidate = 300;
import { getListingsByCity, getCitiesByState, getCityBySlug, getFeaturedByCity } from "@/lib/supabase/queries";
import { FeaturedSection } from "@/components/featured-section";
import { stateNameFromSlug, stateAbbrFromSlug, buildCityPath } from "@/lib/geography";
import { getEnrichedCityContent } from "@/lib/city-content";
import { cityPageSchema, cityFaqSchema } from "@/lib/schema";
import { WaveDivider } from "@/components/wave-divider";
import { AdSlot } from "@/components/ad-slot";
import { clampDescription, clampTitle } from "@/lib/seo-utils";

function buildCityFaqs(cityName: string, stateAbbr: string, groomerCount: number, parkCount: number) {
  const stateName = stateAbbr === "WA" ? "Washington" : "Oregon";
  return [
    {
      question: `How much does dog grooming cost in ${cityName}?`,
      answer: `Dog grooming in ${cityName}, ${stateName} typically costs $40 to $90 for a standard bath and haircut, depending on your dog's size, breed, and coat condition. Prices may be higher for large breeds or dogs with matted fur. Compare ${groomerCount} groomers on GroomLocal to find the best value.`,
    },
    {
      question: "How often should I groom my dog?",
      answer: "Most dogs should be professionally groomed every 4 to 8 weeks. Dogs with longer coats (Poodles, Shih Tzus, Goldendoodles) need grooming every 4 to 6 weeks. Short-haired breeds can go 8 to 12 weeks between appointments. Regular brushing at home between visits helps prevent matting.",
    },
    {
      question: `What should I look for in a dog groomer in ${cityName}?`,
      answer: `Look for groomers with positive reviews, proper certifications, and a clean facility. Ask about their experience with your dog's breed. A good groomer will discuss your preferences before starting and handle your dog with patience. ${cityName} has ${groomerCount} groomers listed on GroomLocal, each with service details and contact information.`,
    },
    {
      question: `Are there mobile dog groomers in ${cityName}?`,
      answer: `Yes, several groomers in ${cityName}, ${stateAbbr} offer mobile grooming services. Mobile groomers come to your home in a fully equipped van, which is convenient for busy pet owners or dogs that get anxious at salons. Check individual listings on GroomLocal for mobile availability.`,
    },
    {
      question: "What grooming services do most groomers offer?",
      answer: "Most professional groomers offer bath and blow-dry, haircut and styling, nail trimming, ear cleaning, teeth brushing, and de-shedding treatments. Many also provide add-on services like flea treatments, medicated baths, and anal gland expression. Breed-specific cuts are available at salons with experienced stylists.",
    },
  ];
}

interface CityPageProps {
  params: Promise<{ state: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state, city } = await params;
  const stateAbbr = stateAbbrFromSlug(state);
  const cityData = await getCityBySlug(city, stateAbbr);
  const stateName = stateNameFromSlug(state);
  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);
  const content = getEnrichedCityContent(stateAbbr, city);

  const groomerCount = cityData?.groomer_count ?? 0;
  const groomerText = groomerCount
    ? `${groomerCount} verified groomer${groomerCount !== 1 ? "s" : ""}`
    : "verified groomers";
  // Build title within 47-char limit (layout appends " | GroomLocal")
  // Try formats from most descriptive to shortest
  const titleWithCount = groomerCount
    ? `Top ${groomerCount} Dog Groomers in ${cityName}, ${stateAbbr}`
    : `Dog Groomers in ${cityName}, ${stateAbbr}`;
  const titleShort = groomerCount
    ? `Dog Groomers in ${cityName}, ${stateAbbr} (${groomerCount})`
    : `Dog Groomers in ${cityName}, ${stateAbbr}`;
  const title = titleWithCount.length <= 47
    ? titleWithCount
    : titleShort.length <= 47
      ? titleShort
      : clampTitle(titleShort);
  const basePart = `Compare ${groomerText} in ${cityName}, ${stateName} with prices, reviews, and services.`;
  const withCta = `${basePart} Find your next groomer on GroomLocal.`;
  const parkCount = content?.dogParks?.length ?? 0;
  const withParks = parkCount > 0
    ? `${basePart} Plus ${parkCount} local dog parks. Find your next groomer on GroomLocal.`
    : withCta;
  // Use the version with parks if it fits, otherwise drop parks mention
  const description = clampDescription(
    withParks.length <= 155 ? withParks : withCta,
  );
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

  const [listings, cityData, relatedCities, featuredListings] = await Promise.all([
    getListingsByCity(city, stateAbbr),
    getCityBySlug(city, stateAbbr),
    getCitiesByState(stateAbbr),
    getFeaturedByCity(city, stateAbbr),
  ]);

  const cityName = cityData?.name ?? city.charAt(0).toUpperCase() + city.slice(1);
  const nearby = relatedCities.filter((c) => c.slug !== city).slice(0, 6);
  const content = getEnrichedCityContent(stateAbbr, city);

  const faqs = buildCityFaqs(cityName, stateAbbr, listings.length, content?.dogParks?.length ?? 0);

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

      {/* Main content - Listings */}
      <section className="bg-bg flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
          {featuredListings.length > 0 && (
            <FeaturedSection listings={featuredListings} cityName={cityName} />
          )}
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

          {/* Trails */}
          {content.trails && content.trails.length > 0 && (
            <section className="bg-white pt-2 pb-10">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 mb-6">
                  <TreeStructure weight="duotone" className="w-6 h-6 text-brand-secondary" />
                  <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                    Trails and Parks Near {cityName}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {content.trails.map((trail) => (
                    <div key={trail.name} className="rounded-xl border border-border bg-bg/50 p-5">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-secondary mb-2">
                        {trail.type}
                      </span>
                      <h3 className="font-heading text-sm font-semibold text-brand-primary mb-1">
                        {trail.name}
                      </h3>
                      {trail.description && (
                        <p className="text-xs text-text-muted leading-relaxed">{trail.description}</p>
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
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                        {spot.description}
                      </p>
                      {spot.rating && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-xs font-semibold text-brand-primary">{spot.rating}</span>
                          <span className="text-xs text-text-muted">/ 5</span>
                          {spot.reviewCount && (
                            <span className="text-xs text-text-muted">({spot.reviewCount} reviews)</span>
                          )}
                        </div>
                      )}
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

      {/* FAQ Section */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Question weight="duotone" className="w-6 h-6 text-brand-secondary" />
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              Frequently Asked Questions About Dog Grooming in {cityName}
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
              Find a Dog Groomer in {cityName}, {stateAbbr}
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              {cityName} has {listings.length} dog groomer{listings.length !== 1 ? "s" : ""} listed on GroomLocal,
              {" "}serving pet owners across {stateAbbr === "WA" ? "Washington" : "Oregon"}.
              {content && content.dogParks.length > 0 && (
                <> The area is home to {content.dogParks.length} dog park{content.dogParks.length !== 1 ? "s" : ""}, making it easy to exercise your dog before or after a grooming appointment.</>
              )}
              {" "}All listings in our directory include service details and contact information so you can compare options and find the right fit.
            </p>
            <p className="text-text-muted text-sm leading-relaxed mt-3">
              Not sure where to start? Read our guide on{" "}
              <Link href="/blog/choosing-the-right-groomer-for-your-pet" className="text-brand-accent underline hover:text-brand-primary">
                how to choose a dog groomer
              </Link>, or check{" "}
              <Link href="/blog/how-often-should-you-groom-your-dog" className="text-brand-accent underline hover:text-brand-primary">
                how often you should groom your dog
              </Link>{" "}based on breed and coat type.
              {stateAbbr === "WA" || stateAbbr === "OR" ? (
                <> For local pricing, see our{" "}
                  <Link href="/blog/dog-grooming-cost-seattle-portland-2026" className="text-brand-accent underline hover:text-brand-primary">
                    Seattle and Portland grooming cost guide
                  </Link>.
                </>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cityPageSchema(listings, cityName, stateAbbr, state, city, faqs)),
        }}
      />
    </div>
  );
}
