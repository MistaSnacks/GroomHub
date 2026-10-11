import { buildTraffic, loadCore, trafficByListing } from "@/lib/admin-console/data";
import { loadOutreach, sendsByDay } from "@/lib/admin-console/outreach";
import { contactIndex, daysToClaim } from "@/lib/admin-console/insights";
import { addDays, dayRange, formatDateTime, formatDay, relativeTime } from "@/lib/admin-console/metrics";
import { listingSearchStats, searchConsoleConfigured, searchWindow, type PageSearchStats } from "@/lib/search-console";
import { DailyChart } from "../../_components/daily-chart";
import { Empty, ExternalA, PageBody, PageHeader, Panel, Pill, StatTile, prettyHost, rowCls, td, th } from "../../_components/ui";

export const metadata = { title: "Outreach" };

/** Addresses that start with an escape fragment ("u003e" is ">", "%20" a space) came from a scraping bug, not a dead mailbox. */
function looksMangled(email: string): boolean {
  return /^(u003[ce]|%[0-9a-f]{2}|&[a-z]+;)/i.test(email) || /\s/.test(email);
}

export default async function OutreachPage() {
  const [core, outreach] = await Promise.all([loadCore(), loadOutreach()]);
  const data = outreach.data;

  const statusPill =
    outreach.state === "live" ? (
      <Pill tone="ok" icon>
        Live from {process.env.OUTREACH_SSH_TARGET?.split("@")[1] ?? "outreach Mac"}
      </Pill>
    ) : outreach.state === "cached" ? (
      <Pill tone="warn" icon title={outreach.reason ?? undefined}>
        Saved copy from {relativeTime(outreach.fetchedAt, core.now)}
      </Pill>
    ) : (
      <Pill tone="fail" icon>
        Unavailable
      </Pill>
    );

  if (!data) {
    return (
      <>
        <PageHeader eyebrow="Run the business" title="Outreach" actions={statusPill} />
        <PageBody>
          <Panel title="The outreach list could not be read">
            <p className="text-sm text-stone-600">{outreach.reason}</p>
            <p className="mt-2 text-xs text-stone-500">
              The daily job runs on the outreach Mac and keeps its running list there. This page reads it over SSH with OUTREACH_SSH_TARGET and
              OUTREACH_SSH_KEY from .env.local, and keeps the last good copy in .admin-cache/ for when that Mac is asleep.
            </p>
          </Panel>
        </PageBody>
      </>
    );
  }

  const traffic = buildTraffic(core, 30);
  const perListing = trafficByListing(core, traffic);
  const contacts = contactIndex(data);
  const weekAgo = addDays(core.today, -7);

  const unique = [...new Set(data.contacted.map((c) => c.slug))];
  const bouncedSlugs = unique.filter((s) => contacts.get(s)?.status === "bounced");
  const sent7 = data.contacted.filter((c) => c.sent > weekAgo).length;
  const converted = unique
    .map((slug) => core.listingByKey.get(slug))
    .filter((l): l is NonNullable<typeof l> => !!l?.ownerId)
    .map((l) => ({ listing: l, contact: contacts.get(l.slug)!, days: daysToClaim(l, contacts.get(l.slug)) }))
    .sort((a, b) => (b.listing.claimedAt ?? "").localeCompare(a.listing.claimedAt ?? ""));

  const firstDay = data.contacted.map((c) => c.sent).filter((d) => d >= "2026-09-01").sort()[0] ?? addDays(core.today, -30);
  const span = Math.min(60, Math.max(14, Math.round((Date.parse(core.today) - Date.parse(firstDay)) / 86_400_000) + 1));
  const days = dayRange(core.today, span);
  const perDay = sendsByDay(data, days);

  const campaigns = new Map<string, { campaign: string; first: string; sent: number; bounced: number; claimed: number }>();
  for (const c of data.contacted) {
    const row = campaigns.get(c.campaign) ?? { campaign: c.campaign || "(none)", first: c.sent, sent: 0, bounced: 0, claimed: 0 };
    row.sent++;
    if (c.bounced) row.bounced++;
    if (core.listingByKey.get(c.slug)?.ownerId) row.claimed++;
    if (c.sent < row.first) row.first = c.sent;
    campaigns.set(c.campaign, row);
  }
  const campaignRows = [...campaigns.values()].sort((a, b) => b.first.localeCompare(a.first));

  // Unclaimed listings Google already shows: the strongest opener for a claim email or call.
  const window28 = searchWindow(core.today, 28);
  let google: Map<string, PageSearchStats> | null = null;
  let googleError: string | null = searchConsoleConfigured() ? null : "Search Console is not configured.";
  if (!googleError) {
    try {
      google = await listingSearchStats(window28.startDate, window28.endDate);
    } catch (err) {
      googleError = err instanceof Error ? err.message : String(err);
    }
  }
  const onGoogle = google
    ? [...google.entries()]
        .map(([slug, stats]) => ({ listing: core.listingByKey.get(slug), stats }))
        .filter((r): r is { listing: NonNullable<typeof r.listing>; stats: PageSearchStats } => !!r.listing && !r.listing.ownerId && r.stats.impressions >= 10)
        .sort((a, b) => b.stats.impressions - a.stats.impressions)
        .slice(0, 25)
    : [];

  const callList = data.manualNoEmail
    .map((slug) => ({ slug, listing: core.listingByKey.get(slug) ?? null }))
    .filter((r) => !r.listing?.ownerId)
    .sort((a, b) => (perListing.get(b.listing?.id ?? "")?.views ?? 0) - (perListing.get(a.listing?.id ?? "")?.views ?? 0) || a.slug.localeCompare(b.slug));
  const withPhone = callList.filter((r) => r.listing?.phone).length;

  const bounces = data.contacted.filter((c) => c.bounced).sort((a, b) => (b.bounced ?? "").localeCompare(a.bounced ?? ""));
  const lastRun = data.runs[data.runs.length - 1] ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Run the business"
        title="Outreach"
        description={`The daily job emails unclaimed WA and OR groomers whose address it can verify, and records every send. Read-only here: nothing on this page sends mail. Last run: ${lastRun ? formatDay(lastRun) : "none"}.`}
        actions={statusPill}
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile label="Groomers emailed" value={unique.length} sub={`${data.contacted.length} sends in total`} />
          <StatTile label="Sent, last 7 days" value={sent7} spark={perDay.slice(-14).map((d) => d.sent)} sub="Up to 20 a day" />
          <StatTile
            label="Bounce rate"
            value={`${unique.length ? Math.round((bouncedSlugs.length / unique.length) * 100) : 0}%`}
            sub={`${bouncedSlugs.length} addresses bounced`}
            tone={bouncedSlugs.length / Math.max(unique.length, 1) > 0.08 ? "warn" : undefined}
          />
          <StatTile
            label="Claimed after an email"
            value={converted.length}
            sub={unique.length ? `${((converted.length / unique.length) * 100).toFixed(1)}% of groomers emailed` : undefined}
            tone={converted.length ? "ok" : undefined}
          />
          <StatTile label="Call list" value={callList.length} sub={`No email found. ${withPhone} have a phone number.`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel className="xl:col-span-2" title="Emails sent per day" description="Bounces are counted on the day the email went out.">
            <DailyChart
              days={days}
              series={[
                { key: "delivered", label: "Delivered", color: "var(--color-adm-s1)" },
                { key: "bounced", label: "Bounced", color: "var(--color-adm-s2)" },
              ]}
              values={perDay.map((d) => ({ delivered: d.sent - d.bounced, bounced: d.bounced }))}
            />
          </Panel>
          <Panel title="Became owners" description="Emailed first, then claimed.">
            {converted.length === 0 ? (
              <Empty title="No claims from outreach yet" />
            ) : (
              <ul className="space-y-3">
                {converted.map(({ listing, contact, days: d }) => (
                  <li key={listing.id} className="rounded-xl border border-adm-line p-3">
                    <a href={`/groomer/${listing.slug}`} target="_blank" className="text-sm font-medium text-brand-primary hover:underline">
                      {listing.name}
                    </a>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Emailed {formatDay(contact.sent)} · claimed {formatDay(listing.claimedAt)}
                      {d !== null && <> · {d === 0 ? "same day" : `${d} ${d === 1 ? "day" : "days"} later`}</>}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-400">{contact.campaign}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          flush
          title="Showing up on Google, not claimed"
          description={`Unclaimed listings whose GroomLocal page Google showed at least 10 times, ${formatDay(window28.startDate)} to ${formatDay(window28.endDate)}. The line under each name is ready to paste into a claim email or say on a call.`}
        >
          {googleError ? (
            <p className="px-5 pb-5 text-sm text-amber-700">Google numbers unavailable: {googleError}</p>
          ) : onGoogle.length === 0 ? (
            <div className="px-5 pb-5">
              <Empty title="No unclaimed listing reached 10 Google views" />
            </div>
          ) : (
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr>
                    <th className={th}>Business</th>
                    <th className={`${th} text-right`}>Google views</th>
                    <th className={th}>Top search</th>
                    <th className={th}>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {onGoogle.map(({ listing, stats }) => {
                    const contact = contacts.get(listing.slug);
                    const top = stats.queries[0];
                    const contactText =
                      contact?.status === "sent"
                        ? `emailed ${formatDay(contact.sent)}`
                        : contact?.status === "bounced"
                          ? "email bounced"
                          : listing.email
                            ? "email on file, not sent"
                            : listing.phone
                              ? "phone only"
                              : "no contact";
                    return (
                      <tr key={listing.id} className={rowCls}>
                        <td className={td}>
                          <a href={`/groomer/${listing.slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                            {listing.name}
                          </a>
                          <span className="text-xs text-stone-500">
                            {" "}
                            · {listing.city}, {listing.state}
                          </span>
                          <p className="mt-0.5 select-all text-xs text-stone-500">
                            Your business showed up on Google {stats.impressions} times in the last 4 weeks through its GroomLocal page
                            {top ? `, mostly for "${top.query}"` : ""}.
                          </p>
                        </td>
                        <td className={`${td} text-right tabular-nums`}>
                          {stats.impressions}
                          {stats.clicks > 0 && <span className="block text-xs text-stone-500">{stats.clicks} {stats.clicks === 1 ? "click" : "clicks"}</span>}
                        </td>
                        <td className={`${td} text-xs text-stone-600`}>{top ? `${top.query} (${top.impressions})` : <span className="text-stone-400">hidden by Google</span>}</td>
                        <td className={`${td} whitespace-nowrap text-xs`}>
                          {contactText}
                          {listing.phone && contact?.status !== "sent" && (
                            <a href={`tel:${listing.phone}`} className="block tabular-nums text-teal-700 hover:underline">
                              {listing.phone}
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-5">
          <Panel flush className="xl:col-span-3" title="Call list" description="Unclaimed listings where no email could be found. Sorted by views in the last 30 days, so the warmest calls come first.">
            {callList.length === 0 ? (
              <div className="px-5 pb-5">
                <Empty title="Nobody waiting for a call" />
              </div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr>
                      <th className={th}>Business</th>
                      <th className={th}>Phone</th>
                      <th className={`${th} text-right`}>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callList.map(({ slug, listing }) => (
                      <tr key={slug} className={rowCls}>
                        <td className={td}>
                          {listing ? (
                            <>
                              <a href={`/groomer/${slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                                {listing.name}
                              </a>
                              <p className="text-xs text-stone-500">
                                {listing.city}, {listing.state}
                                {listing.website && (
                                  <>
                                    {" · "}
                                    <ExternalA href={listing.website} className="break-all">
                                      {prettyHost(listing.website)}
                                    </ExternalA>
                                  </>
                                )}
                              </p>
                            </>
                          ) : (
                            <span className="text-stone-500">{slug} (no longer listed)</span>
                          )}
                        </td>
                        <td className={`${td} whitespace-nowrap`}>
                          {listing?.phone ? (
                            <a href={`tel:${listing.phone}`} className="tabular-nums text-teal-700 hover:underline">
                              {listing.phone}
                            </a>
                          ) : (
                            <span className="text-stone-400">none</span>
                          )}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{perListing.get(listing?.id ?? "")?.views ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel flush className="xl:col-span-2" title="Campaigns" description="Each daily run and the earlier hand-picked batches.">
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className={th}>Campaign</th>
                    <th className={`${th} text-right`}>Sent</th>
                    <th className={`${th} text-right`}>Bounced</th>
                    <th className={`${th} text-right`}>Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignRows.map((c) => (
                    <tr key={c.campaign} className={rowCls}>
                      <td className={td}>
                        <span className="font-medium text-stone-800">{c.campaign}</span>
                        <p className="text-xs text-stone-500">{formatDay(c.first)}</p>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{c.sent}</td>
                      <td className={`${td} text-right tabular-nums ${c.bounced ? "text-red-700" : "text-stone-400"}`}>{c.bounced}</td>
                      <td className={`${td} text-right tabular-nums ${c.claimed ? "font-semibold text-emerald-700" : "text-stone-400"}`}>{c.claimed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel flush id="bounces" title="Bounces" description="Dead or mistyped addresses. The job moves these listings to the call list.">
            {bounces.length === 0 ? (
              <div className="px-5 pb-5">
                <Empty title="No bounces" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Listing</th>
                    <th className={th}>Address</th>
                    <th className={th}>Sent</th>
                    <th className={th}>Bounced</th>
                  </tr>
                </thead>
                <tbody>
                  {bounces.map((b) => (
                    <tr key={`${b.slug}-${b.email}`} className={rowCls}>
                      <td className={td}>{core.listingByKey.get(b.slug)?.name ?? b.slug}</td>
                      <td className={`${td} break-all text-xs text-stone-600`}>
                        {b.email}
                        {looksMangled(b.email) && (
                          <span className="mt-1 block">
                            <Pill tone="warn" title="The harvester kept an HTML or URL escape at the start of the address, so this bounce says nothing about the business.">
                              Scraping error
                            </Pill>
                          </span>
                        )}
                      </td>
                      <td className={`${td} whitespace-nowrap text-stone-500`}>{formatDay(b.sent)}</td>
                      <td className={`${td} whitespace-nowrap text-red-700`}>{formatDay(b.bounced)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel id="data-issues" title="Listing problems found by outreach" description="The job flags listings whose website contradicts the directory.">
              {data.dataIssues.length === 0 ? (
                <Empty title="None flagged" />
              ) : (
                <ul className="space-y-2.5">
                  {data.dataIssues.map((d) => {
                    const live = core.listingByKey.get(d.slug);
                    return (
                      <li key={d.slug} className="flex items-start gap-3 text-sm">
                        {live ? <Pill tone="warn">Still live</Pill> : <Pill tone="ok">Removed</Pill>}
                        <div className="min-w-0">
                          {live ? (
                            <a href={`/groomer/${d.slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                              {live.name}
                            </a>
                          ) : (
                            <span className="font-medium text-stone-500">{d.slug}</span>
                          )}
                          <p className="text-xs text-stone-500">{d.issue}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title={`Run report, ${lastRun ? formatDay(lastRun) : "latest"}`} description={`Fetched ${formatDateTime(outreach.fetchedAt)}. ${data.runs.length} run folders on the outreach Mac.`}>
              {data.lastReport ? (
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-adm-plane/60 p-3 font-mono text-[11px] leading-relaxed text-stone-700">{data.lastReport}</pre>
              ) : (
                <Empty title="No report in the latest run folder" />
              )}
              {data.followups.length > 0 && (
                <p className="mt-3 text-xs text-stone-500">
                  Personal follow-ups on record: {data.followups.map((f) => `${core.listingByKey.get(f.slug)?.name ?? f.slug} (${formatDay(f.sent)})`).join(", ")}.
                  Follow-ups need your go-ahead each time.
                </p>
              )}
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
