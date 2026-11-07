const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The field name Turnstile adds to a form it renders inside. JSON callers send the same key. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

export const TURNSTILE_FAILED = "The security check failed. Refresh the page and try again.";

/**
 * Checks a Turnstile token with Cloudflare.
 * No TURNSTILE_SECRET_KEY means Turnstile is off: every request passes.
 * A Cloudflare outage also passes (logged), so forms keep working; the honeypot and rate limit still apply.
 */
export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[]; action?: string };
    if (data.success !== true) {
      console.warn(JSON.stringify({ scope: "turnstile", ok: false, codes: data["error-codes"] ?? [], action: data.action }));
    }
    return data.success === true;
  } catch (err) {
    console.error(JSON.stringify({ scope: "turnstile", ok: false, error: String(err), failOpen: true }));
    return true;
  }
}
