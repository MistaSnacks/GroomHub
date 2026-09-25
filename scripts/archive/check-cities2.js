const d = require("../data/groomers_enriched.json");
// Find all unique city values
const cityVals = {};
d.forEach(g => {
  const c = JSON.stringify(g.city);
  cityVals[c] = (cityVals[c] || 0) + 1;
});
console.log("City value distribution:");
Object.entries(cityVals).sort((a,b) => b[1]-a[1]).forEach(([c, n]) => {
  console.log("  " + c + ": " + n);
});

// Check coordinate field names
const sample = d.find(g => g.city === undefined || g.city === null);
if (sample) {
  console.log("\nSample with no city:");
  console.log("  name:", sample.name);
  console.log("  city:", JSON.stringify(sample.city));
  console.log("  lat:", sample.lat, "lon:", sample.lon);
  console.log("  keys:", Object.keys(sample).join(", "));
}

// Check how many have lat > 0
const withLat = d.filter(g => g.lat > 0);
console.log("\nWith lat > 0:", withLat.length);
const withCityEmpty = d.filter(g => g.city === "");
console.log("With city === '':", withCityEmpty.length);
const withCityNull = d.filter(g => g.city === null);
console.log("With city === null:", withCityNull.length);
const withCityUndef = d.filter(g => g.city === undefined);
console.log("With city === undefined:", withCityUndef.length);
