const d = require("../data/groomers_enriched.json");
console.log("=== ENRICHMENT RESULTS ===");
console.log("Total records:", d.length);
console.log("With real services:", d.filter(g => g.services && g.services.length > 0).length);
console.log("With specialties:", d.filter(g => g.specialties && g.specialties.length > 0).length);
console.log("With images:", d.filter(g => g.images && g.images.length > 0).length);
console.log("With booking URL:", d.filter(g => g.booking_url).length);
console.log("With certifications:", d.filter(g => g.certifications && g.certifications.length > 0).length);
console.log("With pricing:", d.filter(g => g.price_min > 0).length);
console.log("Eco-friendly:", d.filter(g => g.eco_friendly === true).length);
console.log("Grooms cats:", d.filter(g => g.pet_types && g.pet_types.includes("cats")).length);

const allServices = {};
d.forEach(g => { if (g.services) g.services.forEach(s => { allServices[s] = (allServices[s] || 0) + 1; }); });
const topServices = Object.entries(allServices).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log("\nTop 15 services found:");
topServices.forEach(([s, c]) => console.log("  " + s + ": " + c));

const allSpecs = {};
d.forEach(g => { if (g.specialties) g.specialties.forEach(s => { allSpecs[s] = (allSpecs[s] || 0) + 1; }); });
const topSpecs = Object.entries(allSpecs).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log("\nTop 15 specialties found:");
topSpecs.forEach(([s, c]) => console.log("  " + s + ": " + c));

let totalImages = 0;
d.forEach(g => { if (g.images) totalImages += g.images.length; });
console.log("\nTotal images collected:", totalImages);

// By state
const states = {};
d.forEach(g => { const s = g.state || "Unknown"; states[s] = (states[s] || 0) + 1; });
console.log("\nBy state:", JSON.stringify(states));

// Top cities
const cities = {};
d.forEach(g => { const c = g.city || "Unknown"; cities[c] = (cities[c] || 0) + 1; });
const topCities = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log("\nTop 20 cities:");
topCities.forEach(([c, n]) => console.log("  " + c + ": " + n));
