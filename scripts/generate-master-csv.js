#!/usr/bin/env node

/**
 * Master CSV Generator for PNW Grooming Directory
 *
 * Reads enriched groomer data, merges with existing groomer data,
 * and outputs a master CSV file matching the Supabase business_listings
 * table schema.
 *
 * Usage:
 *   node scripts/generate-master-csv.js
 *
 * Input:
 *   data/groomers_enriched.json  (primary - from firecrawl-enrich.js)
 *   groomers_osm.json            (fallback/merge source)
 *
 * Output:
 *   data/master-groomers.csv
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const ENRICHED_FILE = path.join(DATA_DIR, 'groomers_enriched.json');
const OSM_FILE = path.join(PROJECT_ROOT, 'groomers_osm.json');
const OUTPUT_CSV = path.join(DATA_DIR, 'master-groomers.csv');

// The CSV columns matching the Supabase business_listings table schema
const CSV_COLUMNS = [
  'id',
  'slug',
  'name',
  'description',
  'short_description',
  'address',
  'city',
  'city_slug',
  'state',
  'zip',
  'phone',
  'website',
  'email',
  'rating',
  'review_count',
  'price_range',
  'price_min',
  'price_max',
  'transparent_pricing',
  'grooms_cats',
  'accepts_new_clients',
  'waitlist_status',
  'services',
  'service_categories',
  'pet_types',
  'hours',
  'images',
  'badges',
  'is_featured',
  'is_paw_verified',
  'is_best_in_show',
  'year_established',
  'team_size',
  'specialties',
  'breeds',
  'lat',
  'lng',
  'booking_url',
  'vaccination_required',
  'vaccinations_list',
  'walk_ins_accepted',
  'early_hours',
  'late_hours',
  'mobile_grooming',
  'eco_friendly',
  'self_wash',
  'certifications',
  'social_media',
  'source',
];

// ---------------------------------------------------------------------------
// CSV utilities
// ---------------------------------------------------------------------------

/**
 * Escape a value for CSV output.
 * - Wraps in double quotes if the value contains commas, quotes, or newlines.
 * - Doubles any existing double quotes.
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  var str;
  if (typeof value === 'object') {
    // Arrays and objects get JSON-stringified
    str = JSON.stringify(value);
  } else if (typeof value === 'boolean') {
    str = value ? 'true' : 'false';
  } else {
    str = String(value);
  }

  // Check if quoting is needed
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Convert a row object to a CSV line string.
 */
