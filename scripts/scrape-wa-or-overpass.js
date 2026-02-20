#!/usr/bin/env node

/**
 * scrape-wa-or-overpass.js
 *
 * Queries the Overpass API for ALL pet grooming businesses in
 * Washington state and Oregon state. Extracts structured data,
 * deduplicates by name+city, filters nameless entries, and writes
 * the results to data/groomers_wa_or_raw.json.
 *
 * Strategy:
 *   - Run multiple focused queries per state to avoid timeouts
 *   - Retry failed queries up to 3 times with exponential backoff
 *   - Alternate between Overpass API endpoints to spread load
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const OUTPUT_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "groomers_wa_or_raw.json");
const DELAY_MS = 12000; // 12 seconds between queries
const MAX_RETRIES = 3;

const STATES = [
  { name: "Washington", adminLevel: "4", abbrev: "WA" },
  { name: "Oregon", adminLevel: "4", abbrev: "OR" },
];

// ---------------------------------------------------------------------------
// Overpass query builders
// ---------------------------------------------------------------------------

function buildExactTagQuery(stateName, adminLevel) {
  return `
[out:json][timeout:180];
area["name"="${stateName}"]["admin_level"="${adminLevel}"]->.searchArea;
(
  node["shop"="pet_grooming"](area.searchArea);
  way["shop"="pet_grooming"](area.searchArea);
  relation["shop"="pet_grooming"](area.searchArea);
  node["shop"="dog_grooming"](area.searchArea);
  way["shop"="dog_grooming"](area.searchArea);
  relation["shop"="dog_grooming"](area.searchArea);
  node["amenity"="pet_grooming"](area.searchArea);
  way["amenity"="pet_grooming"](area.searchArea);
  relation["amenity"="pet_grooming"](area.searchArea);
);
out body center;
>;
out skel qt;
`.trim();
}

function buildShopNameQuery(stateName, adminLevel) {
  return `
[out:json][timeout:180];
area["name"="${stateName}"]["admin_level"="${adminLevel}"]->.searchArea;
(
  node["shop"]["name"~"[Gg]room"](area.searchArea);
  way["shop"]["name"~"[Gg]room"](area.searchArea);
  relation["shop"]["name"~"[Gg]room"](area.searchArea);
);
out body center;
>;
out skel qt;
`.trim();
}

function buildCraftNameQuery(stateName, adminLevel) {
  return `
[out:json][timeout:180];
area["name"="${stateName}"]["admin_level"="${adminLevel}"]->.searchArea;
(
  node["craft"]["name"~"[Gg]room"](area.searchArea);
  way["craft"]["name"~"[Gg]room"](area.searchArea);
  relation["craft"]["name"~"[Gg]room"](area.searchArea);
);
out body center;
>;
out skel qt;
`.trim();
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function postOverpass(query, endpointUrl) {
  return new Promise((resolve, reject) => {
    const body = "data=" + encodeURIComponent(query);
    const url = new URL(endpointUrl);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "GroomHubScraper/1.0",
      },
    };

    function handleRes(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const rUrl = new URL(res.headers.location);
        const rOpts = { ...options, hostname: rUrl.hostname, path: rUrl.pathname + rUrl.search };
        const req2 = https.request(rOpts, (res2) => {
          let data = "";
          res2.on("data", (c) => (data += c));
          res2.on("end", () => {
            if (res2.statusCode !== 200) return reject(new Error(`HTTP ${res2.statusCode}`));
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          });
        });
        req2.on("error", reject);
        req2.write(body);
        req2.end();
        return;
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }

    const req = https.request(options, handleRes);
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Extract groomer record
// ---------------------------------------------------------------------------

function extractGroomer(element, stateAbbrev) {
  const tags = element.tags || {};
  const lat = element.lat || (element.center && element.center.lat) || null;
  const lon = element.lon || (element.center && element.center.lon) || null;
  const street = tags["addr:street"] || "";
  const housenumber = tags["addr:housenumber"] || "";
  const address = [housenumber, street].filter(Boolean).join(" ") || null;

  return {
    osm_id: element.id,
    osm_type: element.type,
    name: tags.name || null,
    phone: tags.phone || tags["contact:phone"] || null,
    website: tags.website || tags["contact:website"] || null,
    address,
    city: tags["addr:city"] || null,
    state: tags["addr:state"] || stateAbbrev,
    postcode: tags["addr:postcode"] || null,
    lat,
    lon,
    opening_hours: tags.opening_hours || null,
    shop: tags.shop || null,
    amenity: tags.amenity || null,
    craft: tags.craft || null,
  };
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

let endpointIndex = 0;

async function runQueryWithRetry(label, queryStr, stateAbbrev) {
  console.log(`  -> ${label}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[endpointIndex % OVERPASS_ENDPOINTS.length];
    endpointIndex++;
    const shortEndpoint = new URL(endpoint).hostname;

    try {
      if (attempt > 1) {
        const backoff = DELAY_MS * attempt;
        console.log(`     Retry ${attempt}/${MAX_RETRIES} using ${shortEndpoint} after ${backoff / 1000}s backoff...`);
        await sleep(backoff);
      } else {
        console.log(`     Using ${shortEndpoint} (attempt ${attempt}/${MAX_RETRIES})`);
      }

      const result = await postOverpass(queryStr, endpoint);
      const elements = (result.elements || []).filter((el) => el.tags && el.tags.name);
      const groomers = elements.map((el) => extractGroomer(el, stateAbbrev));
      console.log(`     OK: ${groomers.length} named records`);
      return groomers;
    } catch (err) {
      console.error(`     Attempt ${attempt} failed: ${err.message}`);
    }
  }

  console.error(`     GAVE UP after ${MAX_RETRIES} attempts`);
  return [];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== PNW Grooming Directory — Overpass Scraper ===\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  let allGroomers = [];
  let queryNum = 0;
  const totalQueries = STATES.length * 3;

  for (const state of STATES) {
    console.log(`\n--- ${state.name} (${state.abbrev}) ---`);

    const queries = [
      {
        label: "Exact tags (shop=pet_grooming / dog_grooming, amenity=pet_grooming)",
        queryStr: buildExactTagQuery(state.name, state.adminLevel),
      },
      {
        label: "Shop + name~groom",
        queryStr: buildShopNameQuery(state.name, state.adminLevel),
      },
      {
        label: "Craft + name~groom",
        queryStr: buildCraftNameQuery(state.name, state.adminLevel),
      },
    ];

    for (const q of queries) {
      queryNum++;
      console.log(`\n[${queryNum}/${totalQueries}]`);
      const results = await runQueryWithRetry(q.label, q.queryStr, state.abbrev);
      allGroomers.push(...results);

      if (queryNum < totalQueries) {
        console.log(`  Waiting ${DELAY_MS / 1000}s...`);
        await sleep(DELAY_MS);
      }
    }
  }

  // ---------- Filter + Dedup ----------
  const named = allGroomers.filter((g) => g.name && g.name.trim().length > 0);
  console.log(`\n========================================`);
  console.log(`Total records with a name (before dedup): ${named.length}`);

  // Dedup by OSM ID first
  const seenOsm = new Set();
  const osmDeduped = [];
  for (const g of named) {
    const osmKey = `${g.osm_type}-${g.osm_id}`;
    if (!seenOsm.has(osmKey)) {
      seenOsm.add(osmKey);
      osmDeduped.push(g);
    }
  }
  console.log(`After OSM ID dedup: ${osmDeduped.length}  (removed ${named.length - osmDeduped.length})`);

  // Dedup by name+city
  const seen = new Set();
  const deduped = [];
  for (const g of osmDeduped) {
    const key = `${(g.name || "").toLowerCase().trim()}|${(g.city || "unknown").toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(g);
    }
  }
  console.log(`After name+city dedup: ${deduped.length}  (removed ${osmDeduped.length - deduped.length})`);
  console.log(`========================================\n`);

  // ---------- Stats ----------
  const byState = {};
  const byCity = {};

  for (const g of deduped) {
    const st = g.state || "Unknown";
    byState[st] = (byState[st] || 0) + 1;
    const city = g.city || "(no city)";
    const cityKey = `${city}, ${st}`;
    byCity[cityKey] = (byCity[cityKey] || 0) + 1;
  }

  console.log("--- By State ---");
  for (const [st, count] of Object.entries(byState).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${st}: ${count}`);
  }

  console.log("\n--- By City (top 40) ---");
  const citiesSorted = Object.entries(byCity).sort((a, b) => b[1] - a[1]);
  for (const [city, count] of citiesSorted.slice(0, 40)) {
    console.log(`  ${city}: ${count}`);
  }
  if (citiesSorted.length > 40) {
    console.log(`  ... and ${citiesSorted.length - 40} more cities`);
  }

  // ---------- Write output ----------
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(deduped, null, 2), "utf-8");
  console.log(`\nWrote ${deduped.length} records to ${OUTPUT_FILE}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
