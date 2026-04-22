// Shared FAQ builders for city pages (dog grooming, cat grooming, mobile grooming).

const SEATTLE_METRO = new Set([
  "seattle", "bellevue", "redmond", "kirkland", "renton", "bothell",
  "lynnwood", "shoreline", "burien", "edmonds", "sammamish",
  "mercer island", "issaquah", "woodinville", "kenmore",
]);
const PORTLAND_METRO = new Set([
  "portland", "beaverton", "tigard", "lake oswego", "gresham",
  "hillsboro", "tualatin", "milwaukie", "oregon city", "west linn", "clackamas",
]);
const TACOMA_SOUTH_SOUND = new Set([
  "tacoma", "lakewood", "puyallup", "federal way", "auburn",
  "kent", "olympia", "lacey", "tumwater",
]);
const MIDSIZE_WA = new Set([
  "spokane", "bellingham", "vancouver", "everett", "marysville",
  "yakima", "tri-cities", "walla walla", "kennewick", "richland", "pasco",
]);
const MIDSIZE_OR = new Set([
  "eugene", "salem", "bend", "corvallis", "medford",
  "ashland", "albany", "springfield",
]);
const DRY_CLIMATE_CITIES = new Set([
  "spokane", "yakima", "tri-cities", "kennewick", "richland", "pasco",
  "walla walla", "bend", "medford", "ashland",
]);

export function getCityPriceRange(cityName: string, _stateAbbr: string): string {
  const lower = cityName.toLowerCase();
  if (SEATTLE_METRO.has(lower)) return "$60 to $120";
  if (PORTLAND_METRO.has(lower)) return "$50 to $110";
  if (TACOMA_SOUTH_SOUND.has(lower)) return "$45 to $100";
  if (MIDSIZE_WA.has(lower)) return "$40 to $95";
  if (MIDSIZE_OR.has(lower)) return "$40 to $90";
  return "$35 to $85";
}

function getCatPriceRange(cityName: string): string {
  const lower = cityName.toLowerCase();
  if (SEATTLE_METRO.has(lower)) return "$70 to $150";
  if (PORTLAND_METRO.has(lower)) return "$60 to $140";
  if (TACOMA_SOUTH_SOUND.has(lower)) return "$55 to $130";
  return "$50 to $120";
}

function getMobilePriceRange(cityName: string): string {
  const lower = cityName.toLowerCase();
  if (SEATTLE_METRO.has(lower)) return "$80 to $160";
  if (PORTLAND_METRO.has(lower)) return "$70 to $150";
  if (TACOMA_SOUTH_SOUND.has(lower)) return "$65 to $140";
  return "$60 to $130";
}

function isDryClimate(cityName: string): boolean {
  return DRY_CLIMATE_CITIES.has(cityName.toLowerCase());
}

function groomerCountPhrase(cityName: string, count: number): string {
  if (count >= 10) return `With ${count} groomers in ${cityName}, you have plenty of options to compare.`;
  if (count >= 3) return `${cityName} has ${count} groomers, so consider expanding your search to nearby cities for more options.`;
  const label = count === 1 ? "groomer" : "groomers";
  return `While ${cityName} has ${count} ${label} listed, nearby cities offer additional options to consider.`;
}

export function buildDogGroomingFaqs(
  cityName: string,
  stateAbbr: string,
  groomerCount: number,
  parkCount: number
) {
  const stateName = stateAbbr === "WA" ? "Washington" : "Oregon";
  const priceRange = getCityPriceRange(cityName, stateAbbr);
  const dry = isDryClimate(cityName);

  const frequencyAnswer = dry
    ? "Most dogs should be professionally groomed every 4 to 8 weeks. Dogs with longer coats (Poodles, Shih Tzus, Goldendoodles) need grooming every 4 to 6 weeks. Short-haired breeds can go 8 to 12 weeks between appointments. In drier areas like " + cityName + ", there is less mud buildup, but dust and dry conditions can affect coat health. Regular brushing at home between visits helps prevent matting and keeps your dog's coat in good shape."
    : "Most dogs should be professionally groomed every 4 to 8 weeks. Dogs with longer coats (Poodles, Shih Tzus, Goldendoodles) need grooming every 4 to 6 weeks. Short-haired breeds can go 8 to 12 weeks between appointments. In the Pacific Northwest, dogs often need grooming every 4 to 6 weeks during the rainy months (October through April) due to mud and damp conditions. Regular brushing at home between visits helps prevent matting.";

  return [
    {
      question: `How much does dog grooming cost in ${cityName}?`,
      answer: `Dog grooming in ${cityName}, ${stateName} typically costs ${priceRange} for a standard bath and haircut, depending on your dog's size, breed, and coat condition. Prices may be higher for large breeds or dogs with matted fur. Compare ${groomerCount} groomers on GroomLocal to find the best value.`,
    },
    {
      question: "How often should I groom my dog?",
      answer: frequencyAnswer,
    },
    {
      question: `What should I look for in a dog groomer in ${cityName}?`,
      answer: `Look for groomers with positive reviews, proper certifications, and a clean facility. Ask about their experience with your dog's breed. A good groomer will discuss your preferences before starting and handle your dog with patience. ${groomerCountPhrase(cityName, groomerCount)} Each listing on GroomLocal includes service details and contact information.`,
    },
    {
      question: `Are there mobile dog groomers in ${cityName}?`,
      answer: `Yes, several groomers in ${cityName}, ${stateAbbr} offer mobile grooming services. Mobile groomers come to your home in a fully equipped van, which is convenient for busy pet owners or dogs that get anxious at salons. Check individual listings on GroomLocal for mobile availability.`,
    },
    {
      question: "What grooming services do most groomers offer?",
      answer: "Most professional groomers offer bath and blow-dry, haircut and styling, nail trimming, ear cleaning, teeth brushing, and de-shedding treatments. Many also provide add-on services like flea treatments, medicated baths, and anal gland expression. Breed-specific cuts are available at salons with experienced stylists.",
    },
  ];
}

