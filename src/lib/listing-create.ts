import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a live, unclaimed listing from a Get Listed submission. The submitter's
 * email is stored on the listing, so when they make an account with that same email
 * the claim auto-approves (rule "listing_email" in src/lib/claims.ts).
 *
 * No street address or coordinates: many submitters are home-based or mobile and
 * share the address only after booking. The profile page hides the map without them.
 */

export interface NewListingInput {
  business_name: string;
  city: string;
  state: string;
  email: string;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

export type CreateListingResult =
  | { ok: true; slug: string; created: boolean }
  | { ok: false; error: string };

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "seattle", "Port Orchard" -> "Port Orchard". Keeps the owner's capitals if they used any. */
function tidyCity(city: string): string {
  const trimmed = city.trim().replace(/\s+/g, " ");
  if (trimmed !== trimmed.toLowerCase()) return trimmed;
  return trimmed.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Business names often carry the legal suffix; the public name reads better without it. */
function displayName(name: string): string {
  return name.trim().replace(/[,\s]+(llc|l\.l\.c\.|inc\.?|co\.?)$/i, "").trim() || name.trim();
}

function formatPhone(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : phone.trim();
}

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Looks like an online booking page rather than a business website. */
function isBookingUrl(url: string): boolean {
  return /heygoldie|moego|gingr|petexec|square\.site\/book|squareup\.com\/appointments|vagaro|booksy|calendly|acuityscheduling|groomer\.io|daysmart|pawfinity|glossgenius/i.test(url);
}

async function uniqueSlug(admin: SupabaseClient, base: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin.from("business_listings").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createListingFromSubmission(
  admin: SupabaseClient,
  input: NewListingInput,
): Promise<CreateListingResult> {
  const name = displayName(input.business_name);
  const city = tidyCity(input.city);
  const citySlug = slugify(city);
  const state = input.state.toUpperCase();
  if (!name || !citySlug) return { ok: false, error: "missing name or city" };

  // Already in the directory under this name and city: send them to claim it instead.
  const { data: existing } = await admin
    .from("business_listings")
    .select("slug")
    .eq("city_slug", citySlug)
    .eq("state", state)
    .ilike("name", name)
    .maybeSingle();
  if (existing?.slug) return { ok: true, slug: existing.slug as string, created: false };

  // business_listings.city_slug references cities.slug. Add the city if it is new; never touch an existing row.
  const { error: cityError } = await admin.from("cities").upsert(
    {
      slug: citySlug,
      name: city,
      state: state === "WA" ? "Washington" : "Oregon",
      state_abbr: state,
      image: "",
      description: `Find professional pet groomers in ${city}, ${state}.`,
    },
    { onConflict: "slug", ignoreDuplicates: true },
  );
  if (cityError) return { ok: false, error: `city ${cityError.code}: ${cityError.message}` };

  const url = normalizeUrl(input.website);
  const notes = input.notes?.replace(/\r\n/g, "\n").trim() || "";
  const slug = await uniqueSlug(admin, `${slugify(name)}-${citySlug}`);

  const { error } = await admin.from("business_listings").insert({
    id: crypto.randomUUID(),
    slug,
    name,
    description: notes || `Pet grooming in ${city}, ${state}.`,
    short_description: `Pet grooming in ${city}, ${state}`,
    address: "",
    city,
    city_slug: citySlug,
    state,
    zip: "",
    phone: formatPhone(input.phone),
    email: input.email.trim().toLowerCase(),
    website: url && !isBookingUrl(url) ? url : null,
    booking_url: url && isBookingUrl(url) ? url : null,
    price_range: "",
    price_min: 0,
    price_max: 0,
    services: [],
    pet_types: ["dogs"],
    accepts_new_clients: true,
    subscription_tier: "free",
  });
  if (error) return { ok: false, error: `${error.code}: ${error.message}` };
  return { ok: true, slug, created: true };
}
