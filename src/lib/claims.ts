/**
 * Claim verification rules (pure; no I/O).
 *
 * Most groomers use a Gmail-style address rather than one at their own website, so
 * the default is to approve. A claim goes to the admin queue only when it looks
 * clearly unrelated to the business: a throwaway email address, or an address at
 * some other company's domain. Everything else is approved on the spot, and the rule
 * that approved it is recorded so weak approvals can be reviewed afterwards.
 */

/** Consumer mail and ISP domains. An address here says nothing about who owns the business. */
const PUBLIC_MAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com", "hotmail.com", "outlook.com", "live.com",
  "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "comcast.net", "protonmail.com", "proton.me", "pm.me",
  "mail.com", "gmx.com", "zoho.com", "fastmail.com", "hey.com", "duck.com", "att.net", "sbcglobal.net", "bellsouth.net",
  "verizon.net", "cox.net", "charter.net", "frontier.com", "centurylink.net", "q.com", "earthlink.net", "juno.com",
]);

/** Throwaway inbox services. Nobody manages a real business from one. */
const DISPOSABLE_MAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz", "guerrillamail.de",
  "guerrillamailblock.com", "sharklasers.com", "grr.la", "10minutemail.com", "10minutemail.net", "temp-mail.org",
  "temp-mail.io", "tempmail.com", "tempmail.net", "throwawaymail.com", "yopmail.com", "yopmail.fr", "trashmail.com",
  "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com", "mintemail.com", "mohmal.com", "emailondeck.com",
  "tempail.com", "burnermail.io", "spamgourmet.com", "mailnesia.com", "moakt.com", "tempinbox.com", "discard.email",
  "inboxkitten.com", "anonbox.net",
]);

/** Words that say what kind of business this is, not which one. Ignored when comparing names. */
const GENERIC_NAME_WORDS = new Set([
  "the", "and", "for", "of", "by", "at", "my", "pet", "pets", "dog", "dogs", "cat", "cats", "groom", "grooming",
  "groomer", "groomers", "salon", "spa", "studio", "shop", "boutique", "mobile", "bath", "wash", "care", "service",
  "services", "llc", "inc", "paw", "paws", "pooch", "pup", "pups", "puppy", "doggie", "doggy",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  return !!domain && DISPOSABLE_MAIL_DOMAINS.has(domain);
}

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0) return null;
  return email.slice(at + 1).trim().toLowerCase() || null;
}

function emailLocalPart(email: string): string {
  const at = email.lastIndexOf("@");
  return (at <= 0 ? "" : email.slice(0, at)).split("+")[0].trim().toLowerCase();
}

export function websiteHost(website: string | null | undefined): string | null {
  if (!website) return null;
  try {
    const host = new URL(website.trim()).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/** Compare on the last two labels so "book.happypaws.com" matches "hi@happypaws.com". */
function registrable(host: string): string {
  const parts = host.split(".").filter(Boolean);
  return parts.length <= 2 ? host : parts.slice(-2).join(".");
}

export function emailMatchesWebsite(email: string, website: string | null | undefined): boolean {
  const domain = emailDomain(email);
  const host = websiteHost(website);
  if (!domain || !host) return false;
  if (PUBLIC_MAIL_DOMAINS.has(domain)) return false;
  return registrable(domain) === registrable(host);
}

/** Letters only: "Maria.s_Spaw2024" becomes "mariasspaw". */
function lettersOnly(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

/** The words that make a business name distinctive, e.g. "Maria's Spaw Experience" gives marias, spaw, experience. */
function distinctiveTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !GENERIC_NAME_WORDS.has(t));
}

/** True when `text` (a mailbox name or a domain label) visibly contains or abbreviates the business name. */
export function resemblesBusinessName(text: string, businessName: string | null | undefined): boolean {
  if (!businessName) return false;
  const haystack = lettersOnly(text);
  if (haystack.length < 4) return false;
  const tokens = distinctiveTokens(businessName).map(lettersOnly).filter(Boolean);
  if (tokens.some((t) => haystack.includes(t))) return true;
  // "mariasspaw" spans two words of "Maria's Spaw Experience". Compared against the
  // distinctive words only, so "petgrooming" never matches "Seattle Pet Grooming".
  return haystack.length >= 6 && tokens.join("").includes(haystack);
}

export type ClaimVerification = "domain_match" | "auto_approved" | "admin_review";

/** The specific rule that decided the claim. Stored as `reviewed_by: "system:<rule>"` on automatic approvals. */
export type ClaimRule =
  | "domain_match"
  | "listing_email"
  | "name_match"
  | "webmail"
  | "invalid_email"
  | "disposable"
  | "unrelated_domain";

export interface ClaimDecision {
  verification: ClaimVerification;
  rule: ClaimRule;
  /** Plain-language explanation for the admin when the claim is queued. */
  reason: string;
}

export interface ClaimListingFacts {
  website?: string | null;
  name?: string | null;
  /** The business email already on the listing. */
  email?: string | null;
}

export function decideClaim(email: string, listing: ClaimListingFacts): ClaimDecision {
  const domain = emailDomain(email);
  if (!domain || !domain.includes(".")) {
    return { verification: "admin_review", rule: "invalid_email", reason: "the account email address is not valid" };
  }
  if (DISPOSABLE_MAIL_DOMAINS.has(domain)) {
    return { verification: "admin_review", rule: "disposable", reason: `${domain} is a throwaway email service` };
  }
  if (emailMatchesWebsite(email, listing.website)) {
    return { verification: "domain_match", rule: "domain_match", reason: "email is at the listing website's domain" };
  }
  if (listing.email && listing.email.trim().toLowerCase() === email.trim().toLowerCase()) {
    return { verification: "auto_approved", rule: "listing_email", reason: "email is the business email already on the listing" };
  }
  const webmail = PUBLIC_MAIL_DOMAINS.has(domain);
  const domainLabel = domain.split(".").slice(-2, -1)[0] ?? "";
  if (resemblesBusinessName(emailLocalPart(email), listing.name) || (!webmail && resemblesBusinessName(domainLabel, listing.name))) {
    return { verification: "auto_approved", rule: "name_match", reason: "email contains the business name" };
  }
  if (!webmail) {
    return {
      verification: "admin_review",
      rule: "unrelated_domain",
      reason: `${domain} is a company domain that matches neither the business name nor its website (${listing.website || "none on file"})`,
    };
  }
  return { verification: "auto_approved", rule: "webmail", reason: "personal email with no clear link to the business name" };
}
