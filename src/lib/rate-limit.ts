/**
 * Per-instance sliding-window rate limiter for public write paths.
 *
 * Serverless instances do not share memory, so this bounds abuse per instance
 * rather than globally. It stops a single loop from burning the Resend quota and
 * is the hook to swap for a shared store (Upstash, Vercel KV) later without
 * touching call sites.
 */

interface Bucket { hits: number[] }
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export interface RateLimitResult { ok: boolean; remaining: number; retryAfterSeconds: number }

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (buckets.size > MAX_KEYS) buckets.clear();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0];
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** Best-effort client address from proxy headers. */
export function clientKey(headers: Headers | { get(name: string): string | null }): string {
  const fwd = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "";
  const ip = fwd.split(",")[0]?.trim();
  return ip || "unknown";
}
