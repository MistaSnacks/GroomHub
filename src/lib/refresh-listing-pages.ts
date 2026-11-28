import { revalidatePath, updateTag } from "next/cache";
import { LISTINGS_CACHE_TAG } from "@/lib/supabase/queries";

/**
 * Directory pages rebuild at most once a day (`revalidate = 86400`), because
 * each rebuild reads Supabase and bots crawl every page. So a save must refresh
 * them itself: call this from any server action that changes a listing.
 * Pages rebuild on their next visit, not all at once.
 */
export const LISTING_ROUTES = [
  "/",
  "/dog-grooming",
  "/dog-grooming/[state]",
  "/dog-grooming/[state]/[city]",
  "/cat-grooming/[state]",
  "/cat-grooming/[state]/[city]",
  "/mobile-grooming",
  "/mobile-grooming/[state]",
  "/mobile-grooming/[state]/[city]",
  "/services/[slug]",
  "/specialties/[slug]",
  "/groomer/[slug]",
] as const;

export function refreshListingPages(): void {
  updateTag(LISTINGS_CACHE_TAG);
  for (const route of LISTING_ROUTES) revalidatePath(route, "page");
  revalidatePath("/sitemap.xml");
}
