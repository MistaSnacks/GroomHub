import { getFeaturedCountsForCities } from "@/lib/supabase/queries";
import { PricingPageClient } from "./pricing-page-client";

const TOP_CITIES = [
  { slug: "seattle", name: "Seattle", stateAbbr: "WA" },
  { slug: "portland", name: "Portland", stateAbbr: "OR" },
  { slug: "tacoma", name: "Tacoma", stateAbbr: "WA" },
  { slug: "bellevue", name: "Bellevue", stateAbbr: "WA" },
  { slug: "beaverton", name: "Beaverton", stateAbbr: "OR" },
];

export default async function PricingPage() {
  const featuredCounts = await getFeaturedCountsForCities(TOP_CITIES);

  return <PricingPageClient featuredCounts={featuredCounts} />;
}
