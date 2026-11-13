import { clampDescription } from "@/lib/seo-utils";

export interface ProfileDescriptionInput {
  name: string;
  city: string;
  state: string;
  text: string;
  showsPrices: boolean;
}

export function profileMetaDescription({ name, city, state, text, showsPrices }: ProfileDescriptionInput): string {
  // Strip URLs, image refs, markdown artifacts, and excessive whitespace from scraped data
  const rawDesc = text
    .replace(/\(?\bhttps?:\/\/[^\s)]+\)?/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/[#*_~`]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Every profile shows its location; only some show prices. Same length either way keeps short text out of the fallback.
  const detail = showsPrices ? "pricing" : "location";
  if (!rawDesc || rawDesc.length < 20) {
    return clampDescription(
      `${name} offers professional dog grooming in ${city}, ${state}. View services, ${detail}, hours, and contact info on GroomLocal.`
    );
  }
  if (rawDesc.length < 120) {
    const sentence = /[.!?]$/.test(rawDesc) ? rawDesc : `${rawDesc}.`;
    let padded = `${sentence} View services, ${detail}, and contact info for ${name} in ${city}, ${state}. Compare on GroomLocal.`;
    if (padded.length < 120) {
      padded = `${name} is a dog groomer in ${city}, ${state}. ${sentence} View services, ${detail}, and hours on GroomLocal.`;
    }
    return clampDescription(padded);
  }
  return clampDescription(rawDesc);
}