function rowToCsvLine(row, columns) {
  return columns.map(function(col) {
    return escapeCsvValue(row[col]);
  }).join(',');
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function generateSlug(name, city) {
  var base = (name + '-' + (city || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'groomer';
}

// ---------------------------------------------------------------------------
// UUID generation (v4-like, deterministic from name+city for consistency)
// ---------------------------------------------------------------------------

function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function generateId(name, city, index) {
  // Generate a deterministic UUID-like string
  var seed = (name || '') + '|' + (city || '') + '|' + index;
  var h1 = Math.abs(simpleHash(seed)).toString(16).padStart(8, '0');
  var h2 = Math.abs(simpleHash(seed + 'a')).toString(16).padStart(4, '0').slice(0, 4);
  var h3 = Math.abs(simpleHash(seed + 'b')).toString(16).padStart(4, '0').slice(0, 4);
  var h4 = Math.abs(simpleHash(seed + 'c')).toString(16).padStart(4, '0').slice(0, 4);
  var h5 = Math.abs(simpleHash(seed + 'd')).toString(16).padStart(12, '0').slice(0, 12);
  return h1 + '-' + h2 + '-' + h3 + '-' + h4 + '-' + h5;
}

// ---------------------------------------------------------------------------
// Data loading and merging
// ---------------------------------------------------------------------------

function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  var raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function mergeGroomerData() {
  var enriched = loadJsonFile(ENRICHED_FILE);
  var osm = loadJsonFile(OSM_FILE);

  if (!enriched && !osm) {
    console.error('Error: No data files found.');
    console.error('  Looked for: ' + ENRICHED_FILE);
    console.error('  Looked for: ' + OSM_FILE);
    process.exit(1);
  }

  // Build a map of enriched data by name+city
  var enrichedMap = new Map();
  if (enriched) {
    console.log('Loaded ' + enriched.length + ' records from enriched data');
    for (var i = 0; i < enriched.length; i++) {
      var item = enriched[i];
      var key = (item.name || '') + '|||' + (item.city || '');
      enrichedMap.set(key, item);
    }
  }

  // Build a map of OSM data for merging
  var osmMap = new Map();
  if (osm) {
    console.log('Loaded ' + osm.length + ' records from OSM data');
    for (var oi = 0; oi < osm.length; oi++) {
      var osmItem = osm[oi];
      var osmKey = (osmItem.name || '') + '|||' + (osmItem.city || '');
      osmMap.set(osmKey, osmItem);
    }
  }

  // Merge: start with enriched data, fill gaps from OSM
  var mergedMap = new Map();

  // First, add all enriched records
  enrichedMap.forEach(function(value, key) {
    mergedMap.set(key, value);
  });

  // Then, add any OSM records not in enriched
  osmMap.forEach(function(osmVal, key) {
    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        name: osmVal.name,
        slug: generateSlug(osmVal.name, osmVal.city),
        address: osmVal.address || null,
        city: osmVal.city || null,
        city_slug: osmVal.city ? osmVal.city.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null,
        state: osmVal.state || null,
        zip: osmVal.postcode || osmVal.zip || null,
        phone: osmVal.phone || null,
        website: osmVal.website || null,
        lat: osmVal.lat || null,
        lng: osmVal.lon || osmVal.lng || null,
        source: 'osm',
        pet_types: ['dogs'],
      });
    } else {
      // Merge missing fields from OSM into enriched
      var existing = mergedMap.get(key);
      if (!existing.phone && osmVal.phone) existing.phone = osmVal.phone;
      if (!existing.address && osmVal.address) existing.address = osmVal.address;
      if (!existing.website && osmVal.website) existing.website = osmVal.website;
      if (!existing.lat && osmVal.lat) existing.lat = osmVal.lat;
      if (!existing.lng && (osmVal.lon || osmVal.lng)) existing.lng = osmVal.lon || osmVal.lng;
      mergedMap.set(key, existing);
    }
  });

  return Array.from(mergedMap.values());
}

// ---------------------------------------------------------------------------
// Generate badges based on enriched data
// ---------------------------------------------------------------------------

function generateBadges(groomer) {
  var badges = [];

  if (groomer.eco_friendly) badges.push('eco-friendly');
  if (groomer.certifications && groomer.certifications.length > 0) {
    if (groomer.certifications.some(function(c) { return /fear.free/i.test(c); })) {
      badges.push('fear-free-certified');
    }
    if (groomer.certifications.some(function(c) { return /certified\s*master/i.test(c) || /cmg/i.test(c); })) {
      badges.push('master-groomer');
    }
  }
  if (groomer.mobile_grooming) badges.push('mobile-grooming');
  if (groomer.self_wash) badges.push('self-wash-station');
  if (groomer.transparent_pricing) badges.push('transparent-pricing');
  if (groomer.walk_ins_accepted) badges.push('walk-ins-welcome');
  if (groomer.grooms_cats) badges.push('cat-friendly');
  if (groomer.vaccination_required) badges.push('vaccination-required');
  if (groomer.early_hours) badges.push('early-hours');
  if (groomer.late_hours) badges.push('late-hours');

  return badges.length > 0 ? badges : null;
}

// ---------------------------------------------------------------------------
// Derive breeds from specialties
// ---------------------------------------------------------------------------

