const fs = require("fs");
const https = require("https");
const env = {};
for (const line of fs.readFileSync(__dirname + "/../.env.local", "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t[0] === "#") continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const key = env.SUPABASE_SERVICE_ROLE_KEY;
console.log("Service key exists:", !!key);
console.log("Key length:", key ? key.length : 0);

// Test GET with service key
const url = new URL("/rest/v1/business_listings?select=id&limit=1", env.NEXT_PUBLIC_SUPABASE_URL);
const req = https.request({
  hostname: url.hostname, port: 443, path: url.pathname + url.search, method: "GET",
  headers: { apikey: key, Authorization: "Bearer " + key },
}, (res) => {
  let d = "";
  res.on("data", (c) => { d += c; });
  res.on("end", () => {
    console.log("GET Status:", res.statusCode);
    console.log("Response:", d.slice(0, 200));

    // Now test INSERT
    const testRecord = JSON.stringify({
      id: "test-service-key-" + Date.now(),
      slug: "test-service-key-delete-me",
      name: "TEST DELETE ME",
      description: "test",
      short_description: "test",
      address: "test",
      city: "Test",
      city_slug: "test",
      state: "WA",
      zip: "00000",
      phone: "",
      website: "",
      rating: 0,
      review_count: 0,
      price_range: "",
      price_min: 0,
      price_max: 0,
      transparent_pricing: false,
      grooms_cats: false,
      accepts_new_clients: false,
      services: [],
      service_categories: [],
      pet_types: [],
      hours: [],
      images: [],
      badges: [],
      is_featured: false,
      is_paw_verified: false,
      is_best_in_show: false,
      specialties: [],
      breeds: [],
      lat: 0,
      lng: 0,
    });

    const postUrl = new URL("/rest/v1/business_listings", env.NEXT_PUBLIC_SUPABASE_URL);
    const postReq = https.request({
      hostname: postUrl.hostname, port: 443, path: postUrl.pathname, method: "POST",
      headers: {
        apikey: key, Authorization: "Bearer " + key,
        "Content-Type": "application/json", Prefer: "return=minimal",
        "Content-Length": String(Buffer.byteLength(testRecord)),
      },
    }, (postRes) => {
      let pd = "";
      postRes.on("data", (c) => { pd += c; });
      postRes.on("end", () => {
        console.log("POST Status:", postRes.statusCode);
        console.log("POST Response:", pd.slice(0, 200));

        if (postRes.statusCode <= 299) {
          // Clean up - delete the test record
          const delUrl = new URL("/rest/v1/business_listings?slug=eq.test-service-key-delete-me", env.NEXT_PUBLIC_SUPABASE_URL);
          const delReq = https.request({
            hostname: delUrl.hostname, port: 443, path: delUrl.pathname + delUrl.search, method: "DELETE",
            headers: { apikey: key, Authorization: "Bearer " + key },
          }, (delRes) => {
            console.log("DELETE cleanup:", delRes.statusCode);
          });
          delReq.end();
        }
      });
    });
    postReq.write(testRecord);
    postReq.end();
  });
});
req.end();
