// ─── Tag Taxonomy + Normalization ─────────────────────────
// Maps raw service/specialty strings from Supabase → clean, normalized tag slugs.

export interface TagDefinition {
  slug: string;
  label: string;
  aliases: string[];
  description?: string;
}

// ─── Service Tags (ranked by search volume) ─────────────
export const SERVICE_TAGS: TagDefinition[] = [
  {
    slug: "full-groom",
    label: "Full Groom",
    description: "Complete grooming package including bath, haircut, nail trim, ear cleaning, and styling.",
    aliases: [
      "full groom", "full-service grooming", "full grooming", "full service groom",
      "one-on-one grooming", "full-service mobile grooming", "all-natural grooming",
      "fear-free grooming", "anxiety-adapted cuts", "doodle grooming",
      "luxury grooming", "one-on-one attention",
    ],
  },
  {
    slug: "cat-grooming",
    label: "Cat Grooming",
    description: "Specialized feline grooming with gentle handling, lion cuts, sanitary trims, and mat removal.",
    aliases: ["cat grooming"],
  },
  {
    slug: "nail-care",
    label: "Nail Care",
    description: "Professional nail trimming, grinding, and pawdicure services for dogs of all sizes.",
    aliases: [
      "nail trim", "nail trimming", "nail grinding", "nail clipping", "dremel",
      "pawdicure", "nail trim walk-in",
      "nail trimming (cooperative care)",
    ],
  },
  {
    slug: "dog-bath",
    label: "Dog Bath",
    description: "Thorough bath and brush-out with premium shampoos, conditioning, and blow-dry.",
    aliases: [
      "bath", "bathing", "bath & brush", "bath and brush", "bath & fluff",
      "walk-in bath", "gentle bath", "bath & tidy", "organic bath",
    ],
  },
  {
    slug: "mobile-grooming",
    label: "Mobile Grooming",
    description: "Full-service grooming that comes to your door. Stress-free convenience for you and your pet.",
    aliases: ["mobile grooming", "full-service mobile grooming"],
  },
  {
    slug: "self-wash",
    label: "Self-Wash",
    description: "DIY wash stations with professional-grade tubs, dryers, and supplies provided.",
    aliases: ["self-wash", "self-wash station"],
  },
  {
    slug: "teeth-cleaning",
    label: "Teeth Cleaning",
    description: "Non-anesthetic teeth brushing and cleaning for better dental health and fresher breath.",
    aliases: ["teeth brushing", "teeth cleaning"],
  },
  {
    slug: "deshedding",
    label: "Deshedding",
    description: "Specialized undercoat removal and deshedding treatments to reduce loose fur at home.",
    aliases: [
      "de-shedding", "deshed", "deshedding", "carding",
    ],
  },
  {
    slug: "ear-cleaning",
    label: "Ear Cleaning",
    description: "Gentle ear cleaning and hair removal to prevent infections and keep ears healthy.",
    aliases: ["ear cleaning"],
  },
  {
    slug: "puppy-grooming",
    label: "Puppy Grooming",
    description: "First groom experiences designed to build positive associations with grooming for puppies.",
    aliases: [
      "puppy groom", "puppy first groom", "puppy cut", "first groom",
      "puppy package", "puppy first cut", "puppy socialization grooms",
    ],
  },
  {
    slug: "flea-treatment",
    label: "Flea Treatment",
    description: "Medicated flea and tick baths with specialized shampoos to eliminate parasites.",
    aliases: ["flea treatment", "flea bath", "flea & tick treatment"],
  },
  {
    slug: "hand-stripping",
    label: "Hand Stripping",
    description: "Traditional hand-stripping technique for wire-coated breeds to maintain coat texture.",
    aliases: ["hand stripping", "hand strip", "hand scissoring", "scissoring"],
  },
  {
    slug: "creative-grooming",
    label: "Creative Grooming",
    description: "Pet-safe coloring, artistic styling, and Asian fusion cuts for a unique look.",
    aliases: ["creative grooming", "creative color", "asian fusion style"],
  },
  {
    slug: "boarding",
    label: "Boarding",
    description: "Overnight pet boarding with comfortable accommodations and grooming add-ons.",
    aliases: ["boarding"],
  },
  {
    slug: "daycare",
    label: "Daycare",
    description: "Supervised daytime care with socialization, play time, and optional grooming services.",
    aliases: ["daycare"],
  },
];

