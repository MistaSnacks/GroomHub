import { NextResponse } from "next/server";
import { getEnvReport } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Liveness plus configuration presence. Returns names only, never values.
 * 200 when the database answers and required env is present; 503 otherwise.
 */
export async function GET() {
  const env = getEnvReport();
  let database: "ok" | "error" | "timeout" = "error";
  let databaseError: string | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000));
    const ping = supabase.from("business_listings").select("id", { count: "exact", head: true }).limit(1);
    const { error } = await Promise.race([ping, timeout]);
    if (error) {
      databaseError = error.message;
    } else {
      database = "ok";
    }
  } catch (err) {
    database = err instanceof Error && err.message === "timeout" ? "timeout" : "error";
    databaseError = err instanceof Error ? err.message : String(err);
  }
  const ok = env.ok && database === "ok";
  return NextResponse.json(
    {
      ok,
      database,
      ...(databaseError ? { databaseError } : {}),
      env: { ok: env.ok, missingRequired: env.missingRequired, missingOptional: env.missingOptional },
      checkedAt: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
