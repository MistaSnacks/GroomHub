const d = require("../data/groomers_enriched.json");
console.log("========================================");
console.log("  MASTER DATASET — FINAL SUMMARY");
console.log("========================================\n");

console.log("TOTAL GROOMERS:", d.length);
console.log("");

// By state
const states = {};
d.forEach(g => { const s = g.state || "Unknown"; states[s] = (states[s] || 0) + 1; });
console.log("BY STATE:");
Object.entries(states).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => {
  console.log("  " + s + ": " + n);
});

// By source
const sources = {};
d.forEach(g => { const s = g.source || "unknown"; sources[s] = (sources[s] || 0) + 1; });
console.log("\nBY SOURCE:");
Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => {
  console.log("  " + s + ": " + n);
});

// All cities
const cities = {};
d.forEach(g => { const c = g.city || "Unknown"; cities[c] = (cities[c] || 0) + 1; });
const sortedCities = Object.entries(cities).sort((a, b) => b[1] - a[1]);
console.log("\nALL " + sortedCities.length + " CITIES:");
sortedCities.forEach(([c, n]) => {
  console.log("  " + c + ": " + n);
});

// Data completeness
console.log("\nDATA COMPLETENESS:");
const fields = [
  ["name", g => g.name && g.name.length > 0],
  ["address", g => g.address && g.address.length > 0],
  ["city", g => g.city && g.city !== "Unknown"],
  ["phone", g => g.phone && g.phone.length > 0],
  ["website", g => g.website && g.website.length > 0],
  ["email", g => g.email && g.email.length > 0],
  ["coordinates", g => g.lat > 0],
  ["description", g => g.description && g.description.length > 20],
  ["services", g => g.services && g.services.length > 0],
  ["specialties", g => g.specialties && g.specialties.length > 0],
  ["images", g => g.images && g.images.length > 0],
  ["hours", g => g.hours && g.hours.length > 0],
  ["pricing", g => g.price_min > 0],
  ["booking_url", g => g.booking_url && g.booking_url.length > 0],
  ["certifications", g => g.certifications && g.certifications.length > 0],
  ["breeds", g => g.breeds && g.breeds.length > 0],
];
fields.forEach(([name, fn]) => {
  const count = d.filter(fn).length;
  const pct = ((count / d.length) * 100).toFixed(0);
  console.log("  " + name.padEnd(16) + ": " + count + "/" + d.length + " (" + pct + "%)");
});

// Enrichment data points
console.log("\nENRICHMENT FLAGS:");
const flags = [
  ["grooms_cats", g => g.pet_types && g.pet_types.includes("cats")],
  ["eco_friendly", g => g.eco_friendly === true],
  ["mobile_grooming", g => g.mobile_grooming === true],
  ["self_wash", g => g.self_wash === true],
  ["walk_ins", g => g.walk_ins_accepted === true],
  ["vaccination_req", g => g.vaccination_required === true],
  ["fear_free", g => g.certifications && g.certifications.some(c => c.toLowerCase().includes("fear"))],
];
flags.forEach(([name, fn]) => {
  console.log("  " + name.padEnd(16) + ": " + d.filter(fn).length);
});

// Total images
let totalImages = 0;
d.forEach(g => { if (g.images) totalImages += g.images.length; });
console.log("\nTOTAL IMAGES COLLECTED:", totalImages);

// All services found
const allServices = {};
d.forEach(g => { if (g.services) g.services.forEach(s => { allServices[s] = (allServices[s] || 0) + 1; }); });
const topServices = Object.entries(allServices).sort((a, b) => b[1] - a[1]);
console.log("\nALL SERVICES FOUND (" + topServices.length + " unique):");
topServices.forEach(([s, c]) => console.log("  " + s + ": " + c));

// All specialties found
const allSpecs = {};
d.forEach(g => { if (g.specialties) g.specialties.forEach(s => { allSpecs[s] = (allSpecs[s] || 0) + 1; }); });
const topSpecs = Object.entries(allSpecs).sort((a, b) => b[1] - a[1]);
console.log("\nALL SPECIALTIES FOUND (" + topSpecs.length + " unique):");
topSpecs.forEach(([s, c]) => console.log("  " + s + ": " + c));
