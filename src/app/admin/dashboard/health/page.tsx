import { readFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadCore } from "@/lib/admin-console/data";
import { loadOutreach } from "@/lib/admin-console/outreach";
import { checkMailDns, loadSearchConsole, type CheckLevel } from "@/lib/admin-console/checks";
import { formatDateTime, relativeTime } from "@/lib/admin-console/metrics";
import { ENV_VARS, getEnvReport } from "@/lib/env";
import { getRefeatureTriggerStatus } from "@/lib/refeature-trigger";
import { PageBody, PageHeader, Panel, Pill, StatusIcon, type Tone } from "../../_components/ui";

export const metadata = { title: "Health" };

const TABLES = [
  "business_listings",
  "analytics_events",
  "claim_requests",
  "owner_email_log",
  "owner_email_optouts",
  "quote_requests",
  "leads",
  "listing_submissions",
  "listings_staging",
  "newsletter_subscribers",
  "search_logs",
  "cities",
] as const;

function Row({ tone, title, detail, meta }: { tone: Tone; title: string; detail?: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <StatusIcon tone={tone} className="mt-0.5 h-4 w-4" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-brand-primary">{title}</p>
        {detail && <div className="mt-0.5 break-words text-xs text-stone-500">{detail}</div>}
      </div>
      {meta && <div className="shrink-0 text-right text-xs text-stone-500">{meta}</div>}
    </li>
  );
}

const toTone = (level: CheckLevel): Tone => level;

/** "0 15 * * *" (UTC) as a Pacific time of day. Handles the daily schedules this app uses. */
function cronToPacific(schedule: string): string {
  const [minute, hour, dom, month, dow] = schedule.split(/\s+/);
  if (dom !== "*" || month !== "*" || dow !== "*" || !/^\d+$/.test(minute) || !/^\d+$/.test(hour)) return `${schedule} (UTC)`;
  const now = new Date();
  const at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), Number(hour), Number(minute)));
  return `Daily at ${at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })} Pacific`;
}

