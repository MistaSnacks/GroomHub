import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Schedule and opt-out links for owner emails (pure; no I/O).
 *
 * Every owner gets one approval email when a claim is accepted. If the profile is
 * still thin they then get at most MAX_REMINDERS reminders: the first
 * FIRST_REMINDER_AFTER_DAYS after the last email, the rest REMINDER_EVERY_DAYS apart.
 */

export const FIRST_REMINDER_AFTER_DAYS = 3;
export const REMINDER_EVERY_DAYS = 7;
export const MAX_REMINDERS = 3;

export type OwnerEmailKind = "claim_approved" | "profile_reminder" | "monthly_report";

export interface OwnerEmailEvent {
  kind: OwnerEmailKind;
  sent_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReminderDecision =
  | { due: true; sequence: number }
  | { due: false; reason: "not_claimed" | "max_reached" | "too_soon" };

export function reminderDecision(opts: {
  claimedAt: string | null | undefined;
  events: OwnerEmailEvent[];
  now?: Date;
}): ReminderDecision {
  const now = (opts.now ?? new Date()).getTime();
  const claimed = opts.claimedAt ? Date.parse(opts.claimedAt) : NaN;
  if (Number.isNaN(claimed)) return { due: false, reason: "not_claimed" };

  const reminders = opts.events.filter((e) => e.kind === "profile_reminder");
  if (reminders.length >= MAX_REMINDERS) return { due: false, reason: "max_reached" };

  const lastTouch = Math.max(claimed, ...opts.events.map((e) => Date.parse(e.sent_at)).filter((t) => !Number.isNaN(t)));
  const waitDays = reminders.length === 0 ? FIRST_REMINDER_AFTER_DAYS : REMINDER_EVERY_DAYS;
  if (now - lastTouch < waitDays * DAY_MS) return { due: false, reason: "too_soon" };
  return { due: true, sequence: reminders.length + 1 };
}

/** Same signing secret as newsletter links, with a different message prefix so tokens never cross over. */
function secret(): string | null {
  return process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null;
}

export function optOutToken(userId: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(`owner-reminders:${userId.trim().toLowerCase()}`).digest("hex");
}

export function optOutUrl(userId: string, base = "https://groomlocal.com"): string | null {
  const token = optOutToken(userId);
  if (!token) return null;
  const params = new URLSearchParams({ u: userId.trim().toLowerCase(), token });
  return `${base}/api/owner-reminders/unsubscribe?${params.toString()}`;
}

export function verifyOptOutToken(userId: string, token: string): boolean {
  const expected = optOutToken(userId);
  if (!expected || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
