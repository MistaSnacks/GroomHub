// src/lib/profile-quality.ts
// Profile quality gate for featured listings.
// Featured groomers must maintain a complete profile to keep their spot.

import type { BusinessListing } from "./types";

export interface QualityCheck {
  passed: boolean;
  missing: string[];
}

const MIN_SERVICES = 3;

/**
 * Check if a listing meets the minimum quality requirements for featured placement.
 * Requirements:
 * - At least 1 photo uploaded
 * - Business description filled out (non-empty)
 * - Business hours listed (at least 1 day)
 * - At least 3 services tagged
 */
export function checkProfileQuality(listing: BusinessListing): QualityCheck {
  const missing: string[] = [];

  if (!listing.images || listing.images.length === 0) {
    missing.push("At least 1 photo");
  }

  if (!listing.description || listing.description.trim().length === 0) {
    missing.push("Business description");
  }

  if (!listing.hours || listing.hours.length === 0) {
    missing.push("Business hours");
  }

  if (!listing.services || listing.services.length < MIN_SERVICES) {
    missing.push(`At least ${MIN_SERVICES} services`);
  }

  return {
    passed: missing.length === 0,
    missing,
  };
}
