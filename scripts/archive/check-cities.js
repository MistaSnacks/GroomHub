const d = require("../data/groomers_enriched.json");
const noCity = d.filter(g => !g.city || g.city === "" || g.city === "Unknown");
const noCityHasCoords = noCity.filter(g => g.lat && g.lat > 0 && g.lon && g.lon !== 0);
const noCityNoCoords = noCity.filter(g => !g.lat || g.lat === 0);
console.log("Total no city:", noCity.length);
console.log("  With valid coords (can geocode):", noCityHasCoords.length);
console.log("  Without coords:", noCityNoCoords.length);
console.log("\nSample with coords:");
noCityHasCoords.slice(0, 5).forEach(g => {
  console.log("  " + g.name + " @ " + g.lat + "," + g.lon + " city=[" + g.city + "]");
});
console.log("\nSample without coords:");
noCityNoCoords.slice(0, 5).forEach(g => {
  console.log("  " + g.name + " addr=" + g.address + " city=[" + g.city + "]");
});
