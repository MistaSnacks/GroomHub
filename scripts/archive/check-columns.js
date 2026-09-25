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
const url = new URL("/rest/v1/business_listings?select=*&limit=1", env.NEXT_PUBLIC_SUPABASE_URL);
const req = https.request({
  hostname: url.hostname, port: 443, path: url.pathname + url.search, method: "GET",
  headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: "Bearer " + env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
}, (res) => {
  let d = "";
  res.on("data", (c) => { d += c; });
  res.on("end", () => {
    const row = JSON.parse(d)[0];
    console.log("Actual DB columns (" + Object.keys(row).length + "):");
    for (const k of Object.keys(row).sort()) {
      console.log("  " + k + ": " + JSON.stringify(row[k]).slice(0, 80));
    }
  });
});
req.end();
