import type { Metadata } from "next";
import Link from "next/link";
import { CaretRight, Van } from "@phosphor-icons/react/dist/ssr";
import { getAllCitiesWithCounts } from "@/lib/supabase/queries";
import { stateSlugFromAbbr } from "@/lib/geography";
import { WaveDivider } from "@/components/wave-divider";

export const metadata: Metadata = {
  title: "Mobile Dog Groomers — Grooming at Your Door",
  description: "Find mobile dog groomers across Washington and Oregon. Convenient grooming that comes to your home.",
};

export default async function MobileGroomingHub() {
  const allCities = await getAllCitiesWithCounts();
  const waCities = allCities.filter((c) => c.state_abbr === "WA");
  const orCities = allCities.filter((c) => c.state_abbr === "OR");

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-bg py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Mobile Grooming</span>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <Van weight="duotone" className="w-8 h-8 text-brand-secondary" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">
              Mobile Dog Groomers in the <span className="text-brand-secondary">Pacific Northwest</span>
            </h1>
          </div>
          <p className="text-text-muted text-lg">Grooming that comes to your door. Browse cities below.</p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      <section className="bg-white flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-10">
          {[
            { label: "Washington", abbr: "WA", cities: waCities, badgeBg: "bg-brand-primary text-white" },
            { label: "Oregon", abbr: "OR", cities: orCities, badgeBg: "bg-brand-accent text-white" },
          ].map(({ label, abbr, cities, badgeBg }) => (
            <div key={abbr}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${badgeBg} font-heading font-bold text-sm shrink-0`}>
                  {abbr}
                </div>
                <h2 className="font-heading text-xl font-bold text-brand-primary">{label}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/mobile-grooming/${stateSlugFromAbbr(abbr)}/${city.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm hover:border-brand-accent/40 hover:shadow-sm transition-all group"
                  >
                    <span className="text-brand-primary font-medium group-hover:text-brand-accent transition-colors">{city.name}</span>
                    <span className="text-text-muted text-xs">{city.groomer_count}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
