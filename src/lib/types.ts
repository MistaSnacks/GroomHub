import type { PriceTag } from "./tags";

export interface BusinessListing {
  id: string;
  slug: string;
  name: string;
  description: string;
  short_description: string;
  address: string;
  city: string;
  city_slug: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  email?: string;
  rating: number;
  review_count: number;
  price_range: "$" | "$$" | "$$$";
  price_min: number;
  price_max: number;
  transparent_pricing?: boolean;
  services: string[];
  service_categories: ServiceCategory[];
  pet_types?: ("dog" | "cat" | "other")[];
  grooms_cats?: boolean;
  accepts_new_clients?: boolean;
  walk_ins_accepted?: boolean;
  vaccination_required?: boolean;
  waitlist_status?: "immediate" | "short" | "long" | "closed";
  hours: DayHours[];
  images: string[];
  badges: Badge[];
  is_featured: boolean;
  is_paw_verified: boolean;
  is_best_in_show: boolean;
  year_established: number;
  team_size: number;
  specialties: string[];
  breeds: string[];
  lat: number;
  lng: number;
  booking_url?: string;
  owner_id?: string;
  subscription_tier?: "free" | "standard" | "featured" | "premium";
  claimed_at?: string;
}

/** Listing with normalized tag arrays (post-migration) */
export interface NormalizedListing extends BusinessListing {
  service_tags: string[];
  specialty_tags: string[];
  feature_tags: string[];
  price_tag: PriceTag;
}

export interface Lead {
  id: string;
  listing_id: string;
  sender_name: string;
  sender_email: string;
  sender_phone?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
}

export interface Review {
  id: string;
  businessSlug: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  text: string;
  petName?: string;
  petBreed?: string;
  helpful: number;
}

export interface City {
  slug: string;
  name: string;
  state: string;
  stateAbbr: string;
  groomerCount: number;
  image: string;
  description: string;
  popularBreeds: string[];
}

/** City record from Supabase with listing count */
export interface CityWithCount {
  slug: string;
  name: string;
  state: string;
  state_abbr: string;
  groomer_count: number;
}

export interface PricingTier {
  name: string;
  slug: string;
  price: number;
  annualPrice: number;
  description: string;
  features: PricingFeature[];
  isPopular: boolean;
  ctaText: string;
}

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface SoftwareListing {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  category: SoftwareCategory;
  priceMin: number;
  priceMax: number;
  pricingModel: "monthly" | "annual" | "one-time" | "free";
  rating: number;
  reviewCount: number;
  website: string;
  logo: string;
  features: string[];
  pros: string[];
  cons: string[];
  bestFor: string;
  isFeatured: boolean;
}

export type ServiceCategory =
  | "dog-grooming"
  | "mobile-grooming"
  | "pet-boarding"
  | "dog-walking"
  | "pet-sitting"
  | "dog-training"
  | "veterinary"
  | "pet-daycare"
  | "pet-photography"
  | "pet-bakery"
  | "pet-supplies";

export type SoftwareCategory =
  | "grooming-software"
  | "booking-scheduling"
  | "business-management"
  | "pos-systems"
  | "client-communication"
  | "marketing-tools"
  | "education-courses";

export type Badge = "best-in-show" | "paw-verified" | "top-rated" | "eco-friendly" | "fear-free" | "mobile-ready";

export interface DayHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface QuoteRequest {
  petType: "dog" | "cat" | "other";
  petBreed: string;
  petSize: "small" | "medium" | "large" | "xlarge";
  petName: string;
  services: string[];
  city: string;
  preferredDate: string;
  preferredTime: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
}
