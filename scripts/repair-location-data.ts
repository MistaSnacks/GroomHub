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

type UpdateResolution = {
  action: "update";
  slug: string;
  city: string;
  city_slug: string;
  state: string;
  note: string;
};

type DeleteResolution = {
  action: "delete";
  slug: string;
  note: string;
};

type Resolution = UpdateResolution | DeleteResolution;

const RESOLUTIONS: Resolution[] = [
  {
    action: "update",
    slug: "spotted-dog-pet-grooming",
    city: "Bonney Lake",
    city_slug: "bonney-lake",
    state: "WA",
    note: "Verified by coordinates and matching Bonney Lake address.",
  },
  {
    action: "update",
    slug: "south-hill-dog-grooming",
    city: "Puyallup",
    city_slug: "puyallup",
    state: "WA",
    note: "South Hill address resolves to the Puyallup area.",
  },
  {
    action: "update",
    slug: "pampered-pets",
    city: "Marysville",
    city_slug: "marysville",
    state: "WA",
    note: "Address and phone match the Marysville listing.",
  },
  {
    action: "update",
    slug: "mudpuppies-grooming",
    city: "Milwaukie",
    city_slug: "milwaukie",
    state: "OR",
    note: "Address resolves to Milwaukie, Oregon.",
  },
  {
    action: "delete",
    slug: "foxy-dog",
    note: "Address and coordinates resolve to Minneapolis, Minnesota, not Oregon.",
  },
  {
    action: "delete",
    slug: "total-pet-care-grooming-by-linda",
    note: "Address resolves to Holbrook, New York, not Washington.",
  },
  {
    action: "delete",
    slug: "dog-gone-grooming",
    note: "Address resolves to Sheridan, Wyoming, not Washington.",
  },
];

async function fetchTargets() {
  const slugs = RESOLUTIONS.map((item) => item.slug);
  const { data, error } = await supabase
    .from("business_listings")
    .select("id, slug, name, city, city_slug, state, address, lat, lng")
    .in("slug", slugs)
    .order("slug");

  if (error) {
    console.error("Failed to load target listings:", error.message);
    process.exit(1);
  }

  return data ?? [];
}

async function applyUpdates() {
  const updates = RESOLUTIONS.filter(
    (item): item is UpdateResolution => item.action === "update"
  );
  const deletions = RESOLUTIONS.filter(
    (item): item is DeleteResolution => item.action === "delete"
  );

  for (const item of updates) {
    const { error } = await supabase
      .from("business_listings")
      .update({
        city: item.city,
        city_slug: item.city_slug,
        state: item.state,
      })
      .eq("slug", item.slug);

    if (error) {
      console.error(`Update failed for ${item.slug}:`, error.message);
      process.exit(1);
    }
  }

  if (deletions.length > 0) {
    const { error } = await supabase
      .from("business_listings")
      .delete()
      .in("slug", deletions.map((item) => item.slug));

    if (error) {
      console.error("Delete failed:", error.message);
      process.exit(1);
    }
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await fetchTargets();
  const rowMap = new Map(rows.map((row) => [row.slug, row]));

  console.log("Planned listing repairs:");
  for (const item of RESOLUTIONS) {
    const row = rowMap.get(item.slug);
    console.log(
      JSON.stringify(
        {
          action: item.action,
          slug: item.slug,
          current: row
            ? {
                city: row.city,
                city_slug: row.city_slug,
                state: row.state,
                address: row.address,
                lat: row.lat,
                lng: row.lng,
              }
            : null,
          target:
            item.action === "update"
              ? {
                  city: item.city,
                  city_slug: item.city_slug,
                  state: item.state,
                }
              : "delete",
          note: item.note,
        },
        null,
        2
      )
    );
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    return;
  }

  await applyUpdates();
  console.log("\nApplied location repairs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
