export const NEARBY_GROOMER_COUNT = 4;

export interface NearbyGroomers<T> {
  listings: T[];
  /** True when every pick is in the same city, so a "Similar Groomers in {city}" heading is accurate. */
  allInCity: boolean;
}

/**
 * The `count` items that follow `self` in `id` order, wrapping at the end of the list.
 * Each listing sits in the lists of its neighbors, so inbound links spread evenly,
 * and the picks never change between renders.
 */
export function ringAfter<T extends { id: string }>(self: T, items: readonly T[], count: number): T[] {
  const others = items.filter((item) => item.id !== self.id).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const next = others.findIndex((item) => item.id > self.id);
  const start = next === -1 ? 0 : next;
  return [...others.slice(start), ...others.slice(0, start)].slice(0, count);
}

/** Neighbors from the listing's own city first; a city that is too small borrows from its metro. */
export function pickNearbyGroomers<T extends { id: string }>(
  self: T,
  sameCity: readonly T[],
  metroNeighbors: readonly T[],
  count = NEARBY_GROOMER_COUNT,
): NearbyGroomers<T> {
  const local = ringAfter(self, sameCity, count);
  if (local.length === count) return { listings: local, allInCity: true };
  const fill = ringAfter(self, metroNeighbors, count - local.length);
  return { listings: [...local, ...fill], allInCity: fill.length === 0 };
}
