#!/usr/bin/env node

/**
 * Google Places API (New) Enrichment Script
 *
 * Looks up each listing in Supabase via Google Places API v2 and updates
 * with real data: rating, review_count, phone, website, hours, address, lat/lng.
 *
 * Usage:
 *   node scripts/google-places-enrich.js                  # enrich all listings
 *   node scripts/google-places-enrich.js --limit 10       # process first 10
 *   node scripts/google-places-enrich.js --dry-run        # preview without updating
 *   node scripts/google-places-enrich.js --city seattle   # only Seattle listings
 *   node scripts/google-places-enrich.js --force          # overwrite existing data
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const LOG_FILE = path.join(__dirname, "..", "data", "places-enrich.log");
const DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Load .env.local into a plain object (not process.env)
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
if (!SB_URL || !SB_KEY) { console.error("Missing Supabase credentials in .env.local"); process.exit(1); }

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let limit = Infinity, dryRun = false, filterCity = null, force = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--limit" && args[i + 1]) { limit = parseInt(args[i + 1], 10); i++; }
  else if (args[i] === "--dry-run") dryRun = true;
  else if (args[i] === "--city" && args[i + 1]) { filterCity = args[i + 1].toLowerCase(); i++; }
  else if (args[i] === "--force") force = true;
}

// ---------------------------------------------------------------------------
// HTTP helper — simple, proven pattern
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
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (res.status !== 200) throw new Error(`Supabase GET ${res.status}: ${res.body.slice(0, 200)}`);
  return JSON.parse(res.body);
}

async function supabasePatch(id, update) {
  const url = new URL(`/rest/v1/business_listings?id=eq.${id}`, SB_URL);
  const body = JSON.stringify(update);
  const res = await httpReq({
    hostname: url.hostname, port: 443, path: url.pathname + url.search, method: "PATCH",
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
      "Content-Length": String(Buffer.byteLength(body)),
    },
  }, body);
  if (res.status > 299) throw new Error(`Supabase PATCH ${res.status}: ${res.body.slice(0, 200)}`);
}

// ---------------------------------------------------------------------------
// Google Places API (New)
// ---------------------------------------------------------------------------
const FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress",
  "places.nationalPhoneNumber", "places.internationalPhoneNumber",
  "places.websiteUri", "places.rating", "places.userRatingCount",
  "places.priceLevel", "places.regularOpeningHours", "places.location",
  "places.businessStatus", "places.googleMapsUri",
].join(",");

async function searchPlace(name, city, state, retries = 3) {
  const body = JSON.stringify({
    textQuery: `${name} ${city} ${state} pet grooming`,
    maxResultCount: 1,
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

    // Success
    if (res.status === 200 && res.body.length > 0) {
      const json = JSON.parse(res.body);
      return json.places && json.places[0] ? json.places[0] : null;
    }

    // Rate limited or empty — retry with backoff
    if ((res.status === 429 || res.body.length === 0) && attempt < retries) {
      const delay = 2000 * Math.pow(2, attempt);
      process.stdout.write(` [retry ${attempt + 1} in ${delay / 1000}s]`);
      await sleep(delay);
      continue;
    }

    // Hard error
    if (res.status !== 200) {
      throw new Error(`Google API ${res.status}: ${res.body.slice(0, 200)}`);
    }

    // Empty body on 200 — no results
    return null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Map Google data → Supabase update
// ---------------------------------------------------------------------------
function buildUpdate(place, existing) {
  const update = {};
  const changes = [];

  // Rating — always update
  if (place.rating != null) {
    update.rating = place.rating;
    changes.push(`rating=${place.rating}`);
  } else {
    update.rating = 0;
    update.review_count = 0;
    changes.push("rating=0 (not found)");
  }
  if (place.userRatingCount != null) {
    update.review_count = place.userRatingCount;
    changes.push(`reviews=${place.userRatingCount}`);
  }

  // Phone — only if missing or forced
  if (place.nationalPhoneNumber && (force || !existing.phone)) {
    update.phone = place.nationalPhoneNumber;
    changes.push("phone");
  }
  // Website
  if (place.websiteUri && (force || !existing.website)) {
    update.website = place.websiteUri;
    changes.push("website");
  }
  // Address
  if (place.formattedAddress && (force || !existing.address)) {
    update.address = place.formattedAddress;
    changes.push("address");
  }
  // Lat/Lng
  if (place.location && (force || !existing.lat || existing.lat === 0)) {
    update.lat = place.location.latitude;
    update.lng = place.location.longitude;
    changes.push("lat/lng");
  }
  // Hours
  if (place.regularOpeningHours?.weekdayDescriptions && (force || !existing.hours || existing.hours.length === 0)) {
    const hours = parseHours(place.regularOpeningHours.weekdayDescriptions);
    if (hours.length > 0) { update.hours = hours; changes.push("hours"); }
  }
  // Price level
  if (place.priceLevel && (force || !existing.price_range)) {
    const map = { PRICE_LEVEL_FREE: "$", PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$" };
    if (map[place.priceLevel]) { update.price_range = map[place.priceLevel]; changes.push("price_range"); }
  }

  return { update, changes };
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Google Places API (New) Enrichment ===");
  console.log("Date:", new Date().toISOString());
  if (dryRun) console.log("** DRY RUN **");
  if (force) console.log("** FORCE OVERWRITE **");
  if (filterCity) console.log("** City filter:", filterCity, "**");
  console.log();

  // Load listings
  let query = "?select=id,slug,name,city,state,phone,website,address,rating,review_count,hours,lat,lng,price_range&order=name";
  if (filterCity) query += `&city=ilike.%25${encodeURIComponent(filterCity)}%25`;
  const listings = await supabaseGet(query);
  console.log(`Loaded ${listings.length} listings`);

  const batch = listings.slice(0, limit);
  console.log(`Processing: ${batch.length}\n`);

  const stats = { updated: 0, skipped: 0, notFound: 0, errors: 0, closed: 0, calls: 0 };
  const log = [`=== Run: ${new Date().toISOString()} ===`];

  for (let i = 0; i < batch.length; i++) {
    const l = batch[i];
    const tag = `[${i + 1}/${batch.length}] ${l.name} (${l.city}, ${l.state})`;

    try {
      stats.calls++;
      const place = await searchPlace(l.name, l.city, l.state);
      await sleep(DELAY_MS);

      if (!place) {
        process.stdout.write(`${tag} -> NOT FOUND\n`);
        log.push(`NOT FOUND: ${l.name} (${l.city})`);
        stats.notFound++;
        continue;
      }

      if (place.businessStatus === "CLOSED_PERMANENTLY") {
        process.stdout.write(`${tag} -> PERMANENTLY CLOSED\n`);
        log.push(`CLOSED: ${l.name} (${l.city})`);
        stats.closed++;
        continue;
      }

      const { update, changes } = buildUpdate(place, l);
      if (changes.length === 0) {
        process.stdout.write(`${tag} -> no new data\n`);
        stats.skipped++;
        continue;
      }

      if (!dryRun) await supabasePatch(l.id, update);

      const matched = place.displayName?.text || "?";
      process.stdout.write(`${tag} -> "${matched}" | ${changes.join(", ")}${dryRun ? " (dry)" : ""}\n`);
      log.push(`UPDATED: ${l.name} -> "${matched}" — ${changes.join(", ")}`);
      stats.updated++;
    } catch (err) {
      process.stdout.write(`${tag} -> ERROR: ${err.message.slice(0, 120)}\n`);
      log.push(`ERROR: ${l.name} — ${err.message.slice(0, 200)}`);
      stats.errors++;
    }
  }

  log.push("", `Updated: ${stats.updated}`, `Closed: ${stats.closed}`, `Not found: ${stats.notFound}`, `Errors: ${stats.errors}`, `API calls: ${stats.calls}`, "");
  fs.appendFileSync(LOG_FILE, log.join("\n") + "\n", "utf-8");

  console.log("\n=== Done ===");
  console.log(`Updated: ${stats.updated} | Closed: ${stats.closed} | Not found: ${stats.notFound} | Errors: ${stats.errors}`);
  console.log(`API calls: ${stats.calls}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
