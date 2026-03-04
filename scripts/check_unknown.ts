import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("business_listings")
    .select("id, name, address, city, state, services, specialties")
    .in("id", ["mudpuppies-grooming", "foxy-dog"]);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Details:", JSON.stringify(data, null, 2));
}

run();
