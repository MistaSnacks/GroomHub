import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type CityRow = {
  slug: string;
  name: string;
  state: string;
  state_abbr: string;
  groomer_count: number;
  image?: string | null;
  description?: string | null;
  popular_breeds?: string[] | null;
};

function plainSlug(slug: string): string {
  return slug.replace(/-(wa|or)$/i, "");
}

function stateAwareCitySlug(citySlug: string, stateAbbr: string): string {
  return `${plainSlug(citySlug)}-${stateAbbr.toLowerCase()}`;
}

async function fetchAllListings() {
  const pageSize = 1000;
  let from = 0;
  const rows: Array<{ city: string | null; city_slug: string | null; state: string }> = [];

  while (true) {
    const { data, error } = await supabase
      .from("business_listings")
      .select("city, city_slug, state")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load business_listings:", error.message);
      process.exit(1);
    }

    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function fetchExistingCities() {
  const pageSize = 1000;
  let from = 0;
  const rows: CityRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("cities")
      .select("slug, name, state, state_abbr, groomer_count, image, description, popular_breeds")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load cities:", error.message);
      process.exit(1);
    }

    rows.push(...((data ?? []) as CityRow[]));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const [listings, existingCities] = await Promise.all([
    fetchAllListings(),
    fetchExistingCities(),
  ]);

  const existingByStateAndPlainSlug = new Map<string, CityRow>();
  for (const row of existingCities) {
    existingByStateAndPlainSlug.set(
      `${row.state_abbr}:${plainSlug(row.slug)}`,
      row
    );
  }

  const aggregated = new Map<
    string,
    { slug: string; name: string; state: string; state_abbr: string; groomer_count: number }
  >();

  for (const row of listings) {
    if (!row.city || row.city === "Unknown" || !row.city_slug) continue;
    const stateAbbr = row.state.toUpperCase();
    const plain = plainSlug(row.city_slug);
    const key = `${stateAbbr}:${plain}`;
    const existing = aggregated.get(key);

    if (existing) {
      existing.groomer_count += 1;
      continue;
    }

    aggregated.set(key, {
      slug: stateAwareCitySlug(plain, stateAbbr),
      name: row.city,
      state: stateAbbr === "WA" ? "Washington" : stateAbbr === "OR" ? "Oregon" : row.state,
      state_abbr: stateAbbr,
      groomer_count: 1,
    });
  }

  const upserts = [...aggregated.entries()].map(([key, row]) => {
    const existing = existingByStateAndPlainSlug.get(key);
    return {
      slug: row.slug,
      name: row.name,
      state: row.state,
      state_abbr: row.state_abbr,
      groomer_count: row.groomer_count,
      image: existing?.image ?? "",
      description:
        existing?.description ??
        `Find professional pet groomers in ${row.name}, ${row.state_abbr}.`,
      popular_breeds: existing?.popular_breeds ?? [],
    };
  });

  const staleSlugs = existingCities
    .filter((row) => !aggregated.has(`${row.state_abbr}:${plainSlug(row.slug)}`))
    .map((row) => row.slug);

  console.log(
    JSON.stringify(
      {
        upserts: upserts.length,
        staleSlugs,
        sample: upserts.slice(0, 10),
      },
      null,
      2
    )
  );

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    return;
  }

  const batchSize = 100;
  for (let i = 0; i < upserts.length; i += batchSize) {
    const batch = upserts.slice(i, i + batchSize);
    const { error } = await supabase
      .from("cities")
      .upsert(batch, { onConflict: "slug" });

    if (error) {
      console.error("Cities upsert failed:", error.message);
      process.exit(1);
    }
  }

  if (staleSlugs.length > 0) {
    const { error } = await supabase.from("cities").delete().in("slug", staleSlugs);
    if (error) {
      console.error("Failed to remove stale cities:", error.message);
      process.exit(1);
    }
  }

  console.log("\nSynchronized cities table with state-aware slugs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