export default async function HealthPage() {
  const core = await loadCore();
  const db = createAdminClient();
  const [dns, gsc, outreach, trigger, counts, vercelRaw] = await Promise.all([
    checkMailDns(),
    loadSearchConsole(28, core.today),
    loadOutreach(),
    getRefeatureTriggerStatus().catch((err: unknown) => ({ error: err instanceof Error ? err.message : String(err) }) as const),
    Promise.all(
      TABLES.map(async (t) => {
        const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
        return { table: t, count: error ? null : (count ?? 0), error: error?.message ?? null };
      })
    ),
    readFile(path.join(process.cwd(), "vercel.json"), "utf8").catch(() => null),
  ]);
  const env = getEnvReport();
  const crons = ((vercelRaw ? (JSON.parse(vercelRaw) as { crons?: { path: string; schedule: string }[] }) : {}).crons ?? []);

  const lastView = [...core.events].reverse().find((e) => e.type === "page_view")?.at ?? null;
  const views24h = core.events.filter((e) => e.type === "page_view" && core.now - Date.parse(e.at) < 86_400_000).length;
  const lastTap = [...core.events].reverse().find((e) => e.type !== "page_view")?.at ?? null;
  const searchLogs = counts.find((c) => c.table === "search_logs")?.count ?? 0;
  const lastRun = outreach.data?.runs[outreach.data.runs.length - 1] ?? null;
  const remindersEnabled = process.env.PROFILE_REMINDERS_ENABLED === "true";

  const problems = dns.checks.filter((c) => c.level === "fail").length + (gsc.state === "error" ? 1 : 0) + (outreach.state === "unavailable" ? 1 : 0) + env.missingRequired.length;

  return (
    <>
      <PageHeader
        eyebrow="Keep it running"
        title="Health"
        description="The things that fail quietly: mail authentication, Google, the outreach Mac, scheduled jobs, tracking and configuration."
        actions={problems ? <Pill tone="fail" icon>{problems} need fixing</Pill> : <Pill tone="ok" icon>All systems answering</Pill>}
      />
      <PageBody>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel id="mail" title={`Mail authentication for ${dns.domain}`} description="Whether inbox providers can verify mail from this domain. Failing checks send outreach and owner emails to spam or bounce them.">
            <ul className="divide-y divide-adm-line/70">
              {dns.checks.map((c) => (
                <Row key={c.name} tone={toTone(c.level)} title={c.name} detail={<span className="font-mono text-[11px]">{c.detail}</span>} meta={<span className="font-mono text-[10px]">{c.host}</span>} />
              ))}
            </ul>
          </Panel>

          <div className="space-y-6">
            <Panel id="search-console" title="Connections">
              <ul className="divide-y divide-adm-line/70">
                <Row
                  tone={gsc.state === "ok" ? "ok" : gsc.state === "unconfigured" ? "info" : "fail"}
                  title="Google Search Console"
                  detail={
                    gsc.state === "ok" ? (
                      `${gsc.site}: ${gsc.totals?.clicks ?? 0} clicks in the last 28 days of data.`
                    ) : (
                      <>
                        {gsc.error}
                        {gsc.state === "error" && (
                          <span className="mt-1 block">
                            Fix: sign in again with the Google account that owns the property, using the same OAuth client (GOOGLE_CLIENT_ID) and the
                            webmasters.readonly scope, then replace GOOGLE_REFRESH_TOKEN in .env.local and restart the dev server. If the consent screen
                            is in Testing mode, publish it so the new token does not expire in 7 days.
                          </span>
                        )}
                      </>
                    )
                  }
                />
                <Row
                  tone={outreach.state === "live" ? "ok" : outreach.state === "cached" ? "warn" : "fail"}
                  title="Outreach Mac"
                  detail={
                    outreach.state === "live"
                      ? `Read ${relativeTime(outreach.fetchedAt, core.now)} from ${process.env.OUTREACH_SSH_TARGET}. Last run folder ${lastRun}.`
                      : `${outreach.reason ?? "Unreachable."}${outreach.fetchedAt ? ` Showing the copy from ${formatDateTime(outreach.fetchedAt)}.` : ""}`
                  }
                />
                <Row
                  tone={env.present.RESEND_API_KEY ? "ok" : "fail"}
                  title="Resend (site email)"
                  detail={env.present.RESEND_API_KEY ? "API key present. Claim, reminder, quote and lead emails can send." : "RESEND_API_KEY is missing; no site email can send."}
                />
              </ul>
            </Panel>

            <Panel title="Scheduled jobs" description="From vercel.json. These run on Vercel, not on this machine.">
              <ul className="divide-y divide-adm-line/70">
                {crons.map((c) => {
                  const reminders = c.path.includes("profile-reminders");
                  return (
                    <Row
                      key={c.path}
                      tone={reminders && !remindersEnabled ? "info" : "ok"}
                      title={c.path}
                      detail={
                        reminders
                          ? `Emails owners whose profile is thin. Sends nothing unless PROFILE_REMINDERS_ENABLED is "true" (it is ${remindersEnabled ? "on" : "off"} in this environment; production has its own setting).`
                          : c.path.includes("refeature")
                            ? "Checks the house listing re-feature rule and emails when it is met."
                            : undefined
                      }
                      meta={cronToPacific(c.schedule)}
                    />
                  );
                })}
                <Row tone={lastRun === core.today ? "ok" : "warn"} title="Daily outreach (outreach Mac, Hermes cron)" detail={lastRun ? `Last run folder: ${lastRun}.` : "No runs found."} meta="Mornings, about 9:05 Pacific" />
              </ul>
            </Panel>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Tracking" description="What the site's own analytics can and cannot see.">
            <ul className="divide-y divide-adm-line/70">
              <Row
                tone={lastView && core.now - Date.parse(lastView) < 2 * 86_400_000 ? "ok" : "warn"}
                title="Listing view logging"
                detail={`${views24h} views in the last 24 hours. ${core.localEventCount} views from localhost are ignored everywhere in this console.`}
                meta={`last ${relativeTime(lastView, core.now)}`}
              />
              <Row tone="info" title="Contact tap logging" detail="Website, phone and directions taps on listing pages and cards." meta={`last ${relativeTime(lastTap, core.now)}`} />
              <Row
                tone="info"
                title="No visitor ids"
                detail="analytics_events.session_id is never set, so the console counts page loads, not people, and has to guess at crawler days by their size. Setting a random per-tab id in the page view tracker would fix both."
              />
              <Row
                tone={searchLogs ? "ok" : "info"}
                title="Site search logging"
                detail={searchLogs ? `${searchLogs} searches logged.` : "search_logs is empty: what people type into site search is not being recorded, so there is no demand data by city or breed."}
              />
            </ul>
          </Panel>

          <Panel title="House listing re-feature rule" description="The house listing only takes a Sponsored seat once enough real businesses have claimed and paid.">
            {"error" in trigger && trigger.error && !("configured" in trigger) ? (
              <p className="text-sm text-red-700">{trigger.error}</p>
            ) : "configured" in trigger ? (
              <ul className="divide-y divide-adm-line/70">
                <Row tone={trigger.configured ? "ok" : "warn"} title="Configured" detail={trigger.configured ? `House listing in ${trigger.houseCity}.` : "HOUSE_LISTING_SLUG is missing or does not match a listing."} />
                <Row
                  tone={trigger.otherClaimed >= trigger.claimedTarget ? "ok" : "info"}
                  title="Other claimed listings"
                  meta={
                    <span className="text-sm font-semibold tabular-nums text-brand-primary">
                      {trigger.otherClaimed} / {trigger.claimedTarget}
                    </span>
                  }
                  detail="Counts every other claimed listing, including test accounts."
                />
                <Row
                  tone={trigger.payingSponsors >= trigger.sponsorsTarget ? "ok" : "info"}
                  title="Paying sponsors elsewhere"
                  meta={
                    <span className="text-sm font-semibold tabular-nums text-brand-primary">
                      {trigger.payingSponsors} / {trigger.sponsorsTarget}
                    </span>
                  }
                />
                <Row tone={trigger.met ? "warn" : "ok"} title={trigger.met ? "Rule is met: the house listing may take a seat" : "Rule not met: the house listing stays unsponsored"} detail={trigger.houseCurrentlySponsored ? "The house listing is currently sponsored." : undefined} />
              </ul>
            ) : null}
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Configuration" description="Environment variable names this process sees (values are never shown). Production is configured separately in Vercel.">
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {ENV_VARS.map((v) => {
                const present = env.present[v.name];
                return (
                  <li key={v.name} className="flex items-start gap-2 text-xs" title={v.effect}>
                    <StatusIcon tone={present ? "ok" : v.required ? "fail" : "info"} className="mt-0.5 h-3.5 w-3.5" />
                    <span className="min-w-0">
                      <span className="font-mono text-[11px] text-stone-800">{v.name}</span>
                      {!present && <span className="block text-stone-500">{v.effect}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Database" description="Row counts, read live.">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {counts.map((c) => (
                <li key={c.table} className="rounded-lg border border-adm-line px-3 py-2">
                  <p className="truncate font-mono text-[10px] text-stone-500">{c.table}</p>
                  <p className={`text-lg font-semibold tabular-nums ${c.error ? "text-red-700" : "text-brand-primary"}`}>{c.error ? "error" : (c.count ?? 0).toLocaleString("en-US")}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
