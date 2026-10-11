/**
 * Single Resend sender for every transactional email in the app.
 *
 * Every call logs one structured line with the site, recipient domain, HTTP
 * status and either the Resend message id or the error body, so a lost email
 * can be traced. Callers decide whether a failure is fatal for the user; this
 * module never throws.
 */

export interface SendEmailInput {
  /** Short identifier for the call site, e.g. "quote", "lead", "contact". */
  site: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  /** Extra message headers, e.g. List-Unsubscribe. */
  headers?: Record<string, string>;
  /** Extra identifiers for the log line (listing slug, row id). Never PII. */
  context?: Record<string, string | number | boolean | null | undefined>;
}

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; status?: number };

const SANDBOX_FROM = "GroomLocal <onboarding@resend.dev>";

/** The configured sender. In production a real sender is required. */
export function emailFrom(): string | null {
  const configured = process.env.EMAIL_FROM || process.env.QUOTE_FROM_EMAIL;
  if (configured) return configured;
  // Resend's sandbox sender only delivers to the account owner. Never fall back
  // to it in production, where it would silently drop mail to everyone else.
  return process.env.NODE_ENV === "production" ? null : SANDBOX_FROM;
}

function domainOf(address: string): string {
  const at = address.lastIndexOf("@");
  return at === -1 ? "invalid" : address.slice(at + 1).toLowerCase();
}

function log(level: "info" | "error", fields: Record<string, unknown>) {
  const line = JSON.stringify({ scope: "email", ...fields });
  if (level === "error") console.error(line);
  else console.info(line);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const base = {
    site: input.site,
    toDomains: recipients.map(domainOf),
    ...input.context,
  };

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    log("error", { ...base, ok: false, error: "missing RESEND_API_KEY" });
    return { ok: false, error: "missing RESEND_API_KEY" };
  }
  const from = emailFrom();
  if (!from) {
    log("error", { ...base, ok: false, error: "missing EMAIL_FROM" });
    return { ok: false, error: "missing EMAIL_FROM" };
  }
  if (recipients.length === 0 || recipients.some((r) => !r)) {
    log("error", { ...base, ok: false, error: "missing recipient" });
    return { ok: false, error: "missing recipient" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: input.subject,
        ...(input.html ? { html: input.html } : {}),
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.headers ? { headers: input.headers } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const bodyText = await res.text();
    let parsed: { id?: string; message?: string; name?: string } = {};
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      // Non-JSON body; keep the raw text for the log.
    }
    if (!res.ok) {
      const error = `${parsed.name || "resend_error"}: ${parsed.message || bodyText.slice(0, 200)}`;
      log("error", { ...base, ok: false, status: res.status, error });
      return { ok: false, error, status: res.status };
    }
    const id = parsed.id ?? null;
    log("info", { ...base, ok: true, status: res.status, resendId: id });
    return { ok: true, id };
  } catch (err) {
    const error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    log("error", { ...base, ok: false, error });
    return { ok: false, error };
  }
}
