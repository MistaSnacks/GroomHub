import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed unsubscribe links. Any future newsletter send must include
 * `unsubscribeUrl(email)`; the route verifies the signature so nobody can
 * unsubscribe someone else by guessing an address.
 */
function secret(): string | null {
  return process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null;
}

export function unsubscribeToken(email: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("hex");
}

export function unsubscribeUrl(email: string, base = "https://groomlocal.com"): string | null {
  const token = unsubscribeToken(email);
  if (!token) return null;
  const params = new URLSearchParams({ email: email.trim().toLowerCase(), token });
  return `${base}/api/newsletter/unsubscribe?${params.toString()}`;
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (!expected || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
