/**
 * Claim verification rules (pure; no I/O).
 *
 * A claim is verified automatically when the account email's domain is the same
 * registrable domain as the listing's website. Everything else goes to the admin
 * review queue. Public webmail domains never auto-verify.
 */

const PUBLIC_MAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com", "live.com",
  "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "comcast.net", "protonmail.com", "proton.me",
]);

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0) return null;
  return email.slice(at + 1).trim().toLowerCase() || null;
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

export type ClaimVerification = "domain_match" | "admin_review";

export function decideClaim(email: string, website: string | null | undefined): ClaimVerification {
  return emailMatchesWebsite(email, website) ? "domain_match" : "admin_review";
}
