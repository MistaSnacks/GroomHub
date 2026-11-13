import { clampDescription } from "@/lib/seo-utils";

export interface ProfileDescriptionInput {
  name: string;
  city: string;
  state: string;
  text: string;
  showsPrices: boolean;
}

export function profileMetaDescription({ name, city, state, text }: ProfileDescriptionInput): string {
  // Strip URLs, image refs, markdown artifacts, and excessive whitespace from scraped data
  const rawDesc = text
    .replace(/\(?\bhttps?:\/\/[^\s)]+\)?/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/[#*_~`]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!rawDesc || rawDesc.length < 20) {
    return clampDescription(
      `${name} offers professional dog grooming in ${city}, ${state}. View services, pricing, hours, and contact info on GroomLocal.`
    );
  }
  if (rawDesc.length < 120) {
    let padded = `${rawDesc} View services, pricing, and contact info for ${name} in ${city}, ${state}. Compare on GroomLocal.`;
    if (padded.length < 120) {
      padded = `${name} is a dog groomer in ${city}, ${state}. ${rawDesc} View services, pricing, and hours on GroomLocal.`;
    }
    return clampDescription(padded);
  }
  return clampDescription(rawDesc);
}
