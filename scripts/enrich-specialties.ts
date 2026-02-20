/**
 * One-time data enrichment script: adds new specialty tags to Supabase listings
 * based on heuristic rules matching existing services/specialties.
 *
 * Usage:
 *   npx tsx scripts/enrich-specialties.ts --dry-run   # Preview changes
 *   npx tsx scripts/enrich-specialties.ts              # Apply changes
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY env vars. Load .env.local first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const dryRun = process.argv.includes("--dry-run");

interface Listing {
  id: string;
  name: string;
  services: string[];
  specialties: string[];
}

// Lowercase helper for matching
function has(arr: string[], ...terms: string[]): boolean {
  const lower = arr.map((s) => s.toLowerCase());
  return terms.some((term) => lower.some((s) => s.includes(term)));
}

// Enrichment rules: each rule checks existing data and returns specialties to add
const RULES: { label: string; check: (l: Listing) => boolean; add: string[] }[] = [
  {
    label: "de-shedding/carding → double-coated",
    check: (l) => has(l.services, "de-shedding", "deshedding", "carding"),
    add: ["double-coated"],
  },
  {
    label: "de-matting → matted coats",
    check: (l) => has(l.services, "de-matting", "dematting"),
    add: ["matted coats"],
  },
  {
    label: "breed-specific/hand stripping → breed-specific",
    check: (l) => has(l.services, "breed-specific cuts", "hand stripping", "breed-standard"),
    add: ["breed-specific"],
  },
  {
    label: "organic bath → skin sensitive",
    check: (l) => has(l.services, "organic bath", "all-natural grooming", "medicated bath"),
    add: ["sensitive skin"],
  },
  {
    label: "senior pets → special needs",
    check: (l) => has(l.specialties, "senior pets", "elderly"),
    add: ["special needs"],
  },
  {
    label: "hand stripping/scissoring → breed-specific (terriers alias)",
    check: (l) => has(l.services, "hand stripping", "hand scissoring"),
    add: ["breed-specific"],
  },
  {
    label: "all breeds → double-coated, long coat",
    check: (l) => has(l.specialties, "all breeds"),
    add: ["double-coated", "long coat"],
  },
];

async function main() {
  console.log(`\n${dryRun ? "🔍 DRY RUN" : "🚀 LIVE RUN"} — Enriching specialties...\n`);

  const { data: listings, error } = await supabase
    .from("business_listings")
    .select("id, name, services, specialties");

  if (error || !listings) {
    console.error("Failed to fetch listings:", error?.message);
    process.exit(1);
  }

  console.log(`Fetched ${listings.length} listings\n`);

  let totalUpdates = 0;
  const updates: { id: string; name: string; added: string[]; newSpecialties: string[] }[] = [];

  for (const listing of listings as Listing[]) {
    const currentSpecialties = new Set(listing.specialties ?? []);
    const toAdd = new Set<string>();

    for (const rule of RULES) {
      if (rule.check(listing)) {
        for (const spec of rule.add) {
          if (!currentSpecialties.has(spec)) {
            toAdd.add(spec);
          }
        }
      }
    }

    if (toAdd.size > 0) {
      const newSpecialties = [...currentSpecialties, ...toAdd];
      updates.push({
        id: listing.id,
        name: listing.name,
        added: [...toAdd],
        newSpecialties,
      });
      totalUpdates++;
    }
  }

  // Print summary
  console.log("─── Changes ───\n");
  for (const u of updates) {
    console.log(`  ${u.name}`);
    console.log(`    + ${u.added.join(", ")}`);
  }

  console.log(`\n─── Summary ───`);
  console.log(`  Listings to update: ${totalUpdates} / ${listings.length}`);

  // Count per new specialty
  const counts = new Map<string, number>();
  for (const u of updates) {
    for (const spec of u.added) {
      counts.set(spec, (counts.get(spec) ?? 0) + 1);
    }
  }
  console.log("\n  New specialty coverage:");
  for (const [spec, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${spec}: +${count} listings`);
  }

  if (dryRun) {
    console.log("\n✅ Dry run complete. Run without --dry-run to apply.\n");
    return;
  }

  // Apply updates
  console.log("\nApplying updates...");
  let success = 0;
  let failed = 0;

  for (const u of updates) {
    const { error: updateError } = await supabase
      .from("business_listings")
      .update({ specialties: u.newSpecialties })
      .eq("id", u.id);

    if (updateError) {
      console.error(`  ✗ ${u.name}: ${updateError.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\n✅ Done: ${success} updated, ${failed} failed\n`);
}

main().catch(console.error);