function deriveBreeds(groomer) {
  var breeds = [];
  var specialties = groomer.specialties || [];
  var text = specialties.join(' ').toLowerCase();

  if (text.includes('doodle')) breeds.push('Doodles');
  if (text.includes('poodle')) breeds.push('Poodles');
  if (text.includes('goldendoodle')) breeds.push('Goldendoodles');
  if (text.includes('labradoodle')) breeds.push('Labradoodles');
  if (text.includes('terrier')) breeds.push('Terriers');
  if (text.includes('large breed') || text.includes('large dog') || text.includes('giant breed')) {
    breeds.push('Large Breeds');
  }
  if (text.includes('small breed') || text.includes('small dog') || text.includes('toy breed')) {
    breeds.push('Small Breeds');
  }
  if (text.includes('double coat') || text.includes('double-coated')) {
    breeds.push('Double-Coated Breeds');
  }
  if (text.includes('brachycephalic') || text.includes('flat-faced')) {
    breeds.push('Brachycephalic Breeds');
  }

  return breeds.length > 0 ? breeds : null;
}

// ---------------------------------------------------------------------------
// Transform enriched groomer data to CSV row
// ---------------------------------------------------------------------------

function groomerToRow(groomer, index) {
  var id = groomer.id || generateId(groomer.name, groomer.city, index);
  var slug = groomer.slug || generateSlug(groomer.name, groomer.city);
  var badges = groomer.badges || generateBadges(groomer);
  var breeds = groomer.breeds || deriveBreeds(groomer);

  return {
    id: id,
    slug: slug,
    name: groomer.name || '',
    description: groomer.description || null,
    short_description: groomer.short_description || null,
    address: groomer.address || null,
    city: groomer.city || null,
    city_slug: groomer.city_slug || (groomer.city ? groomer.city.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null),
    state: groomer.state || null,
    zip: groomer.zip || groomer.postcode || null,
    phone: groomer.phone || null,
    website: groomer.website || null,
    email: groomer.email || null,
    rating: groomer.rating || null,
    review_count: groomer.review_count || null,
    price_range: groomer.price_range || null,
    price_min: groomer.price_min || null,
    price_max: groomer.price_max || null,
    transparent_pricing: groomer.transparent_pricing || false,
    grooms_cats: groomer.grooms_cats || false,
    accepts_new_clients: groomer.accepts_new_clients || null,
    waitlist_status: groomer.waitlist_status || null,
    services: groomer.services || null,
    service_categories: groomer.service_categories || null,
    pet_types: groomer.pet_types || ['dogs'],
    hours: groomer.hours || null,
    images: groomer.images || null,
    badges: badges,
    is_featured: groomer.is_featured || false,
    is_paw_verified: groomer.is_paw_verified || false,
    is_best_in_show: groomer.is_best_in_show || false,
    year_established: groomer.year_established || null,
    team_size: groomer.team_size || null,
    specialties: groomer.specialties || null,
    breeds: breeds,
    lat: groomer.lat || null,
    lng: groomer.lng || null,
    booking_url: groomer.booking_url || null,
    vaccination_required: groomer.vaccination_required || false,
    vaccinations_list: groomer.vaccinations_list || null,
    walk_ins_accepted: groomer.walk_ins_accepted || false,
    early_hours: groomer.early_hours || false,
    late_hours: groomer.late_hours || false,
    mobile_grooming: groomer.mobile_grooming || false,
    eco_friendly: groomer.eco_friendly || false,
    self_wash: groomer.self_wash || false,
    certifications: groomer.certifications || null,
    social_media: groomer.social_media || null,
    source: groomer.source || 'osm',
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('=== Master CSV Generator ===');
  console.log('Date: ' + new Date().toISOString());
  console.log('');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Merge data sources
  var groomers = mergeGroomerData();
  console.log('');
  console.log('Total merged records: ' + groomers.length);

  // Transform to rows
  var rows = [];
  for (var i = 0; i < groomers.length; i++) {
    rows.push(groomerToRow(groomers[i], i));
  }

  // Generate CSV
  var csvLines = [];
  csvLines.push(CSV_COLUMNS.join(','));

  for (var ri = 0; ri < rows.length; ri++) {
    csvLines.push(rowToCsvLine(rows[ri], CSV_COLUMNS));
  }

  var csvContent = csvLines.join('\n') + '\n';
  fs.writeFileSync(OUTPUT_CSV, csvContent, 'utf-8');

  // Statistics
  var stats = {
    total: rows.length,
    with_website: rows.filter(function(r) { return r.website; }).length,
    with_phone: rows.filter(function(r) { return r.phone; }).length,
    with_email: rows.filter(function(r) { return r.email; }).length,
    with_services: rows.filter(function(r) { return r.services && r.services.length > 0; }).length,
    with_pricing: rows.filter(function(r) { return r.price_range; }).length,
    with_images: rows.filter(function(r) { return r.images && r.images.length > 0; }).length,
    with_social: rows.filter(function(r) { return r.social_media; }).length,
    with_booking: rows.filter(function(r) { return r.booking_url; }).length,
    with_certifications: rows.filter(function(r) { return r.certifications && r.certifications.length > 0; }).length,
    grooms_cats: rows.filter(function(r) { return r.grooms_cats === true; }).length,
    mobile_grooming: rows.filter(function(r) { return r.mobile_grooming === true; }).length,
    eco_friendly: rows.filter(function(r) { return r.eco_friendly === true; }).length,
    self_wash: rows.filter(function(r) { return r.self_wash === true; }).length,
    walk_ins: rows.filter(function(r) { return r.walk_ins_accepted === true; }).length,
    vaccination_required: rows.filter(function(r) { return r.vaccination_required === true; }).length,
  };

  // Cities breakdown
  var cityCount = {};
  for (var ci = 0; ci < rows.length; ci++) {
    var city = rows[ci].city || 'Unknown';
    cityCount[city] = (cityCount[city] || 0) + 1;
  }

  // State breakdown
  var stateCount = {};
  for (var sti = 0; sti < rows.length; sti++) {
    var state = rows[sti].state || 'Unknown';
    stateCount[state] = (stateCount[state] || 0) + 1;
  }

  console.log('');
  console.log('=== Output Statistics ===');
  console.log('Total records:          ' + stats.total);
  console.log('With website:           ' + stats.with_website);
  console.log('With phone:             ' + stats.with_phone);
  console.log('With email:             ' + stats.with_email);
  console.log('With services:          ' + stats.with_services);
  console.log('With pricing:           ' + stats.with_pricing);
  console.log('With images:            ' + stats.with_images);
  console.log('With social media:      ' + stats.with_social);
  console.log('With booking URL:       ' + stats.with_booking);
  console.log('With certifications:    ' + stats.with_certifications);
  console.log('Grooms cats:            ' + stats.grooms_cats);
  console.log('Mobile grooming:        ' + stats.mobile_grooming);
  console.log('Eco-friendly:           ' + stats.eco_friendly);
  console.log('Self-wash stations:     ' + stats.self_wash);
  console.log('Walk-ins accepted:      ' + stats.walk_ins);
  console.log('Vaccination required:   ' + stats.vaccination_required);

  console.log('');
  console.log('States:');
  var stateKeys = Object.keys(stateCount).sort();
  for (var sk = 0; sk < stateKeys.length; sk++) {
    console.log('  ' + stateKeys[sk] + ': ' + stateCount[stateKeys[sk]]);
  }

  // Show top 10 cities
  var cityEntries = Object.keys(cityCount).map(function(k) { return { city: k, count: cityCount[k] }; });
  cityEntries.sort(function(a, b) { return b.count - a.count; });
  console.log('');
  console.log('Top cities:');
  var topCities = cityEntries.slice(0, 10);
  for (var tc = 0; tc < topCities.length; tc++) {
    console.log('  ' + topCities[tc].city + ': ' + topCities[tc].count);
  }

  console.log('');
  console.log('CSV output: ' + OUTPUT_CSV);
  console.log('CSV columns: ' + CSV_COLUMNS.length);
  console.log('CSV rows (data): ' + rows.length);
  console.log('');
  console.log('Done!');
}

main();
