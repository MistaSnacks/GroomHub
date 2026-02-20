#!/usr/bin/env node

/**
 * FireCrawl-based Groomer Data Enrichment Pipeline
 *
 * Reads raw groomer data, scrapes each groomer's website via FireCrawl API v1,
 * extracts enriched data points from the scraped markdown, and outputs
 * enriched JSON data.
 *
 * Usage:
 *   node scripts/firecrawl-enrich.js [--limit N] [--resume]
 *
 * Environment:
 *   FIRECRAWL_API_KEY - required, read from env or .env.local
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const RAW_PRIMARY = path.join(DATA_DIR, 'groomers_wa_or_raw.json');
const RAW_FALLBACK = path.join(PROJECT_ROOT, 'groomers_osm.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'groomers_enriched.json');
const PROGRESS_FILE = path.join(DATA_DIR, '.enrich_progress.json');

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape';
const RATE_LIMIT_MS = 2000; // 1 request per 2 seconds

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let limit = Infinity;
let resume = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    if (isNaN(limit) || limit <= 0) {
      console.error('Error: --limit must be a positive integer');
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--resume') {
    resume = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log('Usage: node firecrawl-enrich.js [--limit N] [--resume]');
    console.log('  --limit N   Only process the first N groomers');
    console.log('  --resume    Skip groomers that were already scraped');
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
// Load environment variables
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
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const API_KEY = process.env.FIRECRAWL_API_KEY;

if (!API_KEY) {
  console.error(
    'Error: FIRECRAWL_API_KEY is not set.\n' +
      'Set it as an environment variable or add it to .env.local'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadRawData() {
  let filePath;
  if (fs.existsSync(RAW_PRIMARY)) {
    filePath = RAW_PRIMARY;
    console.log('Loading raw data from: ' + RAW_PRIMARY);
  } else if (fs.existsSync(RAW_FALLBACK)) {
    filePath = RAW_FALLBACK;
    console.log('Primary file not found, falling back to: ' + RAW_FALLBACK);
  } else {
    console.error('Error: No raw groomer data file found.');
    console.error('  Looked for: ' + RAW_PRIMARY);
    console.error('  Looked for: ' + RAW_FALLBACK);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function loadProgress() {
  if (resume && fs.existsSync(PROGRESS_FILE)) {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(raw);
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

function loadExistingEnriched() {
  if (resume && fs.existsSync(OUTPUT_FILE)) {
    const raw = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    return JSON.parse(raw);
  }
  return [];
}

// ---------------------------------------------------------------------------
// FireCrawl API client
// ---------------------------------------------------------------------------

function scrapeUrl(url) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      url: url,
      formats: ['markdown', 'screenshot'],
    });

    const parsed = new URL(FIRECRAWL_API_URL);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const transport = parsed.protocol === 'https:' ? https : http;
    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(
              new Error(
                'FireCrawl API error ' + res.statusCode + ': ' +
                  (json.error || json.message || data)
              )
            );
          }
        } catch (e) {
          reject(new Error('Failed to parse FireCrawl response: ' + data.slice(0, 500)));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timed out after 60s'));
    });
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Content extraction helpers
// ---------------------------------------------------------------------------

/**
 * Case-insensitive check if any of the keywords appear in the text.
 */
