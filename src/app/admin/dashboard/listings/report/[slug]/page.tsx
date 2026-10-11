import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { gatherOwnerReports } from "@/lib/owner-report-data";
import { periodFromString, previousPeriod, reportPeriod } from "@/lib/owner-report";
import { monthlyReportEmail } from "@/lib/email/owner-emails";
import { optOutUrl } from "@/lib/owner-reminders";
import { PageBody, PageHeader, Panel, Pill } from "@/app/admin/_components/ui";

export const metadata = { title: "Monthly report preview" };

const REASON: Record<string, string> = {
  opted_out: "The owner turned off reminders and reports.",
  already_sent: "This month's report already went out.",
  nothing_to_report: "No views, taps or Google impressions this month, so no email.",
  no_owner_email: "The owner account has no email address.",
};

// Admin only (the admin layout checks). Shows exactly what the monthly cron would send this owner.
export default async function ReportPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const { period: periodParam } = await searchParams;
  const period = (periodParam && periodFromString(periodParam)) || reportPeriod();
  const batch = await gatherOwnerReports(createAdminClient(), period, { only: slug });
  const report = batch.reports[0];
  if (!report) notFound();

  const email = monthlyReportEmail({ ...report.email, optOutUrl: optOutUrl(report.listing.owner_id) });
  const previous = previousPeriod(period);

  return (
    <>
      <PageHeader
        eyebrow="Owners"
        title={`${report.listing.name}: ${period.label} report`}
        description="This is the email the monthly cron would send. Nothing is sent from this page."
        actions={
          <Link href="/admin/dashboard/listings" className="text-sm text-teal-700 hover:underline">
            Back to owners
          </Link>
        }
      />
      <PageBody>
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Panel title="Would it send?">
            <div className="space-y-3 text-sm text-stone-700">
              <p>
                {report.decision.send ? <Pill tone="ok">Yes</Pill> : <Pill tone="neutral">No</Pill>}{" "}
                {report.decision.send ? `To ${report.ownerEmail}` : REASON[report.decision.reason]}
              </p>
              {batch.googleError && (
                <p className="text-amber-700">
                  Google numbers are missing: {batch.googleError}. The cron sends nothing until Search Console answers.
                </p>
              )}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-stone-500">Subject</dt>
                <dd className="col-span-2 -mt-1 mb-1 font-medium">{email.subject}</dd>
                <dt className="text-stone-500">Profile views</dt>
                <dd className="tabular-nums">{report.stats.views}</dd>
                <dt className="text-stone-500">Contact taps</dt>
                <dd className="tabular-nums">{report.stats.taps.total}</dd>
                <dt className="text-stone-500">Google views</dt>
                <dd className="tabular-nums">{report.google ? report.google.impressions : "n/a"}</dd>
                <dt className="text-stone-500">Google clicks</dt>
                <dd className="tabular-nums">{report.google ? report.google.clicks : "n/a"}</dd>
                <dt className="text-stone-500">Badge</dt>
                <dd>{report.badge?.host ?? "not seen"}</dd>
                <dt className="text-stone-500">Badge visits</dt>
                <dd className="tabular-nums">{report.stats.badgeClicks}</dd>
              </dl>
              <Link href={`/admin/dashboard/listings/report/${slug}?period=${previous.period}`} className="block text-xs text-teal-700 hover:underline">
                See {previous.label}
              </Link>
            </div>
          </Panel>
          <Panel title="Email" flush>
            <iframe title="Monthly report email" srcDoc={email.html} className="h-[1100px] w-full rounded-b-2xl border-0" sandbox="" />
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
