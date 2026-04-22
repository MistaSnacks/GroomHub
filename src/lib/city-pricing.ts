// Per-size pricing breakdown by metro area and service type.

interface PriceRange {
  min: number;
  max: number;
}

export interface PricingBreakdown {
  small: PriceRange;
  medium: PriceRange;
  large: PriceRange;
}

type ServiceType = "dog-grooming" | "cat-grooming" | "mobile-grooming";

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

// Base prices: [small, medium, large] as [min, max] pairs
const DOG_GROOMING_PRICES = {
  seattle:  { small: { min: 45, max: 80 },  medium: { min: 65, max: 110 }, large: { min: 85, max: 150 } },
  portland: { small: { min: 40, max: 70 },  medium: { min: 55, max: 100 }, large: { min: 75, max: 140 } },
  tacoma:   { small: { min: 35, max: 65 },  medium: { min: 50, max: 90 },  large: { min: 70, max: 130 } },
  default:  { small: { min: 30, max: 60 },  medium: { min: 45, max: 85 },  large: { min: 60, max: 120 } },
};

const CAT_GROOMING_PRICES = {
  seattle:  { small: { min: 55, max: 90 },  medium: { min: 70, max: 120 }, large: { min: 90, max: 160 } },
  portland: { small: { min: 50, max: 85 },  medium: { min: 65, max: 110 }, large: { min: 80, max: 150 } },
  tacoma:   { small: { min: 45, max: 75 },  medium: { min: 55, max: 100 }, large: { min: 70, max: 135 } },
  default:  { small: { min: 40, max: 70 },  medium: { min: 50, max: 95 },  large: { min: 65, max: 130 } },
};

const MOBILE_GROOMING_PRICES = {
  seattle:  { small: { min: 65, max: 100 }, medium: { min: 85, max: 140 }, large: { min: 110, max: 180 } },
  portland: { small: { min: 55, max: 90 },  medium: { min: 75, max: 130 }, large: { min: 95, max: 165 } },
  tacoma:   { small: { min: 50, max: 85 },  medium: { min: 65, max: 120 }, large: { min: 85, max: 150 } },
  default:  { small: { min: 45, max: 80 },  medium: { min: 60, max: 110 }, large: { min: 80, max: 145 } },
};

function getMetroTier(cityName: string): "seattle" | "portland" | "tacoma" | "default" {
  const lower = cityName.toLowerCase();
  if (SEATTLE_METRO.has(lower)) return "seattle";
  if (PORTLAND_METRO.has(lower)) return "portland";
  if (TACOMA_SOUTH_SOUND.has(lower)) return "tacoma";
  return "default";
}

export function getCityPricingBreakdown(
  cityName: string,
  serviceType: ServiceType
): PricingBreakdown {
  const tier = getMetroTier(cityName);

  switch (serviceType) {
    case "cat-grooming":
      return CAT_GROOMING_PRICES[tier];
    case "mobile-grooming":
      return MOBILE_GROOMING_PRICES[tier];
    default:
      return DOG_GROOMING_PRICES[tier];
  }
}
