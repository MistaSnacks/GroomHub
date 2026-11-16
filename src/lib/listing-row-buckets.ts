/**
 * Vercel's data cache refuses any item over 2 MB. When it refuses, nothing is
 * cached and every caller downloads the full listing table from Supabase again.
 * The table passed 2 MB in Nov 2026 (2,106,187 bytes) and used up the Supabase
 * egress quota. So the table is cached in slug ranges, each far under 2 MB.
 *
 * Each range is [from, to): `from` is inclusive, `to` is exclusive, and null
 * means open. The ranges touch end to end, so every slug is in exactly one.
 */
export type SlugRange = readonly [from: string | null, to: string | null];

export const LISTING_SLUG_RANGES: readonly SlugRange[] = [
  [null, "d"],
  ["d", "j"],
  ["j", "p"],
  ["p", "t"],
  ["t", null],
];

/** Log a warning when one cached range grows past this size (Vercel's limit is 2 MB). */
export const SLUG_RANGE_WARN_BYTES = 1_500_000;

/** Same order the old single query used: rating desc with nulls first (Postgres default), then id asc. */
export function compareByRatingThenId(
  a: { rating: number | null; id: string },
  b: { rating: number | null; id: string },
): number {
  if (a.rating !== b.rating) {
    if (a.rating === null) return -1;
    if (b.rating === null) return 1;
    return b.rating - a.rating;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
