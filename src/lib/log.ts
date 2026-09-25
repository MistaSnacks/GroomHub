/**
 * One-line JSON logging so Vercel log search can join events by route, slug,
 * user or request. Never pass PII (email addresses, names, message bodies) in
 * `fields`; pass identifiers and error codes.
 */
export type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, scope: string, event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ scope, event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function errorFields(err: unknown): { code?: string; message: string } {
  if (err && typeof err === "object") {
    const e = err as { code?: unknown; message?: unknown; name?: unknown };
    return {
      code: typeof e.code === "string" ? e.code : undefined,
      message: typeof e.message === "string" ? e.message : String(err),
    };
  }
  return { message: String(err) };
}
