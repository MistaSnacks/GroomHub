// Select-only. Builds the monthly owner reports for a month exactly as the cron would,
// prints every claimed listing's decision, and writes the email HTML of the first
// listing the cron would send (else the first that qualifies, else a fixture). Sends nothing.
//   npx tsx scripts/owner-report-sample.ts [YYYY-MM] [out-dir]
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { periodFromString } from "../src/lib/owner-report";
import { gatherOwnerReports } from "../src/lib/owner-report-data";
import { monthlyReportEmail } from "../src/lib/email/owner-emails";
import { shownOwnerMetrics } from "../src/lib/real-visits";

config({ path: ".env.local" });

async function main() {
  const period = periodFromString(process.argv[2] ?? "2026-10")!;
  const outDir = process.argv[3] ?? "output/owner-report-sample";
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const batch = await gatherOwnerReports(db, period);

  console.log(`Period ${period.period}. Search Console: ${batch.googleError ?? "ok"}. Counted from: ${batch.countedFrom ?? "whole month"}.`);
  console.table(
    batch.reports.map((r) => ({
      listing: r.listing.slug,
      views: r.stats.views,
      taps: r.stats.taps.total,
      googleImpressions: r.google?.impressions ?? "n/a",
      googleClicks: r.google?.clicks ?? "n/a",
      shown: r.email.metrics.map((m) => `${m.key}=${m.value}`).join(" ") || "(none)",
      decision: r.decision.send ? "send" : r.decision.reason,
    }))
  );

  mkdirSync(outDir, { recursive: true });
  const qualifying = batch.reports.find((r) => r.decision.send) ?? batch.reports.find((r) => r.email.metrics.length > 0);
  const email = qualifying
    ? monthlyReportEmail({ ...qualifying.email, optOutUrl: "https://groomlocal.com/api/owner-reminders/unsubscribe?sample=1" })
    : monthlyReportEmail({
        listingName: "Sample Grooming Co. (fixture)",
        slug: "sample-grooming-co",
        monthLabel: period.label,
        countedFrom: null,
        metrics: shownOwnerMetrics({ views: 41, taps: 12, googleImpressions: 230, googleClicks: 6 }),
        searches: ["dog groomer near me", "sample grooming co"],
        badgeHost: null,
        gaps: [],
        optOutUrl: "https://groomlocal.com/api/owner-reminders/unsubscribe?sample=1",
      });
  const file = join(outDir, `${qualifying ? qualifying.listing.slug : "fixture"}-${period.period}.html`);
  writeFileSync(file, email.html);
  writeFileSync(file.replace(/\.html$/, ".txt"), `Subject: ${email.subject}\n\n${email.text}\n`);
  console.log(`${qualifying ? "Real listing" : "No listing qualified; fixture"} written to ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
