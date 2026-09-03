import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight, Van, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getCitiesByState } from "@/lib/supabase/queries";
import { isValidStateSlug, stateNameFromSlug, stateAbbrFromSlug } from "@/lib/geography";
import { WaveDivider } from "@/components/wave-divider";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state } = await params;

  if (!isValidStateSlug(state)) {
    return { title: "Not Found" };
  }

  const stateName = stateNameFromSlug(state);
  const title = `Mobile Dog Groomers in ${stateName} | Browse by City`;
  const description = `Browse mobile dog groomers across ${stateName}. Find groomers who come to your door in every city.`;

  return {
    title,
    description,
    alternates: { canonical: `/mobile-grooming/${state}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/mobile-grooming/${state}`,
      siteName: "GroomLocal",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `Mobile dog groomers in ${stateName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function MobileGroomingStatePage({ params }: StatePageProps) {
  const { state } = await params;

  if (!isValidStateSlug(state)) {
    notFound();
  }

  const stateAbbr = stateAbbrFromSlug(state);
  const stateName = stateNameFromSlug(state);
  const cities = await getCitiesByState(stateAbbr);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-bg py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href="/mobile-grooming" className="hover:text-brand-primary transition-colors">Mobile Grooming</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">{stateName}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <Van weight="duotone" className="w-8 h-8 text-brand-secondary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-primary">
              Mobile Groomers in <span className="text-brand-secondary">{stateName}</span>
            </h1>
          </div>
          <p className="text-text-muted flex items-center gap-1.5 text-lg">
            <MapPin weight="fill" className="w-5 h-5 text-brand-secondary" />
            Browse {cities.length} cities to find groomers who come to you
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      <section className="bg-white py-10 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <h2 className="font-heading text-2xl font-semibold text-brand-primary mb-6">
            Browse Cities in {stateName}
          </h2>

          {cities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/mobile-grooming/${state}/${city.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm hover:border-brand-accent/40 hover:shadow-sm transition-all group"
                >
                  <span className="text-brand-primary font-medium group-hover:text-brand-accent transition-colors">{city.name}</span>
                  <span className="text-text-muted text-xs">{city.groomer_count}</span>
                </Link>
              ))}
            </div>
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
