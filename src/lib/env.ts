/**
 * Every server-side environment variable the app reads, in one place, with the
 * consequence of leaving it unset. `getEnvReport()` powers /api/health and the
 * boot-time check in src/instrumentation.ts.
 */

export const ENV_VARS = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, effect: "database access" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, effect: "public reads and auth" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, effect: "claims, dashboard writes, leads, quotes" },
  { name: "RESEND_API_KEY", required: false, effect: "every notification email" },
  { name: "EMAIL_FROM", required: false, effect: "sender for every email (falls back to QUOTE_FROM_EMAIL); required in production" },
  { name: "QUOTE_NOTIFY_EMAIL", required: false, effect: "quote request notifications" },
  { name: "LISTING_NOTIFY_EMAIL", required: false, effect: "listing submissions, claim reviews, re-feature cron" },
  { name: "CONTACT_NOTIFY_EMAIL", required: false, effect: "contact form (defaults to hello@groomlocal.com)" },
  { name: "CRON_SECRET", required: false, effect: "daily re-feature cron (401 without it)" },
  { name: "HOUSE_LISTING_SLUG", required: false, effect: "re-feature trigger" },
  { name: "ADMIN_EMAILS", required: false, effect: "admin dashboard access (nobody is admin without it)" },
  { name: "REVALIDATION_SECRET", required: false, effect: "CMS publish webhook (401 without it)" },
  { name: "NEXT_PUBLIC_SNACKBOX_URL", required: false, effect: "CMS visual editing overlay" },
  { name: "NEXT_PUBLIC_SNACKBOX_PROJECT", required: false, effect: "CMS visual editing overlay" },
] as const;

export type EnvName = (typeof ENV_VARS)[number]["name"];

export interface EnvReport {
  ok: boolean;
  missingRequired: EnvName[];
  missingOptional: EnvName[];
  present: Record<EnvName, boolean>;
}

export function getEnvReport(env: NodeJS.ProcessEnv = process.env): EnvReport {
  const present = {} as Record<EnvName, boolean>;
  const missingRequired: EnvName[] = [];
  const missingOptional: EnvName[] = [];
  for (const v of ENV_VARS) {
    const has = Boolean(env[v.name] && String(env[v.name]).trim());
    present[v.name] = has;
    if (!has) (v.required ? missingRequired : missingOptional).push(v.name);
  }
  // A sender is required in production; either name satisfies it.
  if (env.NODE_ENV === "production" && !env.EMAIL_FROM && !env.QUOTE_FROM_EMAIL) {
    missingRequired.push("EMAIL_FROM");
  }
  return { ok: missingRequired.length === 0, missingRequired, missingOptional, present };
}
