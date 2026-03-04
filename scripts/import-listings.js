#!/usr/bin/env node
/**
 * import-listings.js
 *
 * Seamless listing importer: reads a discovered SQL file, cleans the data,
 * upserts missing cities, then upserts listings — all via the Supabase REST API.
 *
 * Usage:
 *   node scripts/import-listings.js data/discovered_wa_613.sql [--dry-run]
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BATCH_SIZE = 50;

// ── Blocklists ──────────────────────────────────────────────────────────

// Cities that are definitely not in WA/OR (bad geocode results)
const BLOCKED_CITY_SLUGS = new Set([
  'co-mayo',           // Ireland
  'huber-heights',     // Ohio
  'kettering',         // Ohio
  'waukegan',          // Illinois
  'oldtown',           // Idaho
  'shop-3-22-dorothy-st', // Address in Australia
]);

// Business names/slugs that are clearly not groomers
const BLOCKED_NAME_PATTERNS = [
  /\bcar wash\b/i,
  /\bfuneral\b/i,
  /\bchurch\b/i,
  /\boff.?leash.*(dog )?(area|park)\b/i,
  /\brestaurant\b/i,
  /\bhardware\b(?!.*groom)/i,  // hardware stores unless "grooming" in name
];

// Max slug length (URLs get ugly beyond this)
const MAX_SLUG_LENGTH = 80;

function plainSlug(slug) {
  return String(slug).replace(/-(wa|or)$/i, '');
}

function stateAwareCitySlug(citySlug, state) {
  return `${plainSlug(citySlug)}-${String(state).toLowerCase()}`;
}

// ── SQL Parser ──────────────────────────────────────────────────────────

function parseSqlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const inserts = content.split(/;\s*\n/).filter(s => s.trim().startsWith('INSERT'));

  const rows = [];
  for (const stmt of inserts) {
    const match = stmt.match(/VALUES\s*\(([\s\S]+)\)$/);
    if (!match) continue;

    const valStr = match[1];
    const row = parseValues(valStr);
    if (row) rows.push(row);
  }
  return rows;
}

function parseValues(valStr) {
  // Extract fields positionally from the VALUES clause
  // This handles the known column order from discover-groomers output
  const fields = [];
  let i = 0;

  while (i < valStr.length) {
    // Skip whitespace/commas
    while (i < valStr.length && (valStr[i] === ' ' || valStr[i] === ',' || valStr[i] === '\n')) i++;
    if (i >= valStr.length) break;

    if (valStr.substring(i, i + 4) === 'NULL') {
      fields.push(null);
      i += 4;
    } else if (valStr.substring(i, i + 4) === 'true') {
      fields.push(true);
      i += 4;
    } else if (valStr.substring(i, i + 5) === 'false') {
      fields.push(false);
      i += 5;
    } else if (valStr.substring(i, i + 5) === 'ARRAY') {
      // Parse ARRAY[...]::type
      const arrStart = valStr.indexOf('[', i);
      let depth = 0;
      let j = arrStart;
      while (j < valStr.length) {
        if (valStr[j] === '[') depth++;
        else if (valStr[j] === ']') { depth--; if (depth === 0) break; }
        // Handle strings inside arrays
        else if (valStr[j] === "'") {
          j++;
          while (j < valStr.length && !(valStr[j] === "'" && valStr[j + 1] !== "'")) {
            if (valStr[j] === "'" && valStr[j + 1] === "'") j += 2;
            else j++;
          }
        }
        j++;
      }
      // Find end of ::type[]
      const typeEnd = valStr.indexOf(']', j + 1);
      const fullArr = valStr.substring(i, typeEnd !== -1 ? typeEnd + 1 : j + 1);

      // Parse array contents
      const innerMatch = fullArr.match(/ARRAY\[([\s\S]*?)\]::/);
      if (innerMatch) {
        const inner = innerMatch[1].trim();
        if (!inner) {
          fields.push([]);
        } else if (fullArr.includes('::jsonb[]')) {
          // JSONB array - extract JSON strings
          const jsonItems = [];
          const jsonRegex = /'((?:[^']|'')*)'::jsonb/g;
          let jm;
          while ((jm = jsonRegex.exec(inner)) !== null) {
            try {
              jsonItems.push(JSON.parse(jm[1].replace(/''/g, "'")));
            } catch { jsonItems.push(jm[1]); }
          }
          fields.push(jsonItems);
        } else {
          // Text array
          const items = [];
          const textRegex = /'((?:[^']|'')*)'/g;
          let tm;
          while ((tm = textRegex.exec(inner)) !== null) {
            items.push(tm[1].replace(/''/g, "'"));
          }
          fields.push(items);
        }
      } else {
        fields.push([]);
      }
      i = (typeEnd !== -1 ? typeEnd : j) + 1;
    } else if (valStr[i] === "'") {
      // Parse quoted string
      let j = i + 1;
      let str = '';
      while (j < valStr.length) {
        if (valStr[j] === "'" && valStr[j + 1] === "'") {
          str += "'";
          j += 2;
        } else if (valStr[j] === "'") {
          break;
        } else {
          str += valStr[j];
          j++;
        }
      }
      fields.push(str);
      i = j + 1;
    } else if (/[\d.-]/.test(valStr[i])) {
      // Number
      let j = i;
      while (j < valStr.length && /[\d.e-]/.test(valStr[j])) j++;
      fields.push(Number(valStr.substring(i, j)));
      i = j;
    } else {
      i++;
    }
  }

  // Map to column names (must match the INSERT column order)
  const columns = [
    'id', 'slug', 'name', 'description', 'short_description', 'address',
    'city', 'city_slug', 'state', 'zip', 'phone', 'website', 'email',
    'rating', 'review_count', 'price_range', 'price_min', 'price_max',
    'transparent_pricing', 'grooms_cats', 'accepts_new_clients', 'waitlist_status',
    'services', 'service_categories', 'pet_types', 'hours', 'images', 'badges',
    'is_featured', 'is_paw_verified', 'is_best_in_show', 'year_established',
    'team_size', 'specialties', 'breeds', 'lat', 'lng', 'booking_url'
  ];

  if (fields.length < columns.length) return null;

  const row = {};
  columns.forEach((col, idx) => { row[col] = fields[idx]; });
  return row;
}

// ── Data Cleaning ───────────────────────────────────────────────────────

function cleanListings(rows) {
  const stats = { total: rows.length, blocked_city: 0, blocked_name: 0,
                  dupe_phone: 0, slug_truncated: 0, kept: 0 };
  const removed = [];

  // 1. Remove non-WA/OR cities
  let clean = rows.filter(r => {
    if (BLOCKED_CITY_SLUGS.has(r.city_slug)) {
      stats.blocked_city++;
      removed.push({ reason: 'bad_city', name: r.name, city: r.city });
      return false;
    }
    return true;
  });

  // 2. Remove non-grooming businesses
  clean = clean.filter(r => {
    for (const pattern of BLOCKED_NAME_PATTERNS) {
      if (pattern.test(r.name)) {
        stats.blocked_name++;
        removed.push({ reason: 'not_groomer', name: r.name, city: r.city });
        return false;
      }
    }
    return true;
  });

  // 3. Deduplicate by phone (keep higher-rated listing)
  const phoneMap = new Map();
  for (const r of clean) {
    if (!r.phone) continue;
    if (phoneMap.has(r.phone)) {
      const existing = phoneMap.get(r.phone);
      // Keep the one with more reviews
      if (r.review_count > existing.review_count) {
        phoneMap.set(r.phone, r);
      }
    } else {
      phoneMap.set(r.phone, r);
    }
  }

  // Find internal phone dupes (same phone, different slug)
  const phoneSlugs = new Map();
  for (const r of clean) {
    if (!r.phone) continue;
    if (!phoneSlugs.has(r.phone)) phoneSlugs.set(r.phone, []);
    phoneSlugs.get(r.phone).push(r);
  }

  const dupePhoneRemove = new Set();
  for (const [phone, listings] of phoneSlugs) {
    if (listings.length <= 1) continue;
    // Same phone, same city → likely duplicate, keep best
    const byCityMap = new Map();
    for (const l of listings) {
      if (!byCityMap.has(l.city_slug)) byCityMap.set(l.city_slug, []);
      byCityMap.get(l.city_slug).push(l);
    }
    for (const [, cityListings] of byCityMap) {
      if (cityListings.length <= 1) continue;
      // Keep highest reviewed
      cityListings.sort((a, b) => b.review_count - a.review_count);
      for (let i = 1; i < cityListings.length; i++) {
        dupePhoneRemove.add(cityListings[i].id);
        stats.dupe_phone++;
        removed.push({ reason: 'dupe_phone', name: cityListings[i].name, city: cityListings[i].city, phone });
      }
    }
  }

  clean = clean.filter(r => !dupePhoneRemove.has(r.id));

  // 4. Truncate long slugs
  for (const r of clean) {
    if (r.slug.length > MAX_SLUG_LENGTH) {
      const oldSlug = r.slug;
      // Truncate at last hyphen before limit
      let truncated = r.slug.substring(0, MAX_SLUG_LENGTH);
      const lastHyphen = truncated.lastIndexOf('-');
      if (lastHyphen > 40) truncated = truncated.substring(0, lastHyphen);
      r.slug = truncated;
      stats.slug_truncated++;
      console.log(`  Slug truncated: ${oldSlug} → ${r.slug}`);
    }
  }

  stats.kept = clean.length;
  return { clean, removed, stats };
}

// ── Supabase API ────────────────────────────────────────────────────────

async function supabaseRequest(table, method, body, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
  };

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${table}: ${res.status} ${text}`);
  }
  return res;
}

async function getExisting(table, select, filter = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=10000${filter}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function upsertCities(listings) {
  // Gather unique cities from listings
  const cityMap = new Map();
  for (const r of listings) {
    if (!r.city || r.city === 'Unknown' || !r.city_slug || r.city_slug === 'unknown') {
      continue;
    }
    const cityRecordSlug = stateAwareCitySlug(r.city_slug, r.state);
    if (!cityMap.has(cityRecordSlug)) {
      cityMap.set(cityRecordSlug, {
        slug: cityRecordSlug,
        name: r.city,
        state: r.state === 'WA' ? 'Washington' : r.state === 'OR' ? 'Oregon' : r.state,
        state_abbr: r.state,
        groomer_count: 0,
        image: '',
        description: `Find professional pet groomers in ${r.city}, ${r.state}.`,
        popular_breeds: [],
      });
    }
  }

  // Check which already exist
  const existing = await getExisting('cities', 'slug');
  const existingSlugs = new Set(existing.map(c => c.slug));

  const newCities = [...cityMap.values()].filter(c => !existingSlugs.has(c.slug));

  if (newCities.length === 0) {
    console.log('  All cities already exist');
    return 0;
  }

  // Upsert in batches
  for (let i = 0; i < newCities.length; i += BATCH_SIZE) {
    const batch = newCities.slice(i, i + BATCH_SIZE);
    await supabaseRequest('cities', 'POST', batch);
    console.log(`  Cities batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} upserted`);
  }

  return newCities.length;
}

async function upsertListings(listings) {
  // Check existing by slug to avoid true dupes
  const existing = await getExisting('business_listings', 'slug,phone,state');
  const existingSlugs = new Set(existing.map(r => r.slug));
  const existingPhones = new Set(existing.map(r => r.phone).filter(Boolean));

  // Filter out listings whose phone already exists in DB
  const deduped = [];
  const skippedDbDupes = [];
  for (const r of listings) {
    if (existingSlugs.has(r.slug)) {
      skippedDbDupes.push({ reason: 'slug_exists', name: r.name });
      continue;
    }
    if (r.phone && existingPhones.has(r.phone)) {
      skippedDbDupes.push({ reason: 'phone_exists', name: r.name, phone: r.phone });
      continue;
    }
    deduped.push(r);
  }

  if (skippedDbDupes.length > 0) {
    console.log(`  Skipped ${skippedDbDupes.length} DB duplicates:`);
    for (const d of skippedDbDupes) {
      console.log(`    ${d.reason}: ${d.name}${d.phone ? ' (' + d.phone + ')' : ''}`);
    }
  }

  if (deduped.length === 0) {
    console.log('  No new listings to insert');
    return 0;
  }

  // Upsert in batches
  let inserted = 0;
  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE);
    await supabaseRequest('business_listings', 'POST', batch);
    inserted += batch.length;
    console.log(`  Listings batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} upserted (${inserted}/${deduped.length})`);
  }

  return inserted;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sqlFile = args.find(a => a.endsWith('.sql'));

  if (!sqlFile) {
    console.error('Usage: node scripts/import-listings.js <path-to-sql> [--dry-run]');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE env vars in .env.local');
    process.exit(1);
  }

  const filePath = path.resolve(sqlFile);
  console.log(`\n📂 Parsing ${path.basename(filePath)}...`);

  const rows = parseSqlFile(filePath);
  console.log(`  Parsed ${rows.length} listings\n`);

  console.log('🧹 Cleaning data...');
  const { clean, removed, stats } = cleanListings(rows);

  console.log(`\n📊 Cleaning Summary:`);
  console.log(`  Total parsed:     ${stats.total}`);
  console.log(`  Bad city removed: ${stats.blocked_city}`);
  console.log(`  Not groomer:      ${stats.blocked_name}`);
  console.log(`  Phone dupes:      ${stats.dupe_phone}`);
  console.log(`  Slugs truncated:  ${stats.slug_truncated}`);
  console.log(`  Ready to import:  ${stats.kept}`);

  if (removed.length > 0) {
    console.log(`\n🗑  Removed listings:`);
    for (const r of removed) {
      console.log(`  [${r.reason}] ${r.name} (${r.city}${r.phone ? ', ' + r.phone : ''})`);
    }
  }

  if (dryRun) {
    console.log(`\n🏁 Dry run complete. No data was written.`);
    return;
  }

  console.log(`\n🏙  Upserting cities...`);
  const newCities = await upsertCities(clean);
  console.log(`  ${newCities} new cities added\n`);

  console.log('📋 Upserting listings...');
  const inserted = await upsertListings(clean);

  console.log(`\n✅ Done! ${inserted} new listings imported.`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
