import { getCityContent as getCuratedContent } from "./city-data";
import enrichmentRaw from "../data/city-enrichment.json";

export interface EnrichedCityContent {
  intro: string;
  neighborhoods: Array<{ name: string; description: string }>;
  dogParks: Array<{
    name: string;
    description: string;
    offLeash: boolean;
    features?: string[];
  }>;
  dogFriendlySpots: Array<{
    name: string;
    description: string;
    type: string;
    rating?: number;
    reviewCount?: number;
  }>;
  trails: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  source: "curated" | "enriched";
}

interface EnrichmentEntry {
  citySlug: string;
  cityName: string;
  state: string;
  lat: number;
  lng: number;
  listingCount: number;
  intro: string;
  dogParks: Array<{
    name: string;
    description: string;
    offLeash: boolean;
    features: string[];
    source: string;
  }>;
  trails: Array<{
    name: string;
    type: string;
    description: string;
    source: string;
  }>;
  dogFriendlySpots: Array<{
    name: string;
    description: string;
    type: string;
    rating?: number;
    reviewCount?: number;
    source: string;
  }>;
}

const enrichmentData = enrichmentRaw as Record<string, EnrichmentEntry>;

export function getEnrichedCityContent(
  stateAbbr: string,
  citySlug: string
): EnrichedCityContent | null {
  // Curated data takes priority
  const curated = getCuratedContent(stateAbbr, citySlug);
  if (curated) {
    return {
      intro: curated.intro,
      neighborhoods: curated.neighborhoods,
      dogParks: curated.dogParks,
      dogFriendlySpots: curated.dogFriendlySpots.map((s) => ({
        name: s.name,
        description: s.description,
        type: s.type,
      })),
      trails: [],
      source: "curated",
    };
  }

  // Fall back to enrichment data
  const key = `${stateAbbr.toUpperCase()}:${citySlug.toLowerCase()}`;
  const entry = enrichmentData[key];
  if (!entry) return null;

  // Build a better intro from enrichment data
  const stateName = stateAbbr === "WA" ? "Washington" : "Oregon";
  const parkCount = (entry.dogParks ?? []).filter((p) => p.name.trim() !== "").length;
  const spotCount = (entry.dogFriendlySpots ?? []).length;
  const trailCount = (entry.trails ?? []).filter((t) => t.name.trim() !== "").length;

  const parts: string[] = [];
  parts.push(`${entry.cityName} is home to ${entry.listingCount} dog groomer${entry.listingCount !== 1 ? "s" : ""} in our ${stateName} directory.`);

  if (parkCount > 0 && spotCount > 0) {
    parts.push(`The area offers ${parkCount} dog park${parkCount !== 1 ? "s" : ""} and ${spotCount} dog-friendly restaurant${spotCount !== 1 ? "s" : ""} and breweries.`);
  } else if (parkCount > 0) {
    parts.push(`The area has ${parkCount} nearby dog park${parkCount !== 1 ? "s" : ""} for off-leash play.`);
  }

  if (trailCount > 0) {
    parts.push(`You can also explore ${trailCount} trail${trailCount !== 1 ? "s" : ""} and park${trailCount !== 1 ? "s" : ""} nearby.`);
  }

  const intro = parts.join(" ");

  return {
    intro,
    neighborhoods: [],
    dogParks: (entry.dogParks ?? [])
      .filter((p) => p.name.trim() !== "")
      .map((p) => ({
        name: p.name,
        description: p.description,
        offLeash: p.offLeash,
        features: p.features.length > 0 ? p.features : undefined,
      })),
    dogFriendlySpots: (entry.dogFriendlySpots ?? []).map((s) => ({
      name: s.name,
      description: s.description,
      type: s.type,
      rating: s.rating,
      reviewCount: s.reviewCount,
    })),
    trails: (entry.trails ?? [])
      .filter((t) => t.name.trim() !== "")
      .map((t) => ({
        name: t.name,
        type: t.type,
        description: t.description,
      })),
    source: "enriched",
  };
}
