// Website badge for listing owners (pure; the image route is src/app/badge/[file]/route.ts).
//
// Owners paste a link + image into their own site. The image is served per listing
// from groomlocal.com, so each load tells us (through the Referer header) which
// website shows it. The link points at the owner's own profile, which is also the
// page that ranks when people search the business name.

import { BADGE_KICKERS, BADGE_LOGO, BADGE_WORDMARK } from "./badge-art";
import { isSponsored, type SponsorshipFields } from "./listing-rules";

const SITE = "https://groomlocal.com";

export const BADGE_WIDTH = 220;
export const BADGE_HEIGHT = 64;
/** Alt text for the pasted snippet. The image changes with the listing's state, so this must stay true in every state. */
export const BADGE_ALT = "Find us on GroomLocal";

/** A static copy for site builders that only accept uploaded images (Wix, GoDaddy). 2x size. */
export const BADGE_PNG_PATH = "/badges/groomlocal-owner-confirmed.png";
export const BADGE_PNG_URL = `${SITE}${BADGE_PNG_PATH}`;

export type BadgeVariant = "featured" | "confirmed" | "listed";

export function badgeImageUrl(slug: string): string {
  return `${SITE}/badge/${slug}.svg`;
}

/** The link the badge points to. `ref=badge` lets the console count badge clicks; the profile's canonical URL drops it. */
export function badgeLinkUrl(slug: string): string {
  return `${SITE}/groomer/${slug}?ref=badge`;
}

export function badgeSnippet(slug: string): string {
  return `<a href="${badgeLinkUrl(slug)}"><img src="${badgeImageUrl(slug)}" alt="${BADGE_ALT}" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" style="border:0;max-width:100%;height:auto"></a>`;
}

export function textLinkSnippet(slug: string): string {
  return `<a href="${badgeLinkUrl(slug)}">Find us on GroomLocal</a>`;
}

/** "acme-grooming.svg" -> "acme-grooming"; anything else -> null. */
export function slugFromBadgeFile(file: string): string | null {
  const match = /^([a-z0-9-]{1,140})\.svg$/.exec(file);
  return match ? match[1] : null;
}

const OWN_HOSTS = ["groomlocal.com", "localhost", "127.0.0.1", "snackboxcms.com"];

/**
 * The website that loaded the badge, from the Referer header: lowercase, without
 * "www.". Null when there is no usable referer or the load came from our own pages
 * (the dashboard preview, previews on vercel.app), so those never count as installs.
 */
export function badgeHostFromReferer(referer: string | null | undefined): string | null {
  if (!referer) return null;
  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host || host.length > 253 || !host.includes(".")) return null;
  if (OWN_HOSTS.some((own) => host === own || host.endsWith(`.${own}`))) return null;
  if (host.endsWith(".vercel.app")) return null;
  return host;
}

const BORDER = "#E8DDD4";

const BADGE_TITLES: Record<BadgeVariant, string> = {
  featured: "Featured on GroomLocal",
  confirmed: "Owner Confirmed on GroomLocal",
  listed: "Find us on GroomLocal",
};

/** Which badge a listing shows: Featured only while its spot is live, Owner Confirmed once claimed, else Find us. */
export function badgeVariant(listing: SponsorshipFields & { owner_id?: string | null }, now: number = Date.now()): BadgeVariant {
  if (!listing.owner_id) return "listed";
  return isSponsored(listing, now) ? "featured" : "confirmed";
}

/**
 * The badge image (artwork from scripts/build-badge-art.py). No listing data goes into
 * the SVG, so nothing user-supplied is ever rendered. The wording follows the listing's
 * state on every load, so a badge someone already pasted never claims a status it lacks.
 */
export function badgeSvg(variant: BadgeVariant): string {
  const title = BADGE_TITLES[variant];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" viewBox="0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}" role="img" aria-label="${title}"><title>${title}</title><rect x="0.75" y="0.75" width="${BADGE_WIDTH - 1.5}" height="${BADGE_HEIGHT - 1.5}" rx="14" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1.5"/>${BADGE_LOGO}${BADGE_KICKERS[variant]}${BADGE_WORDMARK}</svg>`;
}
