#!/usr/bin/env node

/**
 * Find Permanently Closed Dog Groomers in WA & OR
 *
 * Two modes:
 *   1. --check-existing: Check all current Supabase listings for closed status
 *   2. --search-names:   Look up specific business names via Google Places
 *   3. default:          Search city-by-city (limited - Google filters closed from results)
 *
 * Usage:
 *   node scripts/find-closed-groomers.js --check-existing          # check our DB listings
 *   node scripts/find-closed-groomers.js --check-existing --limit 50
 *   node scripts/find-closed-groomers.js --search-names            # look up known names
 *   node scripts/find-closed-groomers.js --state WA --limit 10     # city search (limited)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_DIR = path.join(__dirname, "..", "data");
const DELAY_MS = 500;

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
const SB_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!API_KEY) { console.error("Missing GOOGLE_PLACES_API_KEY in .env.local"); process.exit(1); }

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let limitItems = Infinity, filterState = "ALL", filterCity = null;
let checkExisting = false, searchNames = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--check-existing") checkExisting = true;
  else if (args[i] === "--search-names") searchNames = true;
  else if (args[i] === "--state" && args[i + 1]) { filterState = args[i + 1].toUpperCase(); i++; }
  else if (args[i] === "--limit" && args[i + 1]) { limitItems = parseInt(args[i + 1], 10); i++; }
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
// Supabase helper (read only)
// ---------------------------------------------------------------------------
async function supabaseGet(query) {
  if (!SB_URL || !SB_KEY) throw new Error("Missing Supabase credentials");
  const url = new URL(`/rest/v1/business_listings${query}`, SB_URL);
  const res = await httpReq({
    hostname: url.hostname, port: 443, path: url.pathname + url.search, method: "GET",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (res.status !== 200) throw new Error(`Supabase GET ${res.status}: ${res.body.slice(0, 200)}`);
  return JSON.parse(res.body);
}

// ---------------------------------------------------------------------------
// Google Places API (New) - Text Search (single result for name lookups)
// ---------------------------------------------------------------------------
const FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress",
  "places.nationalPhoneNumber", "places.websiteUri",
  "places.rating", "places.userRatingCount",
  "places.location", "places.businessStatus", "places.googleMapsUri",
].join(",");

async function searchPlace(query, maxResults = 1, retries = 3) {
  const body = JSON.stringify({
    textQuery: query,
    maxResultCount: maxResults,
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
// Known closed groomer names to search (from Exa/web research)
// Add more names here as you find them
// ---------------------------------------------------------------------------
const KNOWN_CLOSED_NAMES = [
  // Washington
  { name: "Fur Fighters Grooming", city: "Seattle", state: "WA" },
  { name: "Dawnalene's Pet Salon", city: "Seattle", state: "WA" },
  { name: "Grooming by Kristi", city: "Seattle", state: "WA" },
  { name: "Pet Station", city: "Bellevue", state: "WA" },
  { name: "Kent Grooming", city: "Kent", state: "WA" },
  { name: "Sniffy's Dog Salon", city: "Puyallup", state: "WA" },
  { name: "Gone To The Dogs", city: "Bonney Lake", state: "WA" },
  { name: "Touch Up Pup", city: "Snohomish", state: "WA" },
  { name: "Joy's Clip N Dip Grooming", city: "Everett", state: "WA" },
  { name: "Excel Grooming Salon", city: "Spokane", state: "WA" },
  { name: "Excel Grooming", city: "Spokane", state: "WA" },
  { name: "Mary's All Breed Grooming", city: "Chehalis", state: "WA" },
  { name: "The Groomery", city: "Port Orchard", state: "WA" },
  { name: "Dog Gone Clean Salon", city: "Tekoa", state: "WA" },
  { name: "Anacortes Pet Grooming Salon", city: "Anacortes", state: "WA" },
  { name: "Clean and Clip Grooming", city: "Washington", state: "WA" },
  { name: "Barber Bark Pet Grooming", city: "Seattle", state: "WA" },
  // Oregon
  { name: "Soapy Paws", city: "Salem", state: "OR" },
  { name: "Zimmer's Grooming Salon", city: "Portland", state: "OR" },
  { name: "BarkZone", city: "Hillsboro", state: "OR" },
  { name: "D'tails Dog Salon", city: "Portland", state: "OR" },
  { name: "Pupdo's", city: "Portland", state: "OR" },
  { name: "Virginia Woof Dog Daycare", city: "Portland", state: "OR" },
  { name: "Ruff House", city: "Portland", state: "OR" },
  { name: "Beach Dogs Professional Grooming", city: "Brookings", state: "OR" },
  { name: "U-Wash Pets & Grooming", city: "Bend", state: "OR" },
  { name: "Waggin' Wheels Mobile Dog Grooming", city: "Eugene", state: "OR" },
  { name: "Sarah's Mobile Grooming", city: "Beaverton", state: "OR" },
  { name: "Harlow & Friends", city: "Hillsboro", state: "OR" },
  { name: "Groomer Support Service", city: "White City", state: "OR" },
  { name: "Riley's Primped Out Pups", city: "Dayton", state: "OR" },
  { name: "D & J Dog Grooming", city: "Keizer", state: "OR" },
];

// ---------------------------------------------------------------------------
// Report generators
// ---------------------------------------------------------------------------
function generateReports(closedBusinesses, mode) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const suffix = mode === "check" ? "db-check" : mode === "names" ? "name-search" : "city-search";

  // JSON
  const jsonFile = path.join(DATA_DIR, `closed-groomers-${suffix}-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(closedBusinesses, null, 2), "utf-8");

  // Markdown
  const mdFile = path.join(DATA_DIR, `closed-groomers-${suffix}-${timestamp}.md`);
  const mdLines = [
    `# Closed Dog Groomers - ${mode === "check" ? "Database Check" : mode === "names" ? "Name Search" : "City Search"}`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Total closed found: ${closedBusinesses.length}`,
    ``,
  ];

  // Group by state
  const byState = {};
  for (const biz of closedBusinesses) {
    const st = biz.state || "Unknown";
    if (!byState[st]) byState[st] = [];
    byState[st].push(biz);
  }

  for (const [state, businesses] of Object.entries(byState).sort()) {
    mdLines.push(`## ${state} (${businesses.length} closed)`);
    mdLines.push(``);
    mdLines.push(`| Business Name | City | Rating | Reviews | Website | Phone | Status |`);
    mdLines.push(`|---|---|---|---|---|---|---|`);

    businesses.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));

    for (const biz of businesses) {
      const website = biz.website ? `[link](${biz.website})` : "-";
      mdLines.push(`| ${biz.name} | ${biz.city || "-"} | ${biz.rating || "-"} | ${biz.reviewCount || 0} | ${website} | ${biz.phone || "-"} | ${biz.status} |`);
    }
    mdLines.push(``);
  }

  // Domain targets
  const withWebsites = closedBusinesses.filter((b) => b.website);
  if (withWebsites.length > 0) {
    mdLines.push(`## Domain Acquisition Targets`);
    mdLines.push(``);
    for (const biz of withWebsites) {
      mdLines.push(`- **${biz.name}** (${biz.city}, ${biz.state}): ${biz.website}`);
    }
    mdLines.push(``);
  }

  fs.writeFileSync(mdFile, mdLines.join("\n"), "utf-8");

  // CSV
  const csvFile = path.join(DATA_DIR, `closed-groomers-${suffix}-${timestamp}.csv`);
  const csvLines = ["name,city,state,rating,reviews,website,phone,address,status,google_maps_url"];
  for (const biz of closedBusinesses) {
    const esc = (s) => `"${(s || "").replace(/"/g, '""')}"`;
    csvLines.push([
      esc(biz.name), esc(biz.city), esc(biz.state),
      biz.rating || 0, biz.reviewCount || 0,
      esc(biz.website), esc(biz.phone), esc(biz.address),
      esc(biz.status), esc(biz.googleMapsUrl),
    ].join(","));
  }
  fs.writeFileSync(csvFile, csvLines.join("\n"), "utf-8");

  return { jsonFile, mdFile, csvFile };
}

// ===========================================================================
// MODE 1: Check existing Supabase listings for closed status
// ===========================================================================
async function runCheckExisting() {
  console.log("=== Checking Existing Listings for Closed Status ===\n");

  if (!SB_URL || !SB_KEY) {
    console.error("Missing Supabase credentials for --check-existing mode");
    process.exit(1);
  }

  let query = "?select=id,slug,name,city,state,phone,website,address,rating,review_count&order=name";
  if (filterState !== "ALL") query += `&state=eq.${filterState}`;
  if (filterCity) query += `&city=ilike.%25${encodeURIComponent(filterCity)}%25`;

  const listings = await supabaseGet(query);
  console.log(`Loaded ${listings.length} listings from Supabase`);

  const batch = listings.slice(0, limitItems);
  console.log(`Checking ${batch.length} listings...\n`);

  const closedBusinesses = [];
  const notFound = [];
  let checked = 0, errors = 0;

  for (let i = 0; i < batch.length; i++) {
    const l = batch[i];
    const tag = `[${i + 1}/${batch.length}] ${l.name} (${l.city}, ${l.state})`;

    try {
      checked++;
      const query = `${l.name} ${l.city} ${l.state} pet grooming`;
      const places = await searchPlace(query, 1);
      await sleep(DELAY_MS);

      if (places.length === 0) {
        process.stdout.write(`${tag} -> NOT FOUND\n`);
        notFound.push(l);
        continue;
      }

      const place = places[0];
      const status = place.businessStatus || "UNKNOWN";

      if (status === "CLOSED_PERMANENTLY") {
        process.stdout.write(`${tag} -> PERMANENTLY CLOSED\n`);
        closedBusinesses.push({
          name: l.name,
          city: l.city,
          state: l.state,
          address: place.formattedAddress || l.address,
          phone: place.nationalPhoneNumber || l.phone,
          website: place.websiteUri || l.website,
          rating: place.rating || l.rating,
          reviewCount: place.userRatingCount || l.review_count,
          googleMapsUrl: place.googleMapsUri || "",
          status: "CLOSED_PERMANENTLY",
          supabaseId: l.id,
          supabaseSlug: l.slug,
          source: "existing_listing",
        });
      } else if (status === "CLOSED_TEMPORARILY") {
        process.stdout.write(`${tag} -> temporarily closed\n`);
        closedBusinesses.push({
          name: l.name,
          city: l.city,
          state: l.state,
          address: place.formattedAddress || l.address,
          phone: place.nationalPhoneNumber || l.phone,
          website: place.websiteUri || l.website,
          rating: place.rating || l.rating,
          reviewCount: place.userRatingCount || l.review_count,
          googleMapsUrl: place.googleMapsUri || "",
          status: "CLOSED_TEMPORARILY",
          supabaseId: l.id,
          supabaseSlug: l.slug,
          source: "existing_listing",
        });
      } else {
        const matched = place.displayName?.text || "?";
        process.stdout.write(`${tag} -> active ("${matched}")\n`);
      }
    } catch (err) {
      process.stdout.write(`${tag} -> ERROR: ${err.message.slice(0, 100)}\n`);
      errors++;
    }
  }

  const files = generateReports(closedBusinesses, "check");

  console.log("\n=== Results ===");
  console.log(`Checked: ${checked}`);
  console.log(`Closed permanently: ${closedBusinesses.filter((b) => b.status === "CLOSED_PERMANENTLY").length}`);
  console.log(`Closed temporarily: ${closedBusinesses.filter((b) => b.status === "CLOSED_TEMPORARILY").length}`);
  console.log(`Not found on Google: ${notFound.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nReports: ${files.mdFile}`);

  if (notFound.length > 0) {
    console.log(`\n=== Not Found on Google (may have closed/moved) ===`);
    for (const l of notFound.slice(0, 20)) {
      console.log(`  ${l.name} (${l.city}, ${l.state})`);
    }
    if (notFound.length > 20) console.log(`  ... and ${notFound.length - 20} more`);
  }

  if (closedBusinesses.length > 0) {
    console.log(`\n=== Closed Listings to Remove/Flag ===`);
    for (const b of closedBusinesses) {
      console.log(`  ${b.name} (${b.city}, ${b.state}) - ${b.status}`);
    }
  }
}

// ===========================================================================
// MODE 2: Search known closed business names
// ===========================================================================
async function runSearchNames() {
  console.log("=== Searching Known Closed Business Names ===\n");

  const names = KNOWN_CLOSED_NAMES.slice(0, limitItems);
  console.log(`Looking up ${names.length} known closed businesses...\n`);

  const closedBusinesses = [];
  const confirmed = [];
  const stillOpen = [];
  let checked = 0, errors = 0;

  for (let i = 0; i < names.length; i++) {
    const n = names[i];
    const tag = `[${i + 1}/${names.length}] ${n.name} (${n.city}, ${n.state})`;

    try {
      checked++;
      const query = `${n.name} ${n.city} ${n.state} pet grooming`;
      const places = await searchPlace(query, 3);
      await sleep(DELAY_MS);

      if (places.length === 0) {
        process.stdout.write(`${tag} -> NOT FOUND (likely closed/removed)\n`);
        closedBusinesses.push({
          name: n.name,
          city: n.city,
          state: n.state,
          address: "",
          phone: "",
          website: "",
          rating: 0,
          reviewCount: 0,
          googleMapsUrl: "",
          status: "NOT_FOUND",
          source: "name_search",
        });
        continue;
      }

      // Check all returned results for a match
      let found = false;
      for (const place of places) {
        const matchName = (place.displayName?.text || "").toLowerCase();
        const searchName = n.name.toLowerCase();

        // Fuzzy match - check if names overlap significantly
        const nameWords = searchName.split(/\s+/).filter((w) => w.length > 2);
        const matchWords = nameWords.filter((w) => matchName.includes(w));
        const isMatch = matchWords.length >= Math.ceil(nameWords.length * 0.5);

        if (!isMatch) continue;
        found = true;

        const status = place.businessStatus || "OPERATIONAL";

        const biz = {
          name: place.displayName?.text || n.name,
          city: n.city,
          state: n.state,
          address: place.formattedAddress || "",
          phone: place.nationalPhoneNumber || "",
          website: place.websiteUri || "",
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          googleMapsUrl: place.googleMapsUri || "",
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
          status: status,
          source: "name_search",
        };

        if (status === "CLOSED_PERMANENTLY" || status === "CLOSED_TEMPORARILY") {
          process.stdout.write(`${tag} -> CONFIRMED ${status}\n`);
          closedBusinesses.push(biz);
          confirmed.push(biz);
        } else {
          process.stdout.write(`${tag} -> STILL OPEN ("${place.displayName?.text}", status: ${status})\n`);
          stillOpen.push(biz);
        }
        break;
      }

      if (!found) {
        process.stdout.write(`${tag} -> no matching result (likely closed)\n`);
        closedBusinesses.push({
          name: n.name,
          city: n.city,
          state: n.state,
          address: "",
          phone: "",
          website: "",
          rating: 0,
          reviewCount: 0,
          googleMapsUrl: "",
          status: "NOT_FOUND",
          source: "name_search",
        });
      }
    } catch (err) {
      process.stdout.write(`${tag} -> ERROR: ${err.message.slice(0, 100)}\n`);
      errors++;
    }
  }

  const files = generateReports(closedBusinesses, "names");

  console.log("\n=== Results ===");
  console.log(`Searched: ${checked}`);
  console.log(`Confirmed closed: ${confirmed.length}`);
  console.log(`Not found (likely closed): ${closedBusinesses.filter((b) => b.status === "NOT_FOUND").length}`);
  console.log(`Still open: ${stillOpen.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nReports: ${files.mdFile}`);

  if (closedBusinesses.filter((b) => b.website).length > 0) {
    console.log(`\n=== Domain Acquisition Targets ===`);
    for (const b of closedBusinesses.filter((b) => b.website)) {
      console.log(`  ${b.name} (${b.city}, ${b.state}): ${b.website}`);
    }
  }
}

// ===========================================================================
// Entry point
// ===========================================================================
async function main() {
  console.log("=== Find Closed Dog Groomers - WA & OR ===");
  console.log("Date:", new Date().toISOString());
  console.log();

  if (checkExisting) {
    await runCheckExisting();
  } else if (searchNames) {
    await runSearchNames();
  } else {
    console.log("Usage:");
    console.log("  --check-existing    Check your Supabase listings for closed businesses");
    console.log("  --search-names      Look up known closed business names via Google Places");
    console.log("  --limit N           Process only first N items");
    console.log("  --state WA|OR       Filter by state");
    console.log("  --city NAME         Filter by city");
    console.log();
    console.log("Examples:");
    console.log("  node scripts/find-closed-groomers.js --check-existing --limit 20");
    console.log("  node scripts/find-closed-groomers.js --search-names");
    console.log("  node scripts/find-closed-groomers.js --check-existing --state WA");
  }
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
