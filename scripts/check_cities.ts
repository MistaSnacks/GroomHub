import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("business_listings")
    .select("id, name, city, city_slug, state")
    .eq("state", "OR");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Total in OR:", data?.length);

  const missing = data?.filter(r => !r.city || r.city === "Unknown" || !r.city_slug);
  console.log("Missing city/city_slug:", missing?.length);

  const map = new Map<string, number>();
  for (const row of data || []) {
    if (!row.city || row.city === "Unknown") continue;
    map.set(row.city_slug, (map.get(row.city_slug) || 0) + 1);
  }

  let totalGroomersInCities = 0;
  for (const [slug, count] of map.entries()) {
    totalGroomersInCities += count;
  }
  console.log("Total cities:", map.size);
  console.log("Total groomers in cities:", totalGroomersInCities);
}

run();
