import { test } from "node:test";
import assert from "node:assert/strict";
import { pickNearbyGroomers, ringAfter } from "@/lib/nearby-groomers";

const make = (ids: string[]) => ids.map((id) => ({ id }));
const ids = (items: { id: string }[]) => items.map((i) => i.id);

test("the ring starts after the listing and wraps around", () => {
  const city = make(["a", "b", "c", "d", "e", "f"]);
  assert.deepEqual(ids(ringAfter(city[1], city, 4)), ["c", "d", "e", "f"]);
  assert.deepEqual(ids(ringAfter(city[4], city, 4)), ["f", "a", "b", "c"]);
  assert.deepEqual(ids(ringAfter(city[5], city, 4)), ["a", "b", "c", "d"]);
});

test("the ring ignores input order and never includes the listing", () => {
  const city = make(["e", "a", "d", "b", "c"]);
  const picks = ringAfter({ id: "c" }, city, 4);
  assert.deepEqual(ids(picks), ["d", "e", "a", "b"]);
});

test("a city with five listings fills all four slots from the city", () => {
  const city = make(["a", "b", "c", "d", "e"]);
  const result = pickNearbyGroomers(city[0], city, make(["x", "y"]));
  assert.deepEqual(ids(result.listings), ["b", "c", "d", "e"]);
  assert.equal(result.allInCity, true);
});

test("every listing in a city of five gets four inbound links per four outbound", () => {
  const city = make(["a", "b", "c", "d", "e"]);
  const inbound = new Map<string, number>();
  for (const self of city) {
    for (const pick of pickNearbyGroomers(self, city, []).listings) {
      inbound.set(pick.id, (inbound.get(pick.id) ?? 0) + 1);
    }
  }
  assert.deepEqual([...inbound.values()], [4, 4, 4, 4, 4]);
});

test("a small city keeps its own listings first and borrows the rest from the metro", () => {
  const city = make(["b", "d"]);
  const metro = make(["a", "c", "e", "f"]);
  const result = pickNearbyGroomers(city[0], city, metro);
  assert.deepEqual(ids(result.listings), ["d", "c", "e", "f"]);
  assert.equal(result.allInCity, false);
});

test("a lone listing gets four metro neighbors, and none when the metro is empty", () => {
  const alone = { id: "m" };
  assert.deepEqual(ids(pickNearbyGroomers(alone, [alone], make(["a", "z", "p", "q", "r"])).listings), ["p", "q", "r", "z"]);
  const empty = pickNearbyGroomers(alone, [alone], []);
  assert.deepEqual(empty.listings, []);
});

test("a small city with no metro neighbors stays labeled as its own city", () => {
  const city = make(["a", "b", "c"]);
  const result = pickNearbyGroomers(city[0], city, []);
  assert.deepEqual(ids(result.listings), ["b", "c"]);
  assert.equal(result.allInCity, true);
});

test("the picks are the same on every call", () => {
  const city = make(["c", "a", "b", "d"]);
  const metro = make(["z", "y", "x"]);
  const first = ids(pickNearbyGroomers(city[0], city, metro).listings);
  const second = ids(pickNearbyGroomers(city[0], [...city].reverse(), [...metro].reverse()).listings);
  assert.deepEqual(first, second);
});
