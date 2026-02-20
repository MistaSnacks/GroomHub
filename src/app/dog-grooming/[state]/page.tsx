import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { CaretRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getCitiesByState, getListingsByState } from "@/lib/supabase/queries";
import { isValidStateSlug, stateNameFromSlug, stateAbbrFromSlug, stateSlugFromAbbr } from "@/lib/geography";
import { supabase } from "@/lib/supabase/client";
import { WaveDivider } from "@/components/wave-divider";
import { CityPillGrid } from "@/components/city-pill-grid";

const TOP_CITIES = ["seattle", "portland", "tacoma", "bellevue", "eugene", "olympia", "bend", "redmond"];

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state } = await params;

  if (!isValidStateSlug(state)) {
    return { title: "Redirecting..." };
  }

  const stateName = stateNameFromSlug(state);
  return {
    title: `Dog Groomers in ${stateName} — Browse by City`,
    description: `Browse dog groomers across ${stateName}. Find verified groomers in every city with real reviews and transparent pricing.`,
    alternates: { canonical: `/dog-grooming/${state}` },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;

  if (!isValidStateSlug(state)) {
    return handleLegacyRedirect(state);
  }

  const stateAbbr = stateAbbrFromSlug(state);
  const stateName = stateNameFromSlug(state);

  const [cities, listings] = await Promise.all([
    getCitiesByState(stateAbbr),
    getListingsByState(stateAbbr),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href="/dog-grooming" className="hover:text-brand-primary transition-colors">Dog Grooming</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">{stateName}</span>
          </nav>

          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3 text-brand-primary">
            Dog Groomers in <span className="text-brand-secondary">{stateName}</span>
          </h1>
          <p className="text-text-muted flex items-center gap-1.5 text-lg">
            <MapPin weight="fill" className="w-5 h-5 text-brand-secondary" />
            {listings.length} groomers across {cities.length} cities
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Cities */}
      <section className="bg-white py-10 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <h2 className="font-heading text-2xl font-semibold text-brand-primary mb-6">
            Browse Cities in {stateName}
          </h2>

          {cities.length > 0 ? (
            <CityPillGrid
              cities={cities}
              stateSlug={state}
              stateAbbr={stateAbbr}
              stateName={stateName}
              cardBg="bg-white"
              badgeBg="bg-brand-primary text-white"
              totalGroomers={listings.length}
              initialLimit={20}
              showSearch={true}
              highlightSlugs={TOP_CITIES}
            />
          ) : (
            <div className="text-center py-16 text-text-muted">
              <p className="font-heading text-lg">No cities found in {stateName} yet.</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}

async function handleLegacyRedirect(slug: string): Promise<never> {
  const dashParts = slug.split("-");
  const lastPart = dashParts[dashParts.length - 1]?.toUpperCase();

  if (lastPart === "WA" || lastPart === "OR") {
    const citySlug = dashParts.slice(0, -1).join("-");
    redirect(`/dog-grooming/${lastPart.toLowerCase()}/${citySlug}`);
  }

  const { data } = await supabase
    .from("business_listings")
    .select("city_slug, state")
    .eq("city_slug", slug)
    .limit(1)
    .single();

  if (data) {
    redirect(`/dog-grooming/${stateSlugFromAbbr(data.state)}/${data.city_slug}`);
  }

  notFound();
}
