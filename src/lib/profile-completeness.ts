/**
 * What a claimed listing still needs before it reads like a real profile (pure; no I/O).
 *
 * Imported listings start with a one-line placeholder description, no photos and no
 * logo, so those are the gaps owners are nudged about. Opening hours are left out on
 * purpose: imports carry a default schedule that cannot be told apart from real hours.
 */

export const MIN_PHOTOS = 3;
export const MIN_DESCRIPTION_CHARS = 150;
export const MIN_SERVICES = 3;

export type ProfileGapKey = "photos" | "logo" | "description" | "services" | "specialties";

export interface ProfileGap {
  key: ProfileGapKey;
  /** Short noun phrase for a checklist, e.g. "Photos of your shop and your work". */
  label: string;
  /** One line telling the owner what "done" looks like. */
  hint: string;
}

export interface ProfileFields {
  images?: string[] | null;
  logo_url?: string | null;
  description?: string | null;
  services?: string[] | null;
  specialties?: string[] | null;
}

export function profileGaps(listing: ProfileFields): ProfileGap[] {
  const gaps: ProfileGap[] = [];
  if ((listing.images?.length ?? 0) < MIN_PHOTOS) {
    gaps.push({
      key: "photos",
      label: "Photos of your shop and your work",
      hint: `Add at least ${MIN_PHOTOS}. Before and after shots work well.`,
    });
  }
  if (!listing.logo_url) {
    gaps.push({ key: "logo", label: "Your logo", hint: "A square image shows best." });
  }
  if ((listing.description?.trim().length ?? 0) < MIN_DESCRIPTION_CHARS) {
    gaps.push({
      key: "description",
      label: "A description in your own words",
      hint: "A few sentences on who you are, how you work and what dogs you see.",
    });
  }
  if ((listing.services?.length ?? 0) < MIN_SERVICES) {
    gaps.push({
      key: "services",
      label: "Your services",
      hint: `Pick everything you offer, at least ${MIN_SERVICES}.`,
    });
  }
  if ((listing.specialties?.length ?? 0) === 0) {
    gaps.push({
      key: "specialties",
      label: "Breeds and specialties",
      hint: "Tell dog owners what you are best at.",
    });
  }
  return gaps;
}
