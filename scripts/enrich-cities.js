/**
 * City Enrichment Pipeline
 *
 * Phase 1: Compute city centroids from Supabase (median lat/lng)
 * Phase 2a: Fetch dog parks + trails from Overpass (OpenStreetMap) - FREE
 * Phase 2b: Fetch dog-friendly restaurants/breweries from Google Places (needs API key)
 * Phase 3: Output enriched city-data JSON
 *
 * Usage:
 *   node scripts/enrich-cities.js                  # Run full pipeline (Overpass only)
 *   node scripts/enrich-cities.js --with-google     # Include Google Places (needs GOOGLE_PLACES_API_KEY in .env.local)
 *   node scripts/enrich-cities.js --dry-run         # Show what would be fetched without calling APIs
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const GOOGLE_PLACES_API = "https://places.googleapis.com/v1/places:searchText";
const OUTPUT_FILE = path.join(__dirname, "..", "data", "city-enrichment.json");
const SEARCH_RADIUS = 12000; // 12km radius for Overpass queries

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const WITH_GOOGLE = args.includes("--with-google");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleCase(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Phase 1: Compute city centroids
// ---------------------------------------------------------------------------

async function computeCentroids() {
  console.log("\n=== Phase 1: Computing city centroids ===");

  const { data, error } = await supabase
    .from("business_listings")
    .select("city_slug, city, state, lat, lng")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) throw new Error(`Supabase error: ${error.message}`);

  const cities = {};
  for (const r of data) {
    // Skip obviously bad coordinates (outside PNW bounding box)
    if (r.lat < 41 || r.lat > 49 || r.lng < -125 || r.lng > -116) continue;

    const key = `${r.city_slug}|${r.state}`;
    if (!cities[key]) {
      cities[key] = {
        citySlug: r.city_slug,
        cityName: r.city || titleCase(r.city_slug),
        state: r.state,
        lats: [],
        lngs: [],
      };
    }
    cities[key].lats.push(r.lat);
    cities[key].lngs.push(r.lng);
  }

  const centroids = Object.values(cities).map((c) => ({
    citySlug: c.citySlug,
    cityName: c.cityName,
    state: c.state,
    lat: parseFloat(median(c.lats).toFixed(5)),
    lng: parseFloat(median(c.lngs).toFixed(5)),
    listingCount: c.lats.length,
  }));

  // Sort by listing count descending
  centroids.sort((a, b) => b.listingCount - a.listingCount);

  console.log(`  Found ${centroids.length} cities with valid PNW coordinates`);
  console.log(
    `  Top 5: ${centroids
      .slice(0, 5)
      .map((c) => `${c.cityName} (${c.listingCount})`)
      .join(", ")}`
  );

  // Sanity check: print a few centroids
  for (const c of centroids.slice(0, 3)) {
    console.log(`  ${c.cityName}, ${c.state}: ${c.lat}, ${c.lng}`);
  }

  return centroids;
}

// ---------------------------------------------------------------------------
// Phase 2a: Overpass API (dog parks + trails)
// ---------------------------------------------------------------------------

function buildCombinedQuery(lat, lng, radius) {
  // Single query for dog parks, trails, and named parks to minimize API calls
  return `[out:json][timeout:30];
(
  node["leisure"="dog_park"](around:${radius},${lat},${lng});
  way["leisure"="dog_park"](around:${radius},${lat},${lng});
  relation["leisure"="dog_park"](around:${radius},${lat},${lng});
  node["leisure"="park"]["dog"="yes"](around:${radius},${lat},${lng});
  way["leisure"="park"]["dog"="yes"](around:${radius},${lat},${lng});
  way["highway"="path"]["name"](around:${radius},${lat},${lng});
  way["highway"="footway"]["name"](around:${radius},${lat},${lng});
  relation["route"="hiking"](around:${radius},${lat},${lng});
  way["leisure"="nature_reserve"]["name"](around:${radius},${lat},${lng});
  relation["leisure"="nature_reserve"]["name"](around:${radius},${lat},${lng});
  way["leisure"="park"]["name"](around:${radius},${lat},${lng});
  relation["leisure"="park"]["name"](around:${radius},${lat},${lng});
);
out center tags;`;
}

function parseOverpassResults(elements, type) {
  const seen = new Set();
  const results = [];

  for (const el of elements) {
    const name = el.tags?.name;
    if (!name || seen.has(name)) continue;
    seen.add(name);

    if (type === "dogPark") {
      results.push({
        name,
        description: el.tags?.description || "",
        offLeash: el.tags?.dog === "yes" || el.tags?.leisure === "dog_park",
        features: extractFeatures(el.tags),
        source: "osm",
      });
    } else {
      // Skip generic/tiny unnamed paths, only keep named trails and parks
      const isTrail =
        el.tags?.highway === "path" ||
        el.tags?.highway === "footway" ||
        el.tags?.route === "hiking";
      const isPark =
        el.tags?.leisure === "park" || el.tags?.leisure === "nature_reserve";

      if (isTrail || isPark) {
        results.push({
          name,
          type: isTrail ? "trail" : "park",
          description: el.tags?.description || "",
          source: "osm",
        });
      }
    }
  }

  return results;
}

function extractFeatures(tags) {
  if (!tags) return [];
  const features = [];
  if (tags.fenced === "yes") features.push("fully fenced");
  if (tags.surface) features.push(tags.surface);
  if (tags.lit === "yes") features.push("lit");
  if (tags.drinking_water === "yes") features.push("water fountain");
  return features;
}

async function fetchOverpassData(query, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (res.ok) {
      const json = await res.json();
      return json.elements || [];
    }

    if (res.status === 429 || res.status === 504) {
      const backoff = attempt * 5000; // 5s, 10s, 15s
      console.log(`    Rate limited (${res.status}), waiting ${backoff / 1000}s (attempt ${attempt}/${retries})...`);
      await sleep(backoff);
      continue;
    }

    const text = await res.text();
    throw new Error(`Overpass error ${res.status}: ${text.slice(0, 200)}`);
  }

  throw new Error("Overpass: max retries exceeded");
}

async function enrichWithOverpass(centroids) {
  console.log("\n=== Phase 2a: Fetching from Overpass (OpenStreetMap) ===");

  const results = {};
  let completed = 0;
  const total = centroids.length;

  for (const city of centroids) {
    const key = `${city.state}:${city.citySlug}`;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would fetch: ${city.cityName}, ${city.state} (${city.lat}, ${city.lng})`);
      results[key] = { dogParks: [], trails: [] };
      continue;
    }

    try {
      // Single combined query for dog parks + trails + parks
      const query = buildCombinedQuery(city.lat, city.lng, SEARCH_RADIUS);
      const elements = await fetchOverpassData(query);
      const dogParks = parseOverpassResults(elements, "dogPark");
      const trails = parseOverpassResults(elements, "trail");

      results[key] = {
        dogParks: dogParks.slice(0, 6),
        trails: trails.slice(0, 8),
      };

      completed++;
      if (completed % 10 === 0 || completed === total) {
        const parkTotal = Object.values(results).reduce((s, r) => s + r.dogParks.length, 0);
        console.log(`  Progress: ${completed}/${total} cities (${parkTotal} dog parks found so far)`);
      }

      await sleep(3000); // 3s between requests to stay well under rate limits
    } catch (err) {
      console.error(`  Error fetching ${city.cityName}: ${err.message}`);
      results[key] = { dogParks: [], trails: [] };
      await sleep(10000); // Long backoff on unrecoverable error
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Phase 2b: Google Places API (dog-friendly restaurants/breweries)
// ---------------------------------------------------------------------------

async function searchGooglePlaces(query, lat, lng) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not set in .env.local");

  const res = await fetch(GOOGLE_PLACES_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.types,places.rating,places.userRatingCount,places.editorialSummary",
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: SEARCH_RADIUS,
        },
      },
      maxResultCount: 5,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  return (json.places || []).map((p) => ({
    name: p.displayName?.text || "",
    description: p.editorialSummary?.text || "",
    rating: p.rating,
    reviewCount: p.userRatingCount,
    type: inferSpotType(p.types || []),
    source: "google",
  }));
}

function inferSpotType(types) {
  if (types.includes("bar") || types.includes("brewery")) return "brewery";
  if (types.includes("restaurant") || types.includes("cafe")) return "restaurant";
  if (types.includes("pet_store")) return "store";
  if (types.includes("park")) return "trail";
  return "restaurant";
}

async function enrichWithGoogle(centroids) {
  console.log("\n=== Phase 2b: Fetching from Google Places ===");

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log("  Skipping: GOOGLE_PLACES_API_KEY not set in .env.local");
    return {};
  }

  const results = {};
  let completed = 0;
  const total = centroids.length;

  for (const city of centroids) {
    const key = `${city.state}:${city.citySlug}`;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would fetch: ${city.cityName}, ${city.state}`);
      results[key] = { spots: [] };
      continue;
    }

    try {
      const query = `dog friendly restaurants breweries in ${city.cityName}, ${city.state}`;
      const spots = await searchGooglePlaces(query, city.lat, city.lng);

      results[key] = { spots: spots.slice(0, 4) };

      completed++;
      if (completed % 10 === 0 || completed === total) {
        console.log(`  Progress: ${completed}/${total} cities`);
      }

      await sleep(200); // Google rate limits are more generous
    } catch (err) {
      console.error(`  Error fetching ${city.cityName}: ${err.message}`);
      results[key] = { spots: [] };
      await sleep(1000);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Phase 3: Merge and output
// ---------------------------------------------------------------------------

function generateIntro(city, overpassData) {
  const { cityName, state, listingCount } = city;
  const stateName = state === "WA" ? "Washington" : "Oregon";
  const parkCount = overpassData?.dogParks?.length || 0;
  const trailCount = overpassData?.trails?.length || 0;

  const parts = [`Browse ${listingCount} dog groomer${listingCount !== 1 ? "s" : ""} in ${cityName}, ${stateName}.`];

  if (parkCount > 0) {
    parts.push(
      `The area features ${parkCount} dog park${parkCount !== 1 ? "s" : ""} for off-leash play.`
    );
  }

  if (trailCount > 0) {
    parts.push(
      `${cityName} also offers ${trailCount} nearby trail${trailCount !== 1 ? "s" : ""} and park${trailCount !== 1 ? "s" : ""} for leashed walks.`
    );
  }

  return parts.join(" ");
}

async function mergeAndOutput(centroids, overpassResults, googleResults) {
  console.log("\n=== Phase 3: Merging results ===");

  const output = {};

  for (const city of centroids) {
    const key = `${city.state}:${city.citySlug}`;
    const overpass = overpassResults[key] || { dogParks: [], trails: [] };
    const google = googleResults[key] || { spots: [] };

    output[key] = {
      citySlug: city.citySlug,
      cityName: city.cityName,
      state: city.state,
      lat: city.lat,
      lng: city.lng,
      listingCount: city.listingCount,
      intro: generateIntro(city, overpass),
      dogParks: overpass.dogParks,
      trails: overpass.trails,
      dogFriendlySpots: google.spots,
      enrichedAt: new Date().toISOString(),
    };
  }

  // Stats
  const withParks = Object.values(output).filter((c) => c.dogParks.length > 0).length;
  const withTrails = Object.values(output).filter((c) => c.trails.length > 0).length;
  const withSpots = Object.values(output).filter((c) => c.dogFriendlySpots.length > 0).length;

  console.log(`  Cities with dog parks: ${withParks}/${centroids.length}`);
  console.log(`  Cities with trails/parks: ${withTrails}/${centroids.length}`);
  console.log(`  Cities with dog-friendly spots: ${withSpots}/${centroids.length}`);

  // Ensure data directory exists
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n  Output written to: ${OUTPUT_FILE}`);
  console.log(`  Total entries: ${Object.keys(output).length}`);

  return output;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("City Enrichment Pipeline");
  console.log("========================");
  if (DRY_RUN) console.log("** DRY RUN MODE - no API calls will be made **");
  if (WITH_GOOGLE) console.log("** Google Places enabled **");

  try {
    const centroids = await computeCentroids();
    const overpassResults = await enrichWithOverpass(centroids);
    const googleResults = WITH_GOOGLE ? await enrichWithGoogle(centroids) : {};
    await mergeAndOutput(centroids, overpassResults, googleResults);

    console.log("\nDone!");
  } catch (err) {
    console.error("\nFatal error:", err.message);
    process.exit(1);
  }
}

main();