function containsAny(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Extract all matching keywords found in the text.
 */
function findAllMatches(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Try to find a price pattern like $XX or $XX-$XX in the text.
 */
function extractPrices(text) {
  const prices = [];
  const regex = /\$\s*(\d+(?:\.\d{2})?)\s*(?:[-\u2013\u2014]\s*\$?\s*(\d+(?:\.\d{2})?))?/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const low = parseFloat(match[1]);
    const high = match[2] ? parseFloat(match[2]) : null;
    prices.push({
      low: low,
      high: high,
      context: text.slice(
        Math.max(0, match.index - 40),
        match.index + match[0].length + 40
      ).trim(),
    });
  }
  return prices;
}

/**
 * Extract URLs from markdown text.
 */
function extractUrls(text) {
  const urls = [];
  // Markdown link format: [text](url)
  const mdRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    urls.push({ text: match[1], url: match[2] });
  }
  // Bare URLs
  const bareRegex = /(?<!\()(https?:\/\/[^\s)>\]"']+)/g;
  while ((match = bareRegex.exec(text)) !== null) {
    if (!urls.some((u) => u.url === match[1])) {
      urls.push({ text: '', url: match[1] });
    }
  }
  return urls;
}

/**
 * Extract image URLs from markdown.
 */
function extractImageUrls(text) {
  const images = [];
  // Markdown image: ![alt](url)
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = imgRegex.exec(text)) !== null) {
    images.push(match[2]);
  }
  // Also look for common image extensions in URLs
  const urlRegex = /(https?:\/\/[^\s)>\]"']+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s)>\]"']*)?)/gi;
  while ((match = urlRegex.exec(text)) !== null) {
    if (!images.includes(match[1])) {
      images.push(match[1]);
    }
  }
  return images;
}

/**
 * Extract social media links from a set of URLs.
 */
function extractSocialMedia(urls) {
  const social = {};
  const platforms = {
    facebook: ['facebook.com', 'fb.com', 'fb.me'],
    instagram: ['instagram.com', 'instagr.am'],
    twitter: ['twitter.com', 'x.com'],
    tiktok: ['tiktok.com'],
    youtube: ['youtube.com', 'youtu.be'],
    linkedin: ['linkedin.com'],
    yelp: ['yelp.com'],
    nextdoor: ['nextdoor.com'],
    pinterest: ['pinterest.com'],
  };

  for (var i = 0; i < urls.length; i++) {
    var urlObj = urls[i];
    for (const platform of Object.keys(platforms)) {
      var domains = platforms[platform];
      if (domains.some((d) => urlObj.url.toLowerCase().includes(d))) {
        social[platform] = urlObj.url;
      }
    }
  }
  return Object.keys(social).length > 0 ? social : null;
}

/**
 * Try to find a booking URL.
 */
function extractBookingUrl(urls, text) {
  const bookingDomains = [
    'booking', 'appointments', 'schedule', 'book',
    'calendly', 'acuity', 'square.site', 'squareup',
    'vagaro', 'gingr', 'pawfinity', 'moego',
    'petexec', 'thryv', 'genbook', 'timely',
  ];

  for (var i = 0; i < urls.length; i++) {
    var urlEntry = urls[i];
    var lowerUrl = urlEntry.url.toLowerCase();
    var lowerText = (urlEntry.text || '').toLowerCase();
    if (
      bookingDomains.some((d) => lowerUrl.includes(d)) ||
      lowerText.includes('book') ||
      lowerText.includes('schedule') ||
      lowerText.includes('appointment')
    ) {
      return urlEntry.url;
    }
  }

  var bookingMentionRegex = /(?:book|schedule|appointment)[^\n]*?(https?:\/\/[^\s)>\]"']+)/gi;
  var bookMatch = bookingMentionRegex.exec(text);
  if (bookMatch) return bookMatch[1];

  return null;
}

/**
 * Try to extract email addresses from the text.
 */
function extractEmail(text) {
  var emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  var match = emailRegex.exec(text);
  return match ? match[0] : null;
}

/**
 * Try to extract phone numbers from the text.
 */
function extractPhone(text) {
  var phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  var match = phoneRegex.exec(text);
  return match ? match[0] : null;
}

/**
 * Try to find year established.
 */
function extractYearEstablished(text) {
  var patterns = [
    /(?:since|established\s+(?:in\s+)?|founded\s+(?:in\s+)?|est\.?\s*)\s*((?:19|20)\d{2})/i,
    /(?:serving|grooming|in\s+business)\s+(?:since\s+)?((?:19|20)\d{2})/i,
    /((?:19|20)\d{2})\s*[-\u2013\u2014]\s*(?:present|today|now)/i,
    /over\s+(\d+)\s+years/i,
  ];

  for (var i = 0; i < patterns.length; i++) {
    var pattern = patterns[i];
    var match = pattern.exec(text);
    if (match) {
      if (match[0].toLowerCase().includes('over') && match[1]) {
        var years = parseInt(match[1], 10);
        var approxYear = new Date().getFullYear() - years;
        return approxYear;
      }
      var year = parseInt(match[1], 10);
      if (year >= 1950 && year <= new Date().getFullYear()) {
        return year;
      }
    }
  }
  return null;
}

