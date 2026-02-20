#!/usr/bin/env node

/**
 * Google Maps Enrichment via FireCrawl
 *
 * For groomers without websites, scrape their Google Maps listing
 * to pull: phone, address, hours, rating, review count, images, and basic info.
 *
 * Strategy: Search Google Maps for "{name} {city} {state} pet grooming"
 * then scrape the resulting Google Maps page via FireCrawl.
 *
 * Usage:
 *   node scripts/google-maps-enrich.js [--limit N] [--resume]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const ENRICHED_FILE = path.join(DATA_DIR, 'groomers_enriched.json');
const PROGRESS_FILE = path.join(DATA_DIR, '.gmaps_progress.json');

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape';
const RATE_LIMIT_MS = 2500; // slightly slower for maps searches
const SAVE_INTERVAL = 5;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let limit = Infinity;
let resume = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--resume') {
    resume = true;
  }
}

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}
loadEnv();

const API_KEY = process.env.FIRECRAWL_API_KEY;
if (!API_KEY) {
  console.error('Error: FIRECRAWL_API_KEY not set');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// FireCrawl API
// ---------------------------------------------------------------------------
function scrapeUrl(url) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      url: url,
      formats: ['markdown'],
      waitFor: 3000,
    });

    const parsed = new URL(FIRECRAWL_API_URL);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error('API ' + res.statusCode + ': ' + (json.error || json.message || data.slice(0, 200))));
          }
        } catch (e) {
          reject(new Error('Parse error: ' + data.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Google Maps search URL builder
// ---------------------------------------------------------------------------
function buildGoogleMapsSearchUrl(name, city, state) {
  const query = encodeURIComponent(name + ' ' + (city || '') + ' ' + (state || '') + ' pet grooming');
  return 'https://www.google.com/maps/search/' + query;
}

// ---------------------------------------------------------------------------
// Extract data from Google Maps markdown
// ---------------------------------------------------------------------------
function extractFromMapsMarkdown(md, groomer) {
  if (!md) return {};
  const result = {};
  const lower = md.toLowerCase();

  // Phone number extraction - look for patterns near the business name
  const phonePatterns = [
    /\((\d{3})\)\s*(\d{3})[-.](\d{4})/g,
    /(\d{3})[-.](\d{3})[-.](\d{4})/g,
    /\+1[-.\s]?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/g,
  ];
  const phones = [];
  for (const pattern of phonePatterns) {
    let match;
    while ((match = pattern.exec(md)) !== null) {
      phones.push(match[0]);
    }
  }
  if (phones.length > 0) {
    result.phone = phones[0];
  }

  // Rating extraction - "4.5 stars" or "4.5(123)" or "Rating: 4.5"
  const ratingMatch = md.match(/(\d\.\d)\s*(?:\((\d+)\)|\s*star|\s*rating)/i)
    || md.match(/rating[:\s]*(\d\.\d)/i)
    || md.match(/(\d\.\d)\s*\((\d[\d,]*)\s*(?:review|rating)/i);
  if (ratingMatch) {
    result.rating = parseFloat(ratingMatch[1]);
    if (ratingMatch[2]) {
      result.review_count = parseInt(ratingMatch[2].replace(/,/g, ''), 10);
    }
  }

  // Review count if not found above
  if (!result.review_count) {
    const reviewMatch = md.match(/(\d[\d,]*)\s*(?:review|rating|opinion)/i);
    if (reviewMatch) {
      result.review_count = parseInt(reviewMatch[1].replace(/,/g, ''), 10);
    }
  }

  // Address extraction - look for street address patterns
  const addrMatch = md.match(/(\d+\s+[\w\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl|Hwy|Pike|Circle|Loop)[\w\s]*(?:#\s*\w+)?)[,\n]/i);
  if (addrMatch && !groomer.address) {
    result.address = addrMatch[1].trim();
  }

  // Hours extraction
  const hoursData = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const day of dayNames) {
    // Pattern: "Monday: 9 AM–5 PM" or "Monday 9:00 AM - 5:00 PM" or "Mon: 9AM-5PM"
    const dayShort = day.slice(0, 3);
    const hourRegex = new RegExp(
      '(?:' + day + '|' + dayShort + ')\\s*[:\\s]\\s*' +
      '(\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM|am|pm))\\s*' +
      '[-–—to]+\\s*' +
      '(\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM|am|pm))',
      'i'
    );
    const closedRegex = new RegExp('(?:' + day + '|' + dayShort + ')\\s*[:\\s]\\s*(?:Closed|closed|CLOSED)', 'i');

    const hourMatch = md.match(hourRegex);
    const closedMatch = md.match(closedRegex);

    if (hourMatch) {
      hoursData.push({
        day: day,
        open: normalizeTime(hourMatch[1]),
        close: normalizeTime(hourMatch[2]),
        closed: false,
      });
    } else if (closedMatch) {
      hoursData.push({ day: day, open: '', close: '', closed: true });
    }
  }
  if (hoursData.length > 0) {
    result.hours = hoursData;

    // Detect early/late hours
    for (const h of hoursData) {
      if (!h.closed && h.open) {
        const openHour = parseHour(h.open);
        const closeHour = parseHour(h.close);
        if (openHour !== null && openHour <= 7) result.early_hours = true;
        if (closeHour !== null && closeHour >= 19) result.late_hours = true;
      }
    }
  }

  // Website extraction from maps listing
  if (!groomer.website) {
    const webMatch = md.match(/(?:website|site)[:\s]*(https?:\/\/[^\s\n)]+)/i)
      || md.match(/(https?:\/\/(?:www\.)?(?!google|gstatic|googleapis)[a-z0-9-]+\.[a-z]{2,}[^\s\n)]*)/i);
    if (webMatch) {
      const url = webMatch[1].replace(/[.,;]+$/, '');
      // Filter out Google/Maps URLs
      if (!url.includes('google.com') && !url.includes('gstatic.com') && !url.includes('googleapis.com')) {
        result.website = url;
      }
    }
  }

  // Services/category detection from Maps
  const serviceKeywords = {
    'nail': 'nail trim',
    'bath': 'bath',
    'grooming': 'full groom',
    'boarding': 'boarding',
    'daycare': 'daycare',
    'training': 'training',
    'self-serve': 'self-wash',
    'self serve': 'self-wash',
    'self wash': 'self-wash',
    'mobile': 'mobile grooming',
    'cat': 'cat grooming',
    'feline': 'cat grooming',
  };

  const detectedServices = [];
  for (const [keyword, service] of Object.entries(serviceKeywords)) {
    if (lower.includes(keyword) && !detectedServices.includes(service)) {
      detectedServices.push(service);
    }
  }
  if (detectedServices.length > 0) {
    result.services = detectedServices;
  }

  // Category/specialty detection
  const specialtyKeywords = {
    'all breeds': 'all breeds',
    'small dog': 'small dogs',
    'large dog': 'large dogs',
    'puppy': 'puppy',
    'senior': 'senior pets',
    'anxious': 'anxiety',
    'anxiety': 'anxiety',
    'fear free': 'fear-free',
    'fear-free': 'fear-free',
    'doodle': 'doodles',
    'poodle': 'poodles',
    'cat ': 'cats',
    'feline': 'cats',
    'organic': 'organic products',
    'natural': 'natural products',
    'eco': 'eco-friendly',
    'mobile': 'mobile grooming',
    'walk-in': 'walk-ins',
    'walk in': 'walk-ins',
    'no appointment': 'walk-ins',
  };

  const detectedSpecialties = [];
  for (const [keyword, specialty] of Object.entries(specialtyKeywords)) {
    if (lower.includes(keyword) && !detectedSpecialties.includes(specialty)) {
      detectedSpecialties.push(specialty);
    }
  }
  if (detectedSpecialties.length > 0) {
    result.specialties = detectedSpecialties;
  }

  // Pet types
  const petTypes = [];
  if (lower.includes('dog') || lower.includes('canine') || lower.includes('pup')) petTypes.push('dogs');
  if (lower.includes('cat') || lower.includes('feline') || lower.includes('kitten')) petTypes.push('cats');
  if (petTypes.length > 0) result.pet_types = petTypes;

  // Grooms cats flag
  if (lower.includes('cat grooming') || lower.includes('feline grooming') || lower.includes('cats welcome')) {
    result.grooms_cats = true;
  }

  // Image extraction from Maps
  const imageUrls = [];
  const imgRegex = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?)/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(md)) !== null) {
    const url = imgMatch[1];
    if (!url.includes('google.com/maps') && !url.includes('gstatic') && imageUrls.length < 10) {
      imageUrls.push(url);
    }
  }
  // Also grab Google Maps photo URLs (lh5.googleusercontent.com etc)
  const gPhotoRegex = /(https?:\/\/lh[35]\.googleusercontent\.com\/[^\s"'<>]+)/gi;
  while ((imgMatch = gPhotoRegex.exec(md)) !== null) {
    if (imageUrls.length < 10) imageUrls.push(imgMatch[1]);
  }
  if (imageUrls.length > 0) result.images = imageUrls;

  // Booking URL detection
  const bookingPatterns = [
    /(?:book|schedule|appointment)[^\n]*?(https?:\/\/[^\s\n)]+)/i,
    /(https?:\/\/[^\s\n)]*(?:book|schedule|appointment|reserve)[^\s\n)]*)/i,
    /(https?:\/\/[^\s\n)]*(?:vagaro|gingr|pawfinity|moego|calendly|acuity|square\.site|booksy)[^\s\n)]*)/i,
  ];
  for (const pattern of bookingPatterns) {
    const match = md.match(pattern);
    if (match && match[1] && !match[1].includes('google.com')) {
      result.booking_url = match[1].replace(/[.,;]+$/, '');
      break;
    }
  }

  // Price range detection
  const priceRegex = /\$\s*(\d+(?:\.\d{2})?)/g;
  const prices = [];
  let priceMatch;
  while ((priceMatch = priceRegex.exec(md)) !== null) {
    const p = parseFloat(priceMatch[1]);
    if (p > 5 && p < 500) prices.push(p);
  }
  if (prices.length >= 2) {
    result.price_min = Math.min(...prices);
    result.price_max = Math.max(...prices);
    const avg = (result.price_min + result.price_max) / 2;
    if (avg < 40) result.price_range = '$';
    else if (avg < 80) result.price_range = '$$';
    else result.price_range = '$$$';
    result.transparent_pricing = true;
  }

  // Vaccination detection
  const vaxKeywords = ['rabies', 'bordetella', 'dhpp', 'parvo', 'distemper', 'vaccination', 'vaccine', 'vacc'];
  if (vaxKeywords.some(k => lower.includes(k))) {
    result.vaccination_required = true;
    const vaxList = [];
    if (lower.includes('rabies')) vaxList.push('rabies');
    if (lower.includes('bordetella')) vaxList.push('bordetella');
    if (lower.includes('dhpp') || lower.includes('distemper')) vaxList.push('dhpp');
    if (lower.includes('parvo')) vaxList.push('parvovirus');
    if (vaxList.length > 0) result.vaccinations_list = vaxList;
  }

  // Description - grab first meaningful paragraph
  const paragraphs = md.split(/\n\n+/).filter(p => {
    const cleaned = p.replace(/[#*\[\]()]/g, '').trim();
    return cleaned.length > 30 && cleaned.length < 500 && !cleaned.startsWith('http');
  });
  if (paragraphs.length > 0) {
    const desc = paragraphs[0].replace(/[#*]/g, '').trim();
    if (desc.length > 20) result.description = desc.slice(0, 300);
  }

  return result;
}

function normalizeTime(timeStr) {
  if (!timeStr) return '';
  let t = timeStr.trim().toUpperCase();
  // Ensure space before AM/PM
  t = t.replace(/(AM|PM)/i, ' $1').replace(/\s+/g, ' ').trim();
  // Add :00 if no minutes
  if (/^\d{1,2}\s*(AM|PM)$/i.test(t)) {
    t = t.replace(/(\d{1,2})\s*(AM|PM)/i, '$1:00 $2');
  }
  return t;
}

function parseHour(timeStr) {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Google Maps Enrichment via FireCrawl ===');
  console.log('Date:', new Date().toISOString());
  console.log('Rate limit:', RATE_LIMIT_MS + 'ms\n');

  const enriched = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf-8'));
  console.log('Loaded', enriched.length, 'groomers');

  // Load progress
  let progress = {};
  if (resume && fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    console.log('Resumed with', Object.keys(progress).length, 'already done');
  }

  // Filter to groomers that need maps data
  // Target: no website, OR very sparse data (no phone, no services, no hours)
  const needsMaps = enriched.filter(g => {
    const hasWebsite = g.website && g.website.length > 0;
    const hasRichData = g.services && g.services.length > 2 && g.phone;
    const alreadyMapsScraped = g.scrape_status === 'gmaps_done';
    return !alreadyMapsScraped && !hasRichData && g.name;
  });

  console.log('Groomers needing Maps data:', needsMaps.length);
  const toProcess = needsMaps.slice(0, limit);
  console.log('Processing:', toProcess.length, '\n');

  let scraped = 0;
  let skipped = 0;
  let failed = 0;
  let enrichedCount = 0;
  const errors = [];

  for (let i = 0; i < toProcess.length; i++) {
    const g = toProcess[i];
    const key = g.name + '|' + (g.city || '') + '|' + (g.state || '');

    if (progress[key]) {
      skipped++;
      process.stdout.write('[' + (i + 1) + '/' + toProcess.length + '] SKIP: ' + g.name + '\n');
      continue;
    }

    const city = g.city || '';
    const state = g.state || 'WA';
    const searchUrl = buildGoogleMapsSearchUrl(g.name, city, state);

    process.stdout.write('[' + (i + 1) + '/' + toProcess.length + '] ' + g.name + ' (' + city + ', ' + state + ')');

    try {
      const result = await scrapeUrl(searchUrl);
      const md = result.data && result.data.markdown ? result.data.markdown : '';

      if (md.length < 50) {
        process.stdout.write(' -> thin content (' + md.length + ' chars)\n');
        progress[key] = { status: 'thin', date: new Date().toISOString() };
      } else {
        const extracted = extractFromMapsMarkdown(md, g);
        const dataPoints = Object.keys(extracted).length;

        // Merge extracted data into groomer (don't overwrite existing real data)
        if (extracted.phone && !g.phone) g.phone = extracted.phone;
        if (extracted.rating && !g.rating) g.rating = extracted.rating;
        if (extracted.review_count && !g.review_count) g.review_count = extracted.review_count;
        if (extracted.address && !g.address) g.address = extracted.address;
        if (extracted.website && !g.website) g.website = extracted.website;
        if (extracted.booking_url && !g.booking_url) g.booking_url = extracted.booking_url;
        if (extracted.description && !g.description) g.description = extracted.description;
        if (extracted.price_min && !g.price_min) {
          g.price_min = extracted.price_min;
          g.price_max = extracted.price_max;
          g.price_range = extracted.price_range;
          g.transparent_pricing = true;
        }
        if (extracted.hours && (!g.hours || g.hours.length === 0)) {
          g.hours = extracted.hours;
          if (extracted.early_hours) g.early_hours = true;
          if (extracted.late_hours) g.late_hours = true;
        }
        if (extracted.services && (!g.services || g.services.length === 0)) {
          g.services = extracted.services;
        } else if (extracted.services && g.services) {
          // Merge new services
          for (const s of extracted.services) {
            if (!g.services.includes(s)) g.services.push(s);
          }
        }
        if (extracted.specialties && (!g.specialties || g.specialties.length === 0)) {
          g.specialties = extracted.specialties;
        } else if (extracted.specialties && g.specialties) {
          for (const s of extracted.specialties) {
            if (!g.specialties.includes(s)) g.specialties.push(s);
          }
        }
        if (extracted.pet_types) g.pet_types = extracted.pet_types;
        if (extracted.grooms_cats) g.grooms_cats = true;
        if (extracted.images && (!g.images || g.images.length === 0)) {
          g.images = extracted.images;
        }
        if (extracted.vaccination_required) {
          g.vaccination_required = true;
          g.vaccinations_list = extracted.vaccinations_list;
        }

        g.scrape_status = 'gmaps_done';
        if (dataPoints > 0) enrichedCount++;

        process.stdout.write(' -> ' + dataPoints + ' data points');
        if (extracted.phone) process.stdout.write(', phone');
        if (extracted.rating) process.stdout.write(', rating=' + extracted.rating);
        if (extracted.hours) process.stdout.write(', hours');
        if (extracted.services) process.stdout.write(', ' + extracted.services.length + ' services');
        if (extracted.images) process.stdout.write(', ' + extracted.images.length + ' imgs');
        process.stdout.write('\n');

        progress[key] = { status: 'done', dataPoints, date: new Date().toISOString() };
      }
      scraped++;
    } catch (err) {
      process.stdout.write(' -> ERROR: ' + err.message.slice(0, 80) + '\n');
      errors.push({ name: g.name, error: err.message });
      failed++;
      progress[key] = { status: 'error', error: err.message, date: new Date().toISOString() };
    }

    // Save incrementally
    if ((scraped + failed) % SAVE_INTERVAL === 0) {
      fs.writeFileSync(ENRICHED_FILE, JSON.stringify(enriched, null, 2), 'utf-8');
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
    }

    await sleep(RATE_LIMIT_MS);
  }

  // Final save
  fs.writeFileSync(ENRICHED_FILE, JSON.stringify(enriched, null, 2), 'utf-8');
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');

  console.log('\n=== Complete ===');
  console.log('Scraped:', scraped);
  console.log('Skipped:', skipped);
  console.log('Failed:', failed);
  console.log('Data enriched:', enrichedCount);
  console.log('Output:', ENRICHED_FILE);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log('  - ' + e.name + ': ' + e.error.slice(0, 100)));
  }
}

main().catch(console.error);
