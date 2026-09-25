import { getEnvReport } from "@/lib/env";
import { logEvent } from "@/lib/log";

/** Runs once per server instance at boot. Names missing variables; never values. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const report = getEnvReport();
  if (report.missingRequired.length > 0) {
    logEvent("error", "env", "missing_required", { vars: report.missingRequired });
  }
  if (report.missingOptional.length > 0) {
    logEvent("warn", "env", "missing_optional", { vars: report.missingOptional });
  }
}
