#!/usr/bin/env node

/**
 * Google Places API — Discover New Groomers
 *
 * Searches Google Places for pet groomers across WA (and optionally OR) cities,
 * deduplicates against existing Supabase listings, and inserts new ones.
 *
 * Usage:
 *   node scripts/discover-groomers.js                    # discover WA groomers
 *   node scripts/discover-groomers.js --state OR         # discover OR groomers
 *   node scripts/discover-groomers.js --dry-run          # preview without inserting
 *   node scripts/discover-groomers.js --limit 5          # only search first 5 cities
 *   node scripts/discover-groomers.js --city "Spokane"   # search one city only
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const LOG_FILE = path.join(__dirname, "..", "data", "discover-groomers.log");
const DELAY_MS = 600;

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
const env = {};
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t[0] === "#") continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}

const API_KEY = env.GOOGLE_PLACES_API_KEY;
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) { console.error("Missing GOOGLE_PLACES_API_KEY in .env.local"); process.exit(1); }
if (!SB_URL || !SB_ANON_KEY) { console.error("Missing Supabase credentials in .env.local"); process.exit(1); }

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let dryRun = false, limitCities = Infinity, filterState = "WA", filterCity = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dry-run") dryRun = true;
  else if (args[i] === "--state" && args[i + 1]) { filterState = args[i + 1].toUpperCase(); i++; }
  else if (args[i] === "--limit" && args[i + 1]) { limitCities = parseInt(args[i + 1], 10); i++; }
  else if (args[i] === "--city" && args[i + 1]) { filterCity = args[i + 1]; i++; }
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
function httpReq(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------
async function supabaseGet(query) {
  const url = new URL(`/rest/v1/business_listings${query}`, SB_URL);
  const res = await httpReq({
    hostname: url.hostname, port: 443, path: url.pathname + url.search, method: "GET",
    headers: { apikey: SB_ANON_KEY, Authorization: `Bearer ${SB_ANON_KEY}` },
  });
  if (res.status !== 200) throw new Error(`Supabase GET ${res.status}: ${res.body.slice(0, 200)}`);
  return JSON.parse(res.body);
}

async function supabasePost(record) {
  // Inserts require service role key to bypass RLS
  const key = SB_SERVICE_KEY || SB_ANON_KEY;
  const url = new URL("/rest/v1/business_listings", SB_URL);
  const body = JSON.stringify(record);
  const res = await httpReq({
    hostname: url.hostname, port: 443, path: url.pathname + url.search, method: "POST",
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
      "Content-Length": String(Buffer.byteLength(body)),
    },
  }, body);
  if (res.status > 299) throw new Error(`Supabase POST ${res.status}: ${res.body.slice(0, 300)}`);
}

// ---------------------------------------------------------------------------
// Google Places API (New) — Text Search
// ---------------------------------------------------------------------------
const FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress",
  "places.nationalPhoneNumber", "places.internationalPhoneNumber",
  "places.websiteUri", "places.rating", "places.userRatingCount",
  "places.priceLevel", "places.regularOpeningHours", "places.location",
  "places.businessStatus", "places.googleMapsUri", "places.types",
].join(",");

async function searchPlaces(query, retries = 3) {
  const body = JSON.stringify({
    textQuery: query,
    maxResultCount: 20,
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await httpReq({
      hostname: "places.googleapis.com",
      path: "/v1/places:searchText",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": FIELD_MASK,
        "Content-Length": String(Buffer.byteLength(body)),
      },
    }, body);

    if (res.status === 200 && res.body.length > 0) {
      const json = JSON.parse(res.body);
      return json.places || [];
    }

    if ((res.status === 429 || res.body.length === 0) && attempt < retries) {
      const delay = 2000 * Math.pow(2, attempt);
      process.stdout.write(` [retry ${attempt + 1} in ${delay / 1000}s]`);
      await sleep(delay);
      continue;
    }

    if (res.status !== 200) {
      throw new Error(`Google API ${res.status}: ${res.body.slice(0, 200)}`);
    }

    return [];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Parse Google place → Supabase record
// ---------------------------------------------------------------------------
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseHours(weekdayDescriptions) {
  const hours = [];
  for (const line of weekdayDescriptions) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (!m) continue;
    const day = m[1], timeStr = m[2].trim();
    if (timeStr.toLowerCase() === "closed") {
      hours.push({ day, open: "", close: "", closed: true });
    } else if (timeStr.toLowerCase().includes("24 hours")) {
      hours.push({ day, open: "12:00 AM", close: "11:59 PM", closed: false });
    } else {
      const tm = timeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[–\-—]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
      if (tm) hours.push({ day, open: tm[1].trim(), close: tm[2].trim(), closed: false });
    }
  }
  return hours;
}

function extractCity(formattedAddress, fallbackCity) {
  // "123 Main St, Seattle, WA 98101, USA"
  const parts = formattedAddress.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    return parts[parts.length - 3]; // city is typically 3rd from end
  }
  return fallbackCity;
}

function extractZip(formattedAddress) {
  // Match 5-digit zip after state abbreviation, e.g. "WA 98101"
  const m = formattedAddress.match(/\b(?:WA|OR)\s+(\d{5})\b/);
  return m ? m[1] : "";
}

function extractState(formattedAddress) {
  const m = formattedAddress.match(/\b(WA|OR|Washington|Oregon)\b/i);
  if (!m) return null;
  const s = m[1].toUpperCase();
  if (s === "WASHINGTON") return "WA";
  if (s === "OREGON") return "OR";
  return s;
}

function isGroomingBusiness(place) {
  const types = place.types || [];
  const name = (place.displayName?.text || "").toLowerCase();
  const groomingKeywords = ["groom", "pet spa", "dog wash", "pet salon", "doggy", "pawz", "paws", "fur ", "furry"];

  // Filter out clearly non-grooming businesses
  const excludeKeywords = ["veterinar", "vet clinic", "animal hospital", "pet store", "pet supply", "kennel only", "boarding only"];
  for (const ex of excludeKeywords) {
    if (name.includes(ex)) return false;
  }

  // Check types
  if (types.includes("pet_store") && !name.match(/groom|salon|spa/)) return false;

  // Accept if name or types suggest grooming
  for (const kw of groomingKeywords) {
    if (name.includes(kw)) return true;
  }

  // Accept if the types list grooming-related categories
  if (types.includes("pet_grooming") || types.includes("pet_care")) return true;

  // If it came from our grooming search, give it the benefit of the doubt
  return true;
}

function buildRecord(place, searchCity, searchState) {
  const name = place.displayName?.text || "Unknown";
  const city = extractCity(place.formattedAddress || "", searchCity);
  const state = extractState(place.formattedAddress || "") || searchState;
  const citySlug = slugify(city);
  const slug = slugify(name) + "-" + citySlug;

  const record = {
    id: crypto.randomUUID(),
    slug,
    name,
    description: `Professional pet grooming services in ${city}, ${state}.`,
    short_description: `Pet grooming in ${city}, ${state}`,
    address: place.formattedAddress || "",
    city,
    city_slug: citySlug,
    state,
    zip: extractZip(place.formattedAddress || ""),
    phone: place.nationalPhoneNumber || "",
    website: place.websiteUri || "",
    email: null,
    rating: place.rating || 0,
    review_count: place.userRatingCount || 0,
    price_range: "",
    price_min: 0,
    price_max: 0,
    transparent_pricing: false,
    grooms_cats: false,
    accepts_new_clients: false,
    waitlist_status: null,
    services: ["full groom"],
    service_categories: [],
    pet_types: ["dogs"],
    hours: [],
    images: [],
    badges: [],
    is_featured: false,
    is_paw_verified: false,
    is_best_in_show: false,
    year_established: null,
    team_size: null,
    specialties: [],
    breeds: [],
    lat: place.location?.latitude || 0,
    lng: place.location?.longitude || 0,
    booking_url: null,
  };

  // Price level
  const priceMap = {
    PRICE_LEVEL_FREE: "$", PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$",
  };
  if (place.priceLevel && priceMap[place.priceLevel]) {
    record.price_range = priceMap[place.priceLevel];
  }

  // Hours
  if (place.regularOpeningHours?.weekdayDescriptions) {
    const hours = parseHours(place.regularOpeningHours.weekdayDescriptions);
    if (hours.length > 0) record.hours = hours;
  }

  // Detect cat grooming from name
  const nameLower = name.toLowerCase();
  if (nameLower.includes("cat") || nameLower.includes("feline") || nameLower.includes("kitty")) {
    record.grooms_cats = true;
    record.pet_types = ["dogs", "cats"];
    record.services.push("cat grooming");
  }

  // Detect mobile grooming
  if (nameLower.includes("mobile")) {
    record.service_categories = ["dog-grooming", "mobile-grooming"];
    record.services.push("mobile grooming");
  }

  return record;
}

// ---------------------------------------------------------------------------
// WA cities to search (comprehensive list)
// ---------------------------------------------------------------------------
const WA_CITIES = [
  "Aberdeen", "Airway Heights", "Anacortes", "Arlington", "Auburn",
  "Bainbridge Island", "Battle Ground", "Bellevue", "Bellingham", "Benton City",
  "Birch Bay", "Black Diamond", "Blaine", "Bonney Lake", "Bothell",
  "Bremerton", "Brier", "Brush Prairie", "Buckley", "Burien",
  "Burlington", "Camas", "Carnation", "Centralia", "Chehalis",
  "Chelan", "Cheney", "Clarkston", "Cle Elum", "Colfax",
  "College Place", "Colville", "Connell", "Covington", "Dayton",
  "Des Moines", "DuPont", "Duvall", "East Wenatchee", "Eatonville",
  "Edgewood", "Edmonds", "Ellensburg", "Elma", "Enumclaw",
  "Ephrata", "Everett", "Fall City", "Federal Way", "Ferndale",
  "Fife", "Fircrest", "Fox Island", "Gig Harbor", "Gold Bar",
  "Goldendale", "Graham", "Grandview", "Granite Falls", "Grays Harbor",
  "Issaquah", "Kalama", "Kelso", "Kenmore", "Kennewick",
  "Kent", "Kettle Falls", "Kirkland", "Kitsap", "La Center",
  "Lacey", "Lake Forest Park", "Lake Stevens", "Lakewood", "Langley",
  "Liberty Lake", "Long Beach", "Longview", "Lynden", "Lynnwood",
  "Maple Valley", "Marysville", "Mattawa", "McCleary", "Mercer Island",
  "Mill Creek", "Milton", "Monroe", "Moses Lake", "Mount Vernon",
  "Mountlake Terrace", "Mukilteo", "Newcastle", "Newport", "Nine Mile Falls",
  "Normandy Park", "North Bend", "Oak Harbor", "Olympia", "Omak",
  "Orting", "Othello", "Pacific", "Pasco", "Port Angeles",
  "Port Orchard", "Port Townsend", "Poulsbo", "Prosser", "Pullman",
  "Puyallup", "Quincy", "Rainier", "Raymond", "Redmond",
  "Renton", "Republic", "Richland", "Ridgefield", "Rochester",
  "Roy", "Sammamish", "SeaTac", "Seattle", "Sedro-Woolley",
  "Sequim", "Shelton", "Shoreline", "Silverdale", "Snohomish",
  "Snoqualmie", "South Hill", "South Prairie", "Spanaway", "Spokane",
  "Spokane Valley", "Stanwood", "Steilacoom", "Sultan", "Sumner",
  "Sunnyside", "Tacoma", "Toppenish", "Tukwila", "Tumwater",
  "Union Gap", "University Place", "Vancouver", "Vashon", "Walla Walla",
  "Washougal", "Wenatchee", "West Richland", "Westport", "White Center",
  "White Salmon", "Woodinville", "Woodland", "Yakima", "Yelm",
];

const OR_CITIES = [
  "Albany", "Aloha", "Ashland", "Astoria", "Baker City",
  "Beaverton", "Bend", "Canby", "Central Point", "Clackamas",
  "Coos Bay", "Corvallis", "Cottage Grove", "Dallas", "Eugene",
  "Florence", "Forest Grove", "Gladstone", "Grants Pass", "Gresham",
  "Happy Valley", "Hermiston", "Hillsboro", "Hood River", "Independence",
  "Keizer", "Klamath Falls", "La Grande", "Lake Oswego", "Lebanon",
  "Lincoln City", "McMinnville", "Medford", "Milwaukie", "Molalla",
  "Monmouth", "Newberg", "Newport", "North Bend", "Ontario",
  "Oregon City", "Pendleton", "Portland", "Prineville", "Redmond",
  "Roseburg", "Salem", "Sandy", "Seaside", "Sherwood",
  "Silverton", "Springfield", "St. Helens", "Stayton", "Sublimity",
  "Sunset", "Sweet Home", "The Dalles", "Tigard", "Tillamook",
  "Troutdale", "Tualatin", "Vernonia", "West Linn", "Wilsonville",
  "Woodburn",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Groomer Discovery Script ===");
  console.log("Date:", new Date().toISOString());
  console.log("State:", filterState);
  if (dryRun) console.log("** DRY RUN **");
  if (filterCity) console.log("** City filter:", filterCity, "**");
  console.log();

  // Step 1: Load all existing listings to deduplicate
  console.log("Loading existing listings...");
  const existing = await supabaseGet("?select=id,name,slug,city,state,lat,lng&order=name");
  console.log(`Found ${existing.length} existing listings\n`);

  // Build lookup sets for deduplication
  const existingNames = new Set();
  const existingCoords = new Set();
  for (const l of existing) {
    // Normalize name for comparison
    existingNames.add(normalizeName(l.name) + "|" + l.city.toLowerCase());
    existingNames.add(normalizeName(l.name) + "|" + l.state.toLowerCase());
    if (l.lat && l.lng) {
      // Round to ~10m precision for matching
      existingCoords.add(`${Math.round(l.lat * 1000)},${Math.round(l.lng * 1000)}`);
    }
  }

  const cities = filterCity
    ? [filterCity]
    : (filterState === "OR" ? OR_CITIES : WA_CITIES).slice(0, limitCities);

  console.log(`Searching ${cities.length} cities...\n`);

  const stats = { searched: 0, found: 0, newListings: 0, duplicates: 0, skipped: 0, errors: 0, closed: 0 };
  const log = [`=== Discovery Run: ${new Date().toISOString()} | State: ${filterState} ===`];
  const newListings = [];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const tag = `[${i + 1}/${cities.length}] ${city}, ${filterState}`;

    try {
      stats.searched++;
      const query = `pet grooming in ${city}, ${filterState}`;
      process.stdout.write(`${tag}: searching...`);

      const places = await searchPlaces(query);
      await sleep(DELAY_MS);

      if (places.length === 0) {
        process.stdout.write(` 0 results\n`);
        continue;
      }

      let cityNew = 0, cityDup = 0, citySkipped = 0;

      for (const place of places) {
        // Skip permanently closed
        if (place.businessStatus === "CLOSED_PERMANENTLY") {
          stats.closed++;
          continue;
        }

        // Skip non-grooming businesses
        if (!isGroomingBusiness(place)) {
          stats.skipped++;
          citySkipped++;
          continue;
        }

        // Check state — skip if outside our target states
        const placeState = extractState(place.formattedAddress || "");
        if (placeState && placeState !== "WA" && placeState !== "OR") {
          stats.skipped++;
          citySkipped++;
          continue;
        }

        const name = place.displayName?.text || "";
        const placeCity = extractCity(place.formattedAddress || "", city);

        // Deduplicate by name+city
        const nameKey = normalizeName(name) + "|" + placeCity.toLowerCase();
        const nameKeyState = normalizeName(name) + "|" + (placeState || filterState).toLowerCase();
        if (existingNames.has(nameKey) || existingNames.has(nameKeyState)) {
          stats.duplicates++;
          cityDup++;
          continue;
        }

        // Deduplicate by coordinates
        if (place.location) {
          const coordKey = `${Math.round(place.location.latitude * 1000)},${Math.round(place.location.longitude * 1000)}`;
          if (existingCoords.has(coordKey)) {
            stats.duplicates++;
            cityDup++;
            continue;
          }
          existingCoords.add(coordKey);
        }

        // New listing!
        existingNames.add(nameKey);
        existingNames.add(nameKeyState);

        const record = buildRecord(place, city, placeState || filterState);
        newListings.push(record);
        stats.newListings++;
        cityNew++;

        log.push(`NEW: ${name} — ${placeCity}, ${placeState || filterState} (rating: ${place.rating || "n/a"})`);
      }

      stats.found += places.length;
      process.stdout.write(` ${places.length} results → ${cityNew} new, ${cityDup} dup, ${citySkipped} skip\n`);

    } catch (err) {
      process.stdout.write(` ERROR: ${err.message.slice(0, 120)}\n`);
      log.push(`ERROR: ${city} — ${err.message.slice(0, 200)}`);
      stats.errors++;
    }
  }

  // Step 2: Try inserting via API, fall back to generating SQL
  if (newListings.length === 0) {
    console.log("\nNo new listings found.");
  } else if (dryRun) {
    console.log(`\n--- ${newListings.length} new listings found (dry run) ---\n`);
    for (const r of newListings) {
      console.log(`  ${r.name} (${r.city}, ${r.state}) — rating: ${r.rating}, reviews: ${r.review_count}`);
    }
  } else {
    // Try first insert to see if service key works
    let useApi = false;
    try {
      await supabasePost(newListings[0]);
      useApi = true;
      console.log(`\n--- Inserting ${newListings.length} new listings via API ---\n`);
      console.log(`  [1/${newListings.length}] ${newListings[0].name} (${newListings[0].city}, ${newListings[0].state})`);
    } catch {
      useApi = false;
      console.log("\nAPI insert blocked by RLS — generating SQL file instead...");
    }

    let inserted = 0, insertErrors = 0;

    if (useApi) {
      inserted = 1; // first one succeeded
      for (let i = 1; i < newListings.length; i++) {
        const r = newListings[i];
        try {
          await supabasePost(r);
          await sleep(100);
          inserted++;
          process.stdout.write(`  [${i + 1}/${newListings.length}] ${r.name} (${r.city}, ${r.state})\n`);
        } catch (err) {
          insertErrors++;
          process.stdout.write(`  [${i + 1}/${newListings.length}] ${r.name} — ERROR: ${err.message.slice(0, 120)}\n`);
        }
      }
    } else {
      // Generate SQL file
      const sqlFile = path.join(__dirname, "..", "data", `discovered_${filterState.toLowerCase()}_${Date.now()}.sql`);
      const sqlLines = [];
      sqlLines.push(`-- Discovered ${newListings.length} new groomers in ${filterState}`);
      sqlLines.push(`-- Generated: ${new Date().toISOString()}\n`);

      for (const r of newListings) {
        const esc = (s) => s.replace(/'/g, "''");
        const arr = (a) => a.length === 0 ? "ARRAY[]::text[]" : `ARRAY[${a.map((v) => `'${esc(v)}'`).join(",")}]::text[]`;
        const hours = r.hours.length === 0 ? "ARRAY[]::jsonb[]" : `ARRAY[${r.hours.map((h) => `'${JSON.stringify(h)}'::jsonb`).join(",")}]::jsonb[]`;

        sqlLines.push(`INSERT INTO business_listings (id, slug, name, description, short_description, address, city, city_slug, state, zip, phone, website, email, rating, review_count, price_range, price_min, price_max, transparent_pricing, grooms_cats, accepts_new_clients, waitlist_status, services, service_categories, pet_types, hours, images, badges, is_featured, is_paw_verified, is_best_in_show, year_established, team_size, specialties, breeds, lat, lng, booking_url)`);
        sqlLines.push(`VALUES ('${esc(r.id)}', '${esc(r.slug)}', '${esc(r.name)}', '${esc(r.description)}', '${esc(r.short_description)}', '${esc(r.address)}', '${esc(r.city)}', '${esc(r.city_slug)}', '${esc(r.state)}', '${esc(r.zip)}', '${esc(r.phone)}', '${esc(r.website)}', ${r.email ? `'${esc(r.email)}'` : "NULL"}, ${r.rating}, ${r.review_count}, '${esc(r.price_range)}', ${r.price_min}, ${r.price_max}, ${r.transparent_pricing}, ${r.grooms_cats}, ${r.accepts_new_clients}, ${r.waitlist_status ? `'${r.waitlist_status}'` : "NULL"}, ${arr(r.services)}, ${arr(r.service_categories)}, ${arr(r.pet_types)}, ${hours}, ${arr(r.images)}, ${arr(r.badges)}, ${r.is_featured}, ${r.is_paw_verified}, ${r.is_best_in_show}, ${r.year_established || "NULL"}, ${r.team_size || "NULL"}, ${arr(r.specialties)}, ${arr(r.breeds)}, ${r.lat}, ${r.lng}, ${r.booking_url ? `'${esc(r.booking_url)}'` : "NULL"});\n`);
      }

      fs.writeFileSync(sqlFile, sqlLines.join("\n"), "utf-8");
      console.log(`\nSQL file generated: ${sqlFile}`);
      console.log(`Run this in the Supabase SQL Editor to insert ${newListings.length} listings.`);
      inserted = newListings.length;
    }

    stats.inserted = inserted;
    stats.insertErrors = insertErrors;
  }

  // Summary
  log.push("", `Cities searched: ${stats.searched}`, `Google results: ${stats.found}`,
    `New listings: ${stats.newListings}`, `Duplicates skipped: ${stats.duplicates}`,
    `Non-grooming skipped: ${stats.skipped}`, `Closed: ${stats.closed}`,
    `API errors: ${stats.errors}`, "");

  fs.appendFileSync(LOG_FILE, log.join("\n") + "\n", "utf-8");

  console.log("\n=== Done ===");
  console.log(`Cities searched: ${stats.searched}`);
  console.log(`Google results: ${stats.found}`);
  console.log(`New listings: ${stats.newListings} | Duplicates: ${stats.duplicates} | Skipped: ${stats.skipped} | Closed: ${stats.closed}`);
  console.log(`Log: ${LOG_FILE}`);
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/&/g, "and")
    .replace(/\b(llc|inc|corp|ltd|the|pet|grooming|salon|spa|studio)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