/**
 * Try to find team size mentions.
 */
function extractTeamSize(text) {
  var patterns = [
    /(\d+)\s*(?:groomers?|stylists?|team\s*members?|staff|professionals?|technicians?)/i,
    /team\s+of\s+(\d+)/i,
    /(\d+)\s*(?:[-\u2013\u2014]\s*\d+\s*)?(?:experienced|certified|professional)\s+(?:groomers?|staff)/i,
  ];

  for (var i = 0; i < patterns.length; i++) {
    var match = patterns[i].exec(text);
    if (match) {
      var size = parseInt(match[1], 10);
      if (size >= 1 && size <= 100) {
        return size;
      }
    }
  }
  return null;
}

/**
 * Extract hours of operation info.
 */
function extractHours(text) {
  var hours = {};
  var dayPattern = /(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)/gi;
  var timePattern = /\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi;

  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var days = line.match(dayPattern);
    var times = line.match(timePattern);
    if (days && times && times.length >= 1) {
      for (var j = 0; j < days.length; j++) {
        var day = days[j];
        var normalizedDay = day.slice(0, 3).toLowerCase();
        var dayMap = {
          mon: 'monday', tue: 'tuesday', wed: 'wednesday',
          thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday',
        };
        var fullDay = dayMap[normalizedDay] || normalizedDay;
        hours[fullDay] = times.join(' - ');
      }
    }
  }
  return Object.keys(hours).length > 0 ? hours : null;
}

/**
 * Check for early or late hours.
 */
function checkEarlyLateHours(text) {
  var earlyHours = /(?:open|hours?).*?(?:6|7)\s*(?::00)?\s*am/i.test(text) ||
    /early\s*(?:morning|bird|hours)/i.test(text);
  var lateHours = /(?:open|hours?).*?(?:7|8|9)\s*(?::00)?\s*pm/i.test(text) ||
    /(?:late|evening)\s*(?:hours|appointments?)/i.test(text);
  return { earlyHours: earlyHours, lateHours: lateHours };
}

// ---------------------------------------------------------------------------
// Main extraction from scraped content
// ---------------------------------------------------------------------------

var SERVICE_KEYWORDS = [
  'nail trimming', 'nail trim', 'nail clipping',
  'nail grinding', 'dremel',
  'bath', 'bathing', 'bath & brush', 'bath and brush',
  'full groom', 'full grooming', 'full service groom',
  'deshedding', 'de-shedding', 'deshed', 'furminator',
  'creative grooming', 'creative color', 'color grooming',
  'hand stripping', 'hand strip',
  'teeth brushing', 'teeth cleaning', 'dental cleaning',
  'ear cleaning', 'ear plucking',
  'flea treatment', 'flea bath', 'flea dip',
  'puppy groom', 'puppy cut', 'first groom',
  'sanitary trim', 'sanitary clip',
  'face trim', 'face & feet',
  'blowout', 'blow dry', 'blow-dry',
  'breed cut', 'breed standard', 'breed trim',
  'medicated bath', 'medicated shampoo',
  'de-matting', 'dematting', 'mat removal',
  'anal glands', 'anal gland expression',
  'pawdicure', 'spa treatment', 'spa package',
  'skin treatment', 'hot oil treatment',
  'shedless treatment',
  'express groom', 'express service',
  'cat grooming', 'feline grooming',
  'kennel clip',
  'scissor cut', 'scissoring',
  'carding',
  'conditioning treatment', 'deep conditioning',
  'teeth scaling',
  'cologne', 'bandana', 'bow', 'accessories',
];

