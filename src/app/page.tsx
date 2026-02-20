import { BrowseByServiceSection } from "@/components/browse-by-service-section";
import { BrowseBySpecialtySection } from "@/components/browse-by-specialty-section";
import { BrowseByCitySection } from "@/components/browse-by-city-section";
import { getCitiesByState, getTotalListingCount, getFeaturedListings } from "@/lib/supabase/queries";
import { HomeHero } from "@/components/home-hero";
import { ListingCard } from "@/components/listing-card";
import { PremiumPlaceholderCard } from "@/components/premium-placeholder-card";
import { PromoFindGroomers } from "@/components/promo-find-groomers";
import { PromoClaimListing } from "@/components/promo-claim-listing";
import { AdSlot } from "@/components/ad-slot";
import { WaveDivider } from "@/components/wave-divider";

export default async function HomePage() {
  const [waCities, orCities, totalCount, featuredListings] = await Promise.all([
    getCitiesByState("WA"),
    getCitiesByState("OR"),
    getTotalListingCount(),
    getFeaturedListings(3),
  ]);

  const cityCount = waCities.length + orCities.length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* HERO SECTION */}
      <HomeHero totalCount={totalCount} />

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* PREMIUM GROOMERS */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-4">
              Premium Groomers in the PNW
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Discover top-rated, paw-verified grooming salons that pet parents trust the most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredListings.slice(0, 3).map((listing, index) => (
              <ListingCard key={listing.slug} listing={listing} index={index} compact />
            ))}
            {Array.from({ length: Math.max(0, 3 - featuredListings.length) }).map((_, i) => (
              <PremiumPlaceholderCard key={`placeholder-${i}`} index={featuredListings.length + i} />
            ))}
          </div>
        </div>
      </section>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* BROWSE BY SERVICE */}
      <BrowseByServiceSection />

      {/* Cream → Teal wave before promo */}
      <WaveDivider variant="steep" fromColor="#FDF8F0" toColor="#4ECDC4" />

      {/* PROMO: FIND GROOMERS */}
      <PromoFindGroomers />

      {/* Teal → White wave after promo */}
      <WaveDivider variant="double" fromColor="#4ECDC4" toColor="#FFFFFF" />

      {/* BROWSE BY SPECIALTY */}
      <BrowseBySpecialtySection />

      {/* White → Coral wave before claim CTA */}
      <WaveDivider variant="gentle" fromColor="#FFFFFF" toColor="#FF7E67" />

      {/* PROMO: CLAIM LISTING */}
      <PromoClaimListing />

      {/* Coral → White wave after claim CTA */}
      <WaveDivider variant="asymmetric" fromColor="#FF7E67" toColor="#FFFFFF" />

      {/* BROWSE BY CITY */}
      <BrowseByCitySection waCities={waCities} orCities={orCities} />

      {/* Homepage bottom ad */}
      <section className="bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdSlot slot="homepage-bottom" format="leaderboard" />
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