// ─── Specialty Tags ─────────────────────────────────────
export const SPECIALTY_TAGS: TagDefinition[] = [
  {
    slug: "doodle-poodle",
    label: "Doodle & Poodle Expert",
    description: "Specialized in curly and wavy coat breeds. Expert dematting, breed-specific cuts, and coat maintenance.",
    aliases: [
      "doodles", "poodles", "doodle breeds", "doodle grooming",
      "goldendoodle", "labradoodle", "bernedoodle", "cockapoo", "maltipoo",
      "standard poodle",
    ],
  },
  {
    slug: "puppy-specialist",
    label: "Puppy Specialist",
    description: "Gentle first-groom experiences designed to socialize puppies and build lifelong grooming confidence.",
    aliases: ["puppy"],
  },
  {
    slug: "fear-free",
    label: "Fear-Free / Anxiety",
    description: "Certified fear-free and cooperative care techniques for anxious, nervous, or reactive pets.",
    aliases: [
      "anxiety", "fear-free", "anxious dogs",
      "cooperative care", "fear-free certified",
    ],
  },
  {
    slug: "large-dogs",
    label: "Large Dogs",
    description: "Equipped for big breeds with oversized tubs, heavy-duty dryers, and experienced handlers.",
    aliases: ["large dogs", "large breeds"],
  },
  {
    slug: "cat-specialist",
    label: "Cat Specialist",
    description: "Feline-focused groomers with quiet environments and cat-specific handling techniques.",
    aliases: ["cats", "feline suite", "dual-species", "cat grooming"],
  },
  {
    slug: "small-dogs",
    label: "Small Dogs",
    description: "Gentle care for toy and small breeds with precise scissoring and delicate handling.",
    aliases: ["small dogs", "small breeds"],
  },
  {
    slug: "senior-pets",
    label: "Senior Pets",
    description: "Patient, low-stress grooming adapted for older pets with joint issues or health concerns.",
    aliases: ["senior pets", "elderly dogs", "senior pet package"],
  },
  {
    slug: "eco-friendly",
    label: "Eco-Friendly",
    description: "Organic and all-natural grooming products that are gentle on pets and the environment.",
    aliases: [
      "eco-friendly", "organic products", "natural products",
      "eco-friendly products", "all-natural products",
    ],
  },
  {
    slug: "double-coat",
    label: "Double Coat Specialist",
    description: "Expert undercoat removal and blow-outs for huskies, malamutes, samoyeds, and other double-coated breeds.",
    aliases: [
      "double-coated", "double coat", "husky", "malamute", "samoyed",
      "undercoat", "blow out", "undercoat removal",
    ],
  },
  {
    slug: "matted-coats",
    label: "De-Matting Specialist",
    description: "Safe, humane dematting techniques for severely tangled or neglected coats.",
    aliases: [
      "de-matting", "dematting", "mat removal", "matted", "matted coats",
      "severe matting",
    ],
  },
  {
    slug: "breed-specific-cuts",
    label: "Breed-Specific Cuts",
    description: "Show-quality breed-standard cuts and styling for terriers, spaniels, poodles, and more.",
    aliases: [
      "breed-specific", "breed-specific cuts", "breed-standard",
      "breed-standard cuts", "breed-specific styling",
      "show grooming", "show prep", "conformation", "terriers",
    ],
  },
  {
    slug: "skin-sensitive",
    label: "Skin Sensitive / Allergy",
    description: "Hypoallergenic products and medicated baths for pets with dermatitis, allergies, or sensitive skin.",
    aliases: [
      "sensitive skin", "skin sensitive", "allergies", "medicated bath",
      "dermatitis", "hypoallergenic",
    ],
  },
  {
    slug: "special-needs",
    label: "Special Needs Pets",
    description: "Experienced with disabled, three-legged, blind, or mobility-impaired pets requiring extra care.",
    aliases: [
      "special needs", "disabled", "three-legged", "blind",
      "wheelchair", "mobility",
    ],
  },
  {
    slug: "reactive-dogs",
    label: "Reactive Dog Handling",
    description: "Trained handlers experienced with reactive, aggressive, or bite-risk dogs in controlled environments.",
    aliases: [
      "reactive dogs", "reactive", "aggressive", "bite risk",
      "difficult dogs",
    ],
  },
  {
    slug: "long-coat",
    label: "Long Coat Expert",
    description: "Skilled in maintaining flowing, silk, and long coats for Shih Tzus, Yorkies, and similar breeds.",
    aliases: [
      "long coat", "long-haired", "shih tzu", "yorkie",
      "afghan hound", "silk coat",
    ],
  },
];

// ─── Feature Tag slugs (derived from boolean fields) ────
export const FEATURE_TAG_SLUGS = [
  "walk-ins-welcome",
  "transparent-pricing",
  "paw-verified",
  "vaccinations-required",
] as const;

