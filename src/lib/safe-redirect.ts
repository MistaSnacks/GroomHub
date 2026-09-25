export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("@") || value.includes("\\")) return fallback;
  // Landing on an auth page after auth loops forever.
  if (/^\/(login|signup|auth|reset-password)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