var SPECIALTY_KEYWORDS = [
  'anxious dogs', 'anxiety', 'nervous dogs', 'fearful dogs', 'reactive dogs',
  'senior pets', 'senior dogs', 'elderly dogs', 'older dogs',
  'puppies', 'puppy', 'first groom',
  'large breeds', 'large dogs', 'giant breeds', 'xl breeds',
  'small breeds', 'small dogs', 'toy breeds',
  'doodles', 'poodles', 'goldendoodle', 'labradoodle',
  'double coat', 'double-coated',
  'cats', 'feline', 'cat grooming',
  'mixed breeds', 'all breeds',
  'show grooming', 'show dogs', 'conformation',
  'matted', 'matted dogs', 'severely matted',
  'rescue dogs', 'shelter dogs',
  'special needs', 'disabled', 'handicapped',
  'aggressive dogs', 'difficult dogs',
  'thick coats', 'long coats', 'curly coats',
  'terriers', 'sporting breeds', 'working breeds',
  'brachycephalic', 'flat-faced breeds',
];

var CERTIFICATION_KEYWORDS = [
  'fear free', 'fear-free', 'fear free certified',
  'ndgaa', 'national dog groomers association',
  'ipg', 'international professional groomers',
  'certified master groomer', 'cmg',
  'icmg',
  'cpg', 'certified professional groomer',
  'nash academy',
  'paragon school',
  'abc certified', 'animal behavior college',
  'red cross pet first aid', 'pet first aid', 'pet cpr',
  'iscc', 'international society of canine cosmetologists',
  'grooming certification', 'certified groomer',
  'licensed',
];

var PET_TYPE_KEYWORDS = [
  'dogs', 'dog',
  'cats', 'cat', 'feline',
  'rabbits', 'rabbit', 'bunny',
  'guinea pigs', 'guinea pig',
  'ferrets', 'ferret',
  'hamsters', 'hamster',
  'birds', 'bird',
  'reptiles', 'reptile',
  'small animals',
  'exotic pets', 'exotics',
  'horses', 'horse', 'equine',
];