export function buildCatGroomingFaqs(
  cityName: string,
  stateAbbr: string,
  groomerCount: number
) {
  const stateName = stateAbbr === "WA" ? "Washington" : "Oregon";
  const priceRange = getCatPriceRange(cityName);

  return [
    {
      question: `How much does cat grooming cost in ${cityName}?`,
      answer: `Cat grooming in ${cityName}, ${stateName} typically costs ${priceRange}, depending on your cat's coat type, temperament, and the services needed. Long-haired breeds and matted cats may cost more. Browse ${groomerCount} cat-friendly groomers on GroomLocal to compare options.`,
    },
    {
      question: "How often do cats need professional grooming?",
      answer: "Most short-haired cats benefit from professional grooming every 8 to 12 weeks, while long-haired breeds like Persians, Maine Coons, and Ragdolls should be groomed every 4 to 6 weeks. Regular grooming prevents matting, reduces hairballs, and keeps skin healthy. Senior cats or cats that struggle to groom themselves may need more frequent visits.",
    },
    {
      question: `What should I look for in a cat groomer in ${cityName}?`,
      answer: `Look for groomers who specifically handle cats and understand feline body language. Cats stress differently than dogs, so a calm, quiet environment is important. Ask if the groomer has experience with your cat's breed and whether they use cat-safe products. ${groomerCountPhrase(cityName, groomerCount)}`,
    },
    {
      question: "What is a lion cut for cats?",
      answer: "A lion cut involves shaving a cat's body to a short length while leaving the fur on the head, paws, and tail tip long. It is popular for long-haired breeds prone to matting or for cats that overheat in warmer months. A professional groomer can advise whether a lion cut suits your cat's coat type and lifestyle.",
    },
  ];
}

export function buildMobileGroomingFaqs(
  cityName: string,
  stateAbbr: string,
  groomerCount: number
) {
  const stateName = stateAbbr === "WA" ? "Washington" : "Oregon";
  const priceRange = getMobilePriceRange(cityName);

  return [
    {
      question: `How much does mobile grooming cost in ${cityName}?`,
      answer: `Mobile grooming in ${cityName}, ${stateName} typically costs ${priceRange} for a full groom, depending on your pet's size and coat type. Mobile services tend to be slightly higher than salon prices because of the convenience and one-on-one attention. Browse ${groomerCount} mobile groomers on GroomLocal to compare pricing.`,
    },
    {
      question: "How does mobile pet grooming work?",
      answer: "A mobile groomer arrives at your home in a fully equipped van or trailer with a tub, dryer, grooming table, and all supplies needed. Your pet is groomed one-on-one without other animals around, which reduces stress. Most appointments take 1 to 2 hours depending on the service. You will need to provide access to a power outlet and water hookup, though many vans are self-contained.",
    },
    {
      question: `Is mobile grooming safe for my pet?`,
      answer: "Yes, mobile grooming is generally safe and often less stressful than salon visits. Your pet gets individual attention without exposure to other animals, cage time, or unfamiliar environments. Reputable mobile groomers carry insurance and follow safety protocols. Check each groomer's credentials and reviews on GroomLocal before booking.",
    },
    {
      question: "How far in advance should I book a mobile groomer?",
      answer: "Mobile groomers are in high demand and often book 1 to 3 weeks in advance, especially in busy metro areas. During peak seasons (spring shedding, holiday prep), booking 3 to 4 weeks ahead is common. Some mobile groomers offer recurring appointment slots for regular clients, which guarantees your preferred time.",
    },
  ];
}
