#!/usr/bin/env node

/**
 * scrape-emails.js
 *
 * Crawls websites from business_listings to extract email addresses.
 * Uses curl for reliable HTTP handling (SSL, redirects, timeouts).
 *
 * Usage: node scripts/scrape-emails.js [--limit N] [--city "CityName"]
 */

const { createClient } = require("@supabase/supabase-js");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const OUTPUT_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "scraped-emails.json");
const CSV_FILE = path.join(OUTPUT_DIR, "scraped-emails.csv");

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const IGNORE_DOMAINS = new Set([
  "sentry.io", "wixpress.com", "w3.org", "schema.org", "googleapis.com",
  "example.com", "domain.com", "email.com", "yoursite.com", "yourdomain.com",
  "wordpress.org", "wordpress.com", "gravatar.com", "squarespace.com", "wix.com",
  "cloudflare.com", "jquery.com", "fontawesome.com", "google.com", "gstatic.com",
  "twimg.com", "fbcdn.net", "jsdelivr.net",
]);

const CONTACT_PATHS = ["/contact", "/contact-us", "/about", "/about-us"];

function curlFetch(url) {
  try {
    const result = execSync(
      `curl -sL -k --max-time 15 --max-filesize 500000 -A "Mozilla/5.0 (compatible; GroomLocalBot/1.0)" "${url}"`,
      { encoding: "utf8", maxBuffer: 600000, timeout: 20000, stdio: ["pipe", "pipe", "pipe"] }
    );
    return result || "";
  } catch {
    return "";
  }
}

function extractEmails(html) {
  if (!html) return [];
  const decoded = html.replace(/&#64;/g, "@").replace(/&#x40;/g, "@").replace(/\[at\]/gi, "@").replace(/\(at\)/gi, "@");
  const matches = decoded.match(EMAIL_REGEX) || [];
  const unique = [...new Set(matches.map((e) => e.toLowerCase()))];
  return unique.filter((email) => {
    const domain = email.split("@")[1];
    if (IGNORE_DOMAINS.has(domain)) return false;
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js|woff|ttf|eot)$/i.test(email)) return false;
    if (email.includes("noreply") || email.includes("no-reply")) return false;
    return true;
  });
}

function normalizeUrl(raw) {
  let url = raw.trim();
  if (
    url.includes("facebook.com") || url.includes("instagram.com") ||
    url.includes("yelp.com") || url.includes("tiktok.com") ||
    url.includes("petsmart.com") || url.includes("rymaps.xyz")
  ) return null;
  if (!url.startsWith("http")) url = "https://" + url;
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname.replace(/\/+$/, "");
  } catch { return null; }
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const cityIdx = args.indexOf("--city");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 0;
  const cityFilter = cityIdx !== -1 ? args[cityIdx + 1] : null;

  // Load existing results for resume support
  let existing = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8")); } catch {}
    console.log(`Loaded ${Object.keys(existing).length} existing results`);
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  let allListings = [];
  let from = 0;
  while (true) {
    let query = sb.from("business_listings")
      .select("id, name, city, state, website, slug, phone")
      .not("website", "is", null).neq("website", "");
    if (cityFilter) query = query.eq("city", cityFilter);
    const { data } = await query.range(from, from + 999);
    if (!data || data.length === 0) break;
    allListings.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  let listings = allListings
    .map((l) => ({ ...l, normalizedUrl: normalizeUrl(l.website) }))
    .filter((l) => l.normalizedUrl !== null);

  // Skip already-scraped
  let toScrape = listings.filter((l) => !existing[l.id]);

  console.log(`Total with website: ${allListings.length}`);
  console.log(`Scrapable (non-social): ${listings.length}`);
  console.log(`Already scraped: ${listings.length - toScrape.length}`);
  console.log(`To scrape: ${toScrape.length}`);

  if (limit > 0) toScrape = toScrape.slice(0, limit);

  let found = 0, failed = 0, noEmail = 0;

  for (let i = 0; i < toScrape.length; i++) {
    const listing = toScrape[i];
    const baseUrl = listing.normalizedUrl;
    let allEmails = [];

    // Fetch homepage
    const homeHtml = curlFetch(baseUrl);
    if (homeHtml) {
      allEmails.push(...extractEmails(homeHtml));
    }

    // If no emails, try contact pages
    if (allEmails.length === 0 && homeHtml) {
      for (const p of CONTACT_PATHS) {
        const html = curlFetch(baseUrl + p);
        if (html) {
          const emails = extractEmails(html);
          allEmails.push(...emails);
          if (emails.length > 0) break;
        }
      }
    }

    const uniqueEmails = [...new Set(allEmails)];
    const success = homeHtml.length > 0;

    existing[listing.id] = {
      id: listing.id,
      name: listing.name,
      city: listing.city,
      state: listing.state,
      slug: listing.slug,
      phone: listing.phone,
      website: listing.website,
      scrapedEmails: uniqueEmails,
      scrapedAt: new Date().toISOString(),
      success,
    };

    if (uniqueEmails.length > 0) {
      found++;
      console.log(`  [EMAIL] ${listing.name} (${listing.city}): ${uniqueEmails.join(", ")}`);
    } else if (!success) {
      failed++;
    } else {
      noEmail++;
    }

    // Progress every 25
    if ((i + 1) % 25 === 0 || i === toScrape.length - 1) {
      console.log(`  Progress: ${i + 1}/${toScrape.length} | Emails: ${found} | No email: ${noEmail} | Failed: ${failed}`);
      // Save checkpoint
      if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));
    }
  }

  // Final save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));

  // Write CSV
  const allResults = Object.values(existing);
  const withEmails = allResults.filter((r) => r.scrapedEmails && r.scrapedEmails.length > 0);
  const csvRows = ["name,city,state,phone,website,email,slug"];
  withEmails
    .sort((a, b) => a.city.localeCompare(b.city))
    .forEach((r) => {
      r.scrapedEmails.forEach((email) => {
        csvRows.push(
          `"${r.name.replace(/"/g, '""')}","${r.city}","${r.state}","${r.phone || ""}","${r.website}","${email}","${r.slug}"`
        );
      });
    });
  fs.writeFileSync(CSV_FILE, csvRows.join("\n"));

  console.log("\n=== FINAL SUMMARY ===");
  console.log(`Total scraped: ${allResults.length}`);
  console.log(`Found emails: ${withEmails.length} businesses (${csvRows.length - 1} email addresses)`);
  console.log(`No email found: ${allResults.filter((r) => r.success && (!r.scrapedEmails || r.scrapedEmails.length === 0)).length}`);
  console.log(`Failed to fetch: ${allResults.filter((r) => !r.success).length}`);
  console.log(`\nJSON: ${OUTPUT_FILE}`);
  console.log(`CSV:  ${CSV_FILE}`);
}

main().catch(console.error);
