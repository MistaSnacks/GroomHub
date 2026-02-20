import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CaretRight, PawPrint, MapPin, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CityListingsClient } from "@/components/city-listings-client";
import { getListingsBySpecialtyTag } from "@/lib/supabase/queries";
import {
  SPECIALTY_TAGS,
  SERVICE_TAGS,
  isValidSpecialtySlug,
  getSpecialtyTag,
} from "@/lib/tags";
import { STATES, stateSlugFromAbbr, buildCityPath, buildServicePath } from "@/lib/geography";
import { servicePageSchema } from "@/lib/schema";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";
import type { NormalizedListing } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SPECIALTY_TAGS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = getSpecialtyTag(slug);
  if (!tag) return {};

  return {
    title: `${tag.label} Groomers — Specialists in the PNW`,
    description: `Find groomers specializing in ${tag.label.toLowerCase()} across Washington and Oregon. Compare ratings, reviews, and book with confidence.`,
    alternates: { canonical: `/specialties/${slug}` },
  };
}

function groupByStateAndCity(listings: NormalizedListing[]) {
  const stateMap = new Map<string, Map<string, { name: string; count: number }>>();

  for (const l of listings) {
    if (!l.city || l.city === "Unknown") continue;
    if (!stateMap.has(l.state)) stateMap.set(l.state, new Map());
    const cityMap = stateMap.get(l.state)!;
    const existing = cityMap.get(l.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(l.city_slug, { name: l.city, count: 1 });
    }
  }

  return stateMap;
}

export default async function SpecialtyLandingPage({ params }: Props) {
  const { slug } = await params;

  if (!isValidSpecialtySlug(slug)) notFound();
  const tag = getSpecialtyTag(slug)!;

  const listings = await getListingsBySpecialtyTag(slug);
  const stateMap = groupByStateAndCity(listings);

  const schema = servicePageSchema(slug, tag.label, "specialty", listings);

  // Related services (first 6)
  const relatedServices = SERVICE_TAGS.slice(0, 6);
  // Other specialties (exclude current)
  const otherSpecialties = SPECIALTY_TAGS.filter((s) => s.slug !== slug).slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([schema.breadcrumb, schema.itemList]) }}
      />

      {/* Hero */}
      <section className="bg-bg py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href="/specialties" className="hover:text-brand-primary transition-colors">Specialties</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">{tag.label}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <PawPrint weight="fill" className="w-8 h-8 text-brand-secondary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-primary">
              {tag.label}
            </h1>
          </div>
          <p className="text-text-muted flex items-center gap-1.5 text-lg">
            <MapPin weight="fill" className="w-5 h-5 text-brand-secondary" />
            {listings.length} specialist groomers across the Pacific Northwest
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FDF8F0" />

      {/* State/City Breakdown */}
      {listings.length > 0 && (
        <section className="bg-bg py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-10">
          {STATES.map(({ abbr, name }) => {
            const cityMap = stateMap.get(abbr);
            if (!cityMap || cityMap.size === 0) return null;
            const cities = [...cityMap.entries()]
              .map(([citySlug, data]) => ({ slug: citySlug, ...data }))
              .sort((a, b) => b.count - a.count);

            return (
              <div key={abbr}>
                <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                  {name} — {cities.reduce((sum, c) => sum + c.count, 0)} groomers
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`${buildCityPath(stateSlugFromAbbr(abbr), city.slug)}?specialties=${slug}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 hover:border-brand-accent/40 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin weight="fill" className="w-4 h-4 text-brand-accent shrink-0" />
                        <span className="text-sm font-medium text-text group-hover:text-brand-primary transition-colors">
                          {city.name}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted">{city.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        </section>
      )}

      <WaveDivider variant="asymmetric" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* All Listings */}
      <section className="bg-white flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading filters...</div>}>
            <CityListingsClient
              listings={listings}
              heading={`All ${tag.label} Groomers`}
              preFilterSpecialty={slug}
            />
          </Suspense>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* Related Services */}
      <section className="bg-bg py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
              Popular Services
            </h2>
            <AnimatedSection variant="stagger" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {relatedServices.map((svc) => (
                <AnimatedItem key={svc.slug}>
                  <Link
                    href={buildServicePath(svc.slug)}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-center hover:border-brand-secondary/40 hover:shadow-sm transition-all group block"
                  >
                    <div className="text-sm font-medium text-brand-primary group-hover:text-brand-accent transition-colors">
                      {svc.label}
                    </div>
                  </Link>
                </AnimatedItem>
              ))}
            </AnimatedSection>
          </div>

          <div>
            <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
              Other Specialties
            </h2>
            <AnimatedSection variant="stagger" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {otherSpecialties.map((spec) => (
                <AnimatedItem key={spec.slug}>
                  <Link
                    href={`/specialties/${spec.slug}`}
                    className="rounded-xl border border-border bg-white px-4 py-3 text-center hover:border-brand-accent/40 hover:shadow-sm transition-all group block"
                  >
                    <div className="text-sm font-medium text-brand-primary group-hover:text-brand-accent transition-colors">
                      {spec.label}
                    </div>
                  </Link>
                </AnimatedItem>
              ))}
            </AnimatedSection>
          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
    </div>
  );
}
