const d = require("../data/groomers_enriched.json");
const gmapsDone = d.filter(g => g.scrape_status === "gmaps_done");
console.log("Google Maps enriched:", gmapsDone.length, "\n");
gmapsDone.forEach(g => {
  console.log("=== " + g.name + " (" + (g.city || "?") + ", " + g.state + ") ===");
  console.log("  Phone:", g.phone || "none");
  console.log("  Rating:", g.rating || "none", "| Reviews:", g.review_count || "none");
  console.log("  Address:", g.address || "none");
  console.log("  Website:", g.website || "none");
  console.log("  Services:", JSON.stringify(g.services));
  console.log("  Specialties:", JSON.stringify(g.specialties));
  console.log("  Pet types:", JSON.stringify(g.pet_types));
  console.log("  Hours:", g.hours ? g.hours.length + " days" : "none");
  console.log("  Images:", g.images ? g.images.length : 0);
  console.log("  Description:", (g.description || "").slice(0, 80));
  console.log("");
});
