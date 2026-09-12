import { getHomeCopy, marketingMetadata } from "@/lib/cms/marketing";
import { marketingSection, fillMarketingCounts } from "@/lib/marketing-copy";
import { SnackboxOverlay } from "@/lib/cms/Overlay";
import type { Metadata } from "next";
import { websiteSchema, organizationSchema } from "@/lib/schema";
import { BrowseByServiceSection } from "@/components/browse-by-service-section";
import { BrowseBySpecialtySection } from "@/components/browse-by-specialty-section";
import { BrowseByCitySection } from "@/components/browse-by-city-section";
import { getCitiesByState, getTotalListingCount, getFeaturedListings } from "@/lib/supabase/queries";
import { HomeHero } from "@/components/home-hero";
import { ListingCard } from "@/components/listing-card";
import { PremiumPlaceholderCard } from "@/components/premium-placeholder-card";
import { PromoFindGroomers } from "@/components/promo-find-groomers";
import { PromoClaimListing } from "@/components/promo-claim-listing";
import { AdSlot, ADS_ENABLED } from "@/components/ad-slot";
import { WaveDivider } from "@/components/wave-divider";

export const revalidate = 300;

const fallbackMetadata: Metadata = {
  alternates: { canonical: "https://groomlocal.com" },
  openGraph: {
    title: "GroomLocal | Find Dog Groomers in the PNW",
    description:
      "Find the best dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. 1,177+ groomer listings with services, pricing, and contact info.",
    type: "website",
    url: "https://groomlocal.com",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GroomLocal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GroomLocal | Find Dog Groomers in the PNW",
    description:
      "Find the best dog groomer in Seattle, Tacoma, Portland and the Pacific Northwest. 1,177+ groomer listings with services, pricing, and contact info.",
    images: ["/og-image.png"],
  },
};

export async function generateMetadata() { return marketingMetadata(await getHomeCopy(),fallbackMetadata); }

export default async function HomePage() {
  const [waCities, orCities, totalCount, featuredListings, copy] = await Promise.all([
    getCitiesByState("WA"),
    getCitiesByState("OR"),
    getTotalListingCount(),
    getFeaturedListings(3),
    getHomeCopy(),
  ]);

  const section=(key:string)=>marketingSection(copy,key);
  const cityCount = waCities.length + orCities.length;

  const { "@context": _ws, ...websiteBody } = websiteSchema();
  const { "@context": _org, ...orgBody } = organizationSchema();
  const homepageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [websiteBody, orgBody],
  };

  return (
    <div className="min-h-screen flex flex-col">
      {copy?._id && <SnackboxOverlay documents={[{docId:copy._id,title:"Homepage"}]} />}
      {/* HERO SECTION */}
      <HomeHero totalCount={totalCount} copy={copy} />

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* SEO Intro */}
      <section className="bg-white pt-8 pb-0">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-text-muted text-base leading-relaxed">
            {fillMarketingCounts(copy?.overview ?? "GroomLocal is the Pacific Northwest's dog grooming directory, covering {groomerCount}+ groomers across {cityCount} cities in Washington and Oregon. Compare services, pricing, and contact details for salons, mobile groomers, and self-wash stations near you. Whether you need a full groom for a Goldendoodle or a quick nail trim for a senior Lab, start here.",{groomerCount:totalCount.toLocaleString(),cityCount})}
          </p>
        </div>
      </section>

      {/* PREMIUM GROOMERS */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-4">
              {section("featured").heading ?? "Featured Groomers in the PNW"}
              <span className="ml-3 inline-flex items-center align-middle rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Sponsored
              </span>
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              {section("featured").intro ?? "Discover local grooming salons with hours, services, and pricing in one place."}
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
      <BrowseByServiceSection copy={section("services")} />

      {/* Cream → Teal wave before promo */}
      <WaveDivider variant="steep" fromColor="#FDF8F0" toColor="#4ECDC4" />

      {/* PROMO: FIND GROOMERS */}
      <PromoFindGroomers copy={section("findGroomers")} />

      {/* Teal → White wave after promo */}
      <WaveDivider variant="double" fromColor="#4ECDC4" toColor="#FFFFFF" />

      {/* BROWSE BY SPECIALTY */}
      <BrowseBySpecialtySection copy={section("specialties")} />

      {/* White → Coral wave before claim CTA */}
      <WaveDivider variant="gentle" fromColor="#FFFFFF" toColor="#FF7E67" />

      {/* PROMO: CLAIM LISTING */}
      <PromoClaimListing copy={section("forGroomers")} />

      {/* Coral → White wave after claim CTA */}
      <WaveDivider variant="asymmetric" fromColor="#FF7E67" toColor="#FFFFFF" />

      {/* BROWSE BY CITY */}
      <BrowseByCitySection copy={section("cities")} waCities={waCities} orCities={orCities} />

      {/* Homepage bottom ad (hidden unless NEXT_PUBLIC_SHOW_ADS=true) */}
      {ADS_ENABLED && (
        <section className="bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AdSlot slot="homepage-bottom" format="leaderboard" />
          </div>
        </section>
      )}

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
    </div>
  );
}
