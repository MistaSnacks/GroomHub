import type { CityWithCount } from "@/lib/types";
import { stateSlugFromAbbr } from "@/lib/geography";
import { CityPillGrid } from "@/components/city-pill-grid";

interface BrowseByCitySectionProps {
  waCities: CityWithCount[];
  orCities: CityWithCount[];
}

const WA_SHOW_COUNT = 7;
const OR_SHOW_COUNT = 5;

export function BrowseByCitySection({ waCities, orCities }: BrowseByCitySectionProps) {
  const waTotal = waCities.reduce((sum, c) => sum + c.groomer_count, 0);
  const orTotal = orCities.reduce((sum, c) => sum + c.groomer_count, 0);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
            Explore the PNW
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-2">
            Browse by City
          </h2>
          <p className="text-text-muted text-base max-w-lg mx-auto">
            Find top-rated groomers in your neighborhood
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CityPillGrid
            cities={waCities}
            stateSlug={stateSlugFromAbbr("WA")}
            stateAbbr="WA"
            stateName="Washington"
            cardBg="bg-brand-secondary/10"
            badgeBg="bg-brand-primary text-white"
            totalGroomers={waTotal}
            initialLimit={WA_SHOW_COUNT}
            showSearch={false}
            ctaHref="/dog-grooming/wa"
            ctaLabel="View all Washington groomers"
          />
          <CityPillGrid
            cities={orCities}
            stateSlug={stateSlugFromAbbr("OR")}
            stateAbbr="OR"
            stateName="Oregon"
            cardBg="bg-brand-accent/10"
            badgeBg="bg-brand-accent text-white"
            totalGroomers={orTotal}
            initialLimit={OR_SHOW_COUNT}
            showSearch={false}
            ctaHref="/dog-grooming/or"
            ctaLabel="View all Oregon groomers"
          />
        </div>
      </div>
    </section>
  );
}