export type FeatureTagSlug = (typeof FEATURE_TAG_SLUGS)[number];

export const FEATURE_TAG_LABELS: Record<FeatureTagSlug, string> = {
  "walk-ins-welcome": "Walk-Ins Welcome",
  "transparent-pricing": "Transparent Pricing",
  "paw-verified": "Paw-Verified",
  "vaccinations-required": "Vaccinations Required",
};

// ─── Price Tags ─────────────────────────────────────────
export type PriceTag = "$" | "$$" | "$$$" | "$$$$";

// ─── Alias Lookup Maps (built once at import time) ──────
function buildAliasMap(tags: TagDefinition[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of tags) {
    for (const alias of tag.aliases) {
      map.set(alias.toLowerCase().trim(), tag.slug);
    }
  }
  return map;
}

const serviceAliasMap = buildAliasMap(SERVICE_TAGS);
const specialtyAliasMap = buildAliasMap(SPECIALTY_TAGS);

export function matchServiceTag(raw: string): string | null {
  return serviceAliasMap.get(raw.toLowerCase().trim()) ?? null;
}

export function matchSpecialtyTag(raw: string): string | null {
  return specialtyAliasMap.get(raw.toLowerCase().trim()) ?? null;
}

// ─── Tag Label Lookup ───────────────────────────────────
const serviceSlugToLabel = new Map(SERVICE_TAGS.map((t) => [t.slug, t.label]));
const specialtySlugToLabel = new Map(SPECIALTY_TAGS.map((t) => [t.slug, t.label]));

export function getServiceLabel(slug: string): string {
  return serviceSlugToLabel.get(slug) ?? slug;
}

export function getSpecialtyLabel(slug: string): string {
  return specialtySlugToLabel.get(slug) ?? slug;
}

// ─── Tag Validation & Lookup Helpers ────────────────────
const serviceSlugs = new Set(SERVICE_TAGS.map((t) => t.slug));
const specialtySlugs = new Set(SPECIALTY_TAGS.map((t) => t.slug));

export function isValidServiceSlug(slug: string): boolean {
  return serviceSlugs.has(slug);
}

export function isValidSpecialtySlug(slug: string): boolean {
  return specialtySlugs.has(slug);
}

export function getServiceTag(slug: string): TagDefinition | undefined {
  return SERVICE_TAGS.find((t) => t.slug === slug);
}

export function getSpecialtyTag(slug: string): TagDefinition | undefined {
  return SPECIALTY_TAGS.find((t) => t.slug === slug);
}

// ─── Normalize a listing's raw data → clean tag arrays ──
export interface NormalizedTags {
  service_tags: string[];
  specialty_tags: string[];
  feature_tags: string[];
  price_tag: PriceTag;
}

export function normalizeTags(listing: {
  services?: string[];
  specialties?: string[];
  price_range?: string;
  is_paw_verified?: boolean;
  transparent_pricing?: boolean;
  walk_ins_accepted?: boolean;
  vaccination_required?: boolean;
}): NormalizedTags {
  const serviceSlugs = new Set<string>();
  const specialtySlugs = new Set<string>();
  const featureTags: string[] = [];

  // Match services
  for (const raw of listing.services ?? []) {
    const serviceSlug = matchServiceTag(raw);
    if (serviceSlug) serviceSlugs.add(serviceSlug);

    // Some service names also match specialties (e.g., "cat grooming" → cat-specialist)
    const specSlug = matchSpecialtyTag(raw);
    if (specSlug) specialtySlugs.add(specSlug);
  }

  // Match specialties
  for (const raw of listing.specialties ?? []) {
    const specSlug = matchSpecialtyTag(raw);
    if (specSlug) specialtySlugs.add(specSlug);

    // Some specialties also match service tags
    const serviceSlug = matchServiceTag(raw);
    if (serviceSlug) serviceSlugs.add(serviceSlug);
  }

  // If no service tags matched, default to full-groom
  if (serviceSlugs.size === 0) {
    serviceSlugs.add("full-groom");
  }

  // Feature tags from boolean fields
  if (listing.is_paw_verified) featureTags.push("paw-verified");
  if (listing.transparent_pricing) featureTags.push("transparent-pricing");
  if (listing.walk_ins_accepted) featureTags.push("walk-ins-welcome");
  if (listing.vaccination_required) featureTags.push("vaccinations-required");

  // Price tag
  const priceTag = (listing.price_range as PriceTag) || "$$";

  return {
    service_tags: [...serviceSlugs],
    specialty_tags: [...specialtySlugs],
    feature_tags: featureTags,
    price_tag: priceTag,
  };
}
