/**
 * normalize-tags.ts
 * One-time migration script: reads all listings from Supabase,
 * runs normalizeTags(), and writes tag columns back.
 *
 * Usage: npx tsx scripts/normalize-tags.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { normalizeTags } from "../src/lib/tags";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching all listings...");
  const { data: listings, error } = await supabase
    .from("business_listings")
    .select("id, services, specialties, price_range, is_paw_verified, transparent_pricing, walk_ins_accepted, vaccination_required");

  if (error || !listings) {
    console.error("Failed to fetch listings:", error?.message);
    process.exit(1);
  }

  console.log(`Found ${listings.length} listings. Normalizing tags...`);

  let updated = 0;
  let errors = 0;

  for (const listing of listings) {
    const tags = normalizeTags({
      services: listing.services ?? [],
      specialties: listing.specialties ?? [],
      price_range: listing.price_range,
      is_paw_verified: listing.is_paw_verified,
      transparent_pricing: listing.transparent_pricing,
      walk_ins_accepted: listing.walk_ins_accepted,
      vaccination_required: listing.vaccination_required,
    });

    const { error: updateError } = await supabase
      .from("business_listings")
      .update({
        service_tags: tags.service_tags,
        specialty_tags: tags.specialty_tags,
        feature_tags: tags.feature_tags,
        price_tag: tags.price_tag,
      })
      .eq("id", listing.id);

    if (updateError) {
      console.error(`  Error updating ${listing.id}:`, updateError.message);
      errors++;
    } else {
      updated++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}`);
  console.log(`Total: ${listings.length} listings processed`);

  // Verify
  const { data: sample } = await supabase
    .from("business_listings")
    .select("name, service_tags, specialty_tags, feature_tags, price_tag")
    .limit(5);

  if (sample) {
    console.log("\nSample results:");
    for (const row of sample) {
      console.log(`  ${row.name}: services=[${row.service_tags?.join(", ")}] specialties=[${row.specialty_tags?.join(", ")}] features=[${row.feature_tags?.join(", ")}] price=${row.price_tag}`);
    }
  }
}

main();