function extractEnrichedData(markdown, screenshotUrl, originalData) {
  if (!markdown || typeof markdown !== 'string') {
    return { scrape_status: 'empty_response' };
  }

  var text = markdown;

  // Services
  var servicesFound = findAllMatches(text, SERVICE_KEYWORDS);
  var servicesSet = {};
  var servicesDeduped = [];
  for (var i = 0; i < servicesFound.length; i++) {
    var svc = servicesFound[i].toLowerCase();
    if (!servicesSet[svc]) {
      servicesSet[svc] = true;
      servicesDeduped.push(svc);
    }
  }

  // Service categories (broader groupings)
  var serviceCategories = [];
  if (containsAny(text, ['bath', 'bathing', 'wash'])) serviceCategories.push('bathing');
  if (containsAny(text, ['full groom', 'full service', 'haircut', 'breed cut'])) serviceCategories.push('full_groom');
  if (containsAny(text, ['nail', 'pawdicure'])) serviceCategories.push('nails');
  if (containsAny(text, ['teeth', 'dental'])) serviceCategories.push('dental');
  if (containsAny(text, ['ear clean', 'ear pluck'])) serviceCategories.push('ears');
  if (containsAny(text, ['deshed', 'de-shed', 'shedless'])) serviceCategories.push('deshedding');
  if (containsAny(text, ['creative', 'color groom'])) serviceCategories.push('creative');
  if (containsAny(text, ['hand strip'])) serviceCategories.push('hand_stripping');
  if (containsAny(text, ['spa', 'treatment', 'conditioning'])) serviceCategories.push('spa');
  if (containsAny(text, ['cat groom', 'feline groom'])) serviceCategories.push('cat_grooming');
  if (containsAny(text, ['mobile'])) serviceCategories.push('mobile');
  if (containsAny(text, ['self wash', 'self-wash', 'self serve', 'diy wash'])) serviceCategories.push('self_wash');

  // Specialties
  var specialtiesFound = findAllMatches(text, SPECIALTY_KEYWORDS);
  var specSet = {};
  var specialties = [];
  for (var si = 0; si < specialtiesFound.length; si++) {
    var sp = specialtiesFound[si].toLowerCase();
    if (!specSet[sp]) {
      specSet[sp] = true;
      specialties.push(sp);
    }
  }

  // Walk-ins
  var walkInsAccepted = containsAny(text, [
    'walk-in', 'walk in', 'walkin', 'no appointment necessary',
    'walk-ins welcome', 'walk ins accepted',
  ]);

  // Vaccination requirements
  var vaccinationRequired = containsAny(text, [
    'vaccination', 'vaccines required', 'proof of vaccination',
    'vaccine', 'rabies', 'bordetella', 'dhpp', 'distemper',
    'up to date on shots', 'up-to-date on vaccinations',
    'immunization',
  ]);
  var vaccinationsList = [];
  if (/rabies/i.test(text)) vaccinationsList.push('rabies');
  if (/bordetella/i.test(text)) vaccinationsList.push('bordetella');
  if (/dhpp|distemper/i.test(text)) vaccinationsList.push('dhpp');
  if (/parvo/i.test(text)) vaccinationsList.push('parvovirus');
  if (/canine influenza|dog flu/i.test(text)) vaccinationsList.push('canine_influenza');
  if (/leptospirosis/i.test(text)) vaccinationsList.push('leptospirosis');

  // Hours
  var hourChecks = checkEarlyLateHours(text);
  var earlyHours = hourChecks.earlyHours;
  var lateHours = hourChecks.lateHours;

  // Mobile grooming
  var mobileGrooming = containsAny(text, [
    'mobile grooming', 'mobile pet', 'we come to you',
    'mobile service', 'grooming van', 'mobile salon',
    'house call', 'at your door', 'at your home',
  ]);

  // Eco-friendly
  var ecoFriendly = containsAny(text, [
    'eco-friendly', 'eco friendly', 'organic', 'natural products',
    'all-natural', 'all natural', 'green products', 'biodegradable',
    'sustainable', 'non-toxic', 'hypoallergenic', 'chemical-free',
    'environmentally friendly', 'earth-friendly',
  ]);

  // Self-wash
  var selfWash = containsAny(text, [
    'self-wash', 'self wash', 'self-serve', 'self serve',
    'diy wash', 'do it yourself', 'wash your own',
    'self-service wash', 'self grooming',
  ]);

  // Pricing
  var pricesFound = extractPrices(text);
  var priceMin = null;
  var priceMax = null;
  var priceRange = null;
  var pricingInfo = [];

  if (pricesFound.length > 0) {
    var allLows = pricesFound.map(function(p) { return p.low; });
    var allHighs = pricesFound.filter(function(p) { return p.high !== null; }).map(function(p) { return p.high; });

    priceMin = Math.min.apply(null, allLows);
    priceMax = allHighs.length > 0
      ? Math.max.apply(null, allHighs.concat(allLows))
      : Math.max.apply(null, allLows);

    if (priceMax <= 40) priceRange = '$';
    else if (priceMax <= 80) priceRange = '$$';
    else if (priceMax <= 120) priceRange = '$$$';
    else priceRange = '$$$$';

    var pricingSlice = pricesFound.slice(0, 20);
    for (var pi = 0; pi < pricingSlice.length; pi++) {
      pricingInfo.push({
        low: pricingSlice[pi].low,
        high: pricingSlice[pi].high,
        context: pricingSlice[pi].context,
      });
    }
  }

  // Images
  var imageUrls = extractImageUrls(text);
  if (screenshotUrl) {
    imageUrls.unshift(screenshotUrl);
  }

  // URLs and social media
  var allUrls = extractUrls(text);
  var socialMedia = extractSocialMedia(allUrls);
  var bookingUrl = extractBookingUrl(allUrls, text);

  // Contact info
  var email = extractEmail(text);
  var phone = extractPhone(text);

  // Year established
  var yearEstablished = extractYearEstablished(text);

  // Team size
  var teamSize = extractTeamSize(text);

  // Certifications
  var certsFound = findAllMatches(text, CERTIFICATION_KEYWORDS);
  var certSet = {};
  var certifications = [];
  for (var ci = 0; ci < certsFound.length; ci++) {
    var cert = certsFound[ci].toLowerCase();
    if (!certSet[cert]) {
      certSet[cert] = true;
      certifications.push(cert);
    }
  }

  // Pet types
  var petTypesFound = findAllMatches(text, PET_TYPE_KEYWORDS);
  var petTypes = [];
  if (petTypesFound.some(function(p) { return /dogs?/i.test(p); })) petTypes.push('dogs');
  if (petTypesFound.some(function(p) { return /cats?|feline/i.test(p); })) petTypes.push('cats');
  if (petTypesFound.some(function(p) { return /rabbits?|bunny/i.test(p); })) petTypes.push('rabbits');
  if (petTypesFound.some(function(p) { return /guinea\s*pigs?/i.test(p); })) petTypes.push('guinea_pigs');
  if (petTypesFound.some(function(p) { return /ferrets?/i.test(p); })) petTypes.push('ferrets');
  if (petTypesFound.some(function(p) { return /hamsters?/i.test(p); })) petTypes.push('hamsters');
  if (petTypesFound.some(function(p) { return /birds?/i.test(p); })) petTypes.push('birds');
  if (petTypesFound.some(function(p) { return /reptiles?/i.test(p); })) petTypes.push('reptiles');
  if (petTypesFound.some(function(p) { return /small\s*animals/i.test(p); })) petTypes.push('small_animals');
  if (petTypesFound.some(function(p) { return /exotic/i.test(p); })) petTypes.push('exotics');

  // If no pet types detected but it is a groomer, assume dogs
  if (petTypes.length === 0) petTypes.push('dogs');

  // Grooms cats
  var groomsCats = petTypes.includes('cats') ||
    containsAny(text, ['cat grooming', 'feline grooming', 'we groom cats', 'cats welcome']);

  // Hours of operation
  var hours = extractHours(text);

  // Description - try to extract first meaningful paragraph
  var description = null;
  var paragraphs = text.split(/\n\n+/);
  for (var di = 0; di < paragraphs.length; di++) {
    var cleaned = paragraphs[di].replace(/[#*\[\]!]/g, '').trim();
    if (cleaned.length > 50 && cleaned.length < 1000 && !cleaned.startsWith('http')) {
      description = cleaned;
      break;
    }
  }

  // Short description
  var shortDescription = null;
  if (description) {
    shortDescription = description.length > 150
      ? description.slice(0, 147) + '...'
      : description;
  }

  // Transparent pricing (if they list prices openly)
  var transparentPricing = pricesFound.length >= 3;

  // Accepts new clients
  var acceptsNewClients = containsAny(text, [
    'accepting new clients', 'new clients welcome', 'booking new',
    'accepting new', 'now accepting', 'open for new',
  ]);
  var notAcceptingNew = containsAny(text, [
    'not accepting new', 'waitlist', 'wait list', 'no new clients',
    'fully booked', 'not taking new',
  ]);

  // Waitlist
  var waitlistStatus = null;
  if (containsAny(text, ['waitlist', 'wait list', 'waiting list'])) {
    waitlistStatus = 'active';
  }

  return {
    scrape_status: 'success',
    services: servicesDeduped.length > 0 ? servicesDeduped : null,
    service_categories: serviceCategories.length > 0 ? serviceCategories : null,
    specialties: specialties.length > 0 ? specialties : null,
    walk_ins_accepted: walkInsAccepted || null,
    vaccination_required: vaccinationRequired || null,
    vaccinations_list: vaccinationsList.length > 0 ? vaccinationsList : null,
    early_hours: earlyHours || null,
    late_hours: lateHours || null,
    mobile_grooming: mobileGrooming || null,
    eco_friendly: ecoFriendly || null,
    self_wash: selfWash || null,
    price_range: priceRange,
    price_min: priceMin,
    price_max: priceMax,
    transparent_pricing: transparentPricing || null,
    pricing_info: pricingInfo.length > 0 ? pricingInfo : null,
    images: imageUrls.length > 0 ? imageUrls : null,
    social_media: socialMedia,
    booking_url: bookingUrl,
    email: email,
    phone_scraped: phone,
    team_size: teamSize,
    year_established: yearEstablished,
    certifications: certifications.length > 0 ? certifications : null,
    pet_types: petTypes.length > 0 ? petTypes : null,
    grooms_cats: groomsCats || null,
    hours: hours,
    description: description,
    short_description: shortDescription,
    accepts_new_clients: notAcceptingNew ? false : (acceptsNewClients || null),
    waitlist_status: waitlistStatus,
  };
}

// ---------------------------------------------------------------------------
// Utility: sleep
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
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
// Main pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== FireCrawl Groomer Enrichment Pipeline ===');
  console.log('Date: ' + new Date().toISOString());
  console.log('Rate limit: ' + RATE_LIMIT_MS + 'ms between requests');
  if (limit < Infinity) console.log('Limit: ' + limit + ' groomers');
  if (resume) console.log('Resume mode: ON');
  console.log('');

  // Load data
  var rawGroomers = loadRawData();
  console.log('Loaded ' + rawGroomers.length + ' groomers from raw data');

  var progress = loadProgress();
  var existingEnriched = loadExistingEnriched();
  var enrichedMap = new Map();

  // Index existing enriched data by name+city for dedup
  for (var ei = 0; ei < existingEnriched.length; ei++) {
    var item = existingEnriched[ei];
    var eKey = item.name + '|||' + item.city;
    enrichedMap.set(eKey, item);
  }

  // Filter to groomers with websites
  var groomersWithWebsite = rawGroomers.filter(function(g) { return g.website && g.website.trim(); });
  var groomersWithoutWebsite = rawGroomers.filter(function(g) { return !g.website || !g.website.trim(); });

  console.log('  ' + groomersWithWebsite.length + ' groomers have websites');
  console.log('  ' + groomersWithoutWebsite.length + ' groomers have no website (will include with base data only)');
  console.log('');

  // Determine which ones to scrape
  var toScrape = groomersWithWebsite.slice(0, limit);
  var scraped = 0;
  var skipped = 0;
  var failed = 0;
  var errors = [];

  for (var idx = 0; idx < toScrape.length; idx++) {
    var groomer = toScrape[idx];
    var key = groomer.name + '|||' + groomer.city;
    var progressKey = groomer.website.trim();

    // Check if already scraped (resume mode)
    if (resume && progress[progressKey]) {
      skipped++;
      console.log('[' + (idx + 1) + '/' + toScrape.length + '] SKIP (already scraped): ' + groomer.name);
      continue;
    }

    console.log('[' + (idx + 1) + '/' + toScrape.length + '] Scraping: ' + groomer.name + ' - ' + groomer.website);

    try {
      var result = await scrapeUrl(groomer.website.trim());

      // Extract data from the FireCrawl response
      var markdown = (result.data && result.data.markdown) || result.markdown || '';
      var screenshotUrl = (result.data && result.data.screenshot) || result.screenshot || null;

      var enriched = extractEnrichedData(markdown, screenshotUrl, groomer);

      // Merge with original data
      var merged = Object.assign({}, {
        // Original fields
        name: groomer.name,
        slug: generateSlug(groomer.name, groomer.city),
        address: groomer.address || null,
        city: groomer.city || null,
        city_slug: groomer.city ? groomer.city.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null,
        state: groomer.state || null,
        zip: groomer.postcode || groomer.zip || null,
        phone: groomer.phone || enriched.phone_scraped || null,
        website: groomer.website || null,
        lat: groomer.lat || null,
        lng: groomer.lon || groomer.lng || null,
        source: 'osm+firecrawl',
      }, enriched, {
        // Override email only if original doesn't have one
        email: groomer.email || enriched.email || null,
        // Metadata
        scraped_at: new Date().toISOString(),
        scrape_url: groomer.website.trim(),
      });

      // Remove temporary field
      delete merged.phone_scraped;

      enrichedMap.set(key, merged);
      progress[progressKey] = { status: 'success', timestamp: new Date().toISOString() };
      scraped++;

      console.log('  -> OK: ' +
        (enriched.services ? enriched.services.length + ' services' : 'no services') + ', ' +
        (enriched.specialties ? enriched.specialties.length + ' specialties' : 'no specialties') + ', ' +
        (enriched.images ? enriched.images.length + ' images' : 'no images'));
    } catch (err) {
      failed++;
      var errorMsg = err.message || String(err);
      errors.push({ name: groomer.name, website: groomer.website, error: errorMsg });
      progress[progressKey] = { status: 'error', error: errorMsg, timestamp: new Date().toISOString() };
      console.log('  -> ERROR: ' + errorMsg);

      // Still include with base data
      var errKey = groomer.name + '|||' + groomer.city;
      if (!enrichedMap.has(errKey)) {
        enrichedMap.set(errKey, {
          name: groomer.name,
          slug: generateSlug(groomer.name, groomer.city),
          address: groomer.address || null,
          city: groomer.city || null,
          city_slug: groomer.city ? groomer.city.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null,
          state: groomer.state || null,
          zip: groomer.postcode || groomer.zip || null,
          phone: groomer.phone || null,
          website: groomer.website || null,
          lat: groomer.lat || null,
          lng: groomer.lon || groomer.lng || null,
          source: 'osm',
          scrape_status: 'error',
          scrape_error: errorMsg,
        });
      }
    }

    // Save progress incrementally
    saveProgress(progress);

    // Save enriched data incrementally (every 5 scrapes or on the last one)
    if (scraped % 5 === 0 || idx === toScrape.length - 1) {
      var allEnrichedIntermediate = Array.from(enrichedMap.values());
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEnrichedIntermediate, null, 2), 'utf-8');
    }

    // Rate limit (skip delay on last item)
    if (idx < toScrape.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Add groomers without websites (base data only)
  for (var nwi = 0; nwi < groomersWithoutWebsite.length; nwi++) {
    var gNoWeb = groomersWithoutWebsite[nwi];
    var nwKey = gNoWeb.name + '|||' + gNoWeb.city;
    if (!enrichedMap.has(nwKey)) {
      enrichedMap.set(nwKey, {
        name: gNoWeb.name,
        slug: generateSlug(gNoWeb.name, gNoWeb.city),
        address: gNoWeb.address || null,
        city: gNoWeb.city || null,
        city_slug: gNoWeb.city ? gNoWeb.city.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null,
        state: gNoWeb.state || null,
        zip: gNoWeb.postcode || gNoWeb.zip || null,
        phone: gNoWeb.phone || null,
        website: null,
        lat: gNoWeb.lat || null,
        lng: gNoWeb.lon || gNoWeb.lng || null,
        source: 'osm',
        scrape_status: 'no_website',
        pet_types: ['dogs'],
      });
    }
  }

  // Final save
  var allEnriched = Array.from(enrichedMap.values());
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEnriched, null, 2), 'utf-8');
  console.log('');
  console.log('=== Pipeline Complete ===');
  console.log('Total groomers in output: ' + allEnriched.length);
  console.log('Scraped: ' + scraped);
  console.log('Skipped (resumed): ' + skipped);
  console.log('Failed: ' + failed);
  console.log('No website: ' + groomersWithoutWebsite.length);
  console.log('Output: ' + OUTPUT_FILE);

  if (errors.length > 0) {
    console.log('');
    console.log('Errors:');
    for (var errIdx = 0; errIdx < errors.length; errIdx++) {
      var e = errors[errIdx];
      console.log('  - ' + e.name + ' (' + e.website + '): ' + e.error);
    }
  }

  // Save error log
  if (errors.length > 0) {
    var errorLogPath = path.join(DATA_DIR, '.enrich_errors.json');
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2), 'utf-8');
    console.log('\nError log saved to: ' + errorLogPath);
  }
}

main().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
