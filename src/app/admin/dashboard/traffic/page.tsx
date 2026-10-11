import { buildTraffic, loadCore, trafficByListing } from "@/lib/admin-console/data";
import { loadOutreach } from "@/lib/admin-console/outreach";
import { loadSearchConsole } from "@/lib/admin-console/checks";
import { contactIndex } from "@/lib/admin-console/insights";
import { compact, formatDay, parseRange, pctDelta } from "@/lib/admin-console/metrics";
import { DailyChart } from "../../_components/daily-chart";
import { Delta, Empty, PageBody, PageHeader, Panel, Pill, RangeSwitch, StatTile, StatusIcon, rowCls, td, th } from "../../_components/ui";

export const metadata = { title: "Traffic" };

export default async function TrafficPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const core = await loadCore();
  const [outreach, gsc] = await Promise.all([loadOutreach(), loadSearchConsole(range, core.today)]);
  const traffic = buildTraffic(core, range);
  const perListing = trafficByListing(core, traffic);
  const contacts = contactIndex(outreach.data);

  const viewed = [...perListing.entries()].filter(([, t]) => t.views > 0);
  const clickRate = traffic.viewTotal ? (traffic.actionTotal / traffic.viewTotal) * 100 : 0;
  const ranked = viewed
    .map(([id, t]) => ({ listing: core.listingByKey.get(id)!, ...t }))
    .sort((a, b) => b.views - a.views || b.actions - a.actions);
  const unclaimed = ranked.filter((r) => !r.listing.ownerId).slice(0, 25);

  const byCity = new Map<string, { slug: string; city: string; state: string; views: number; listings: number }>();
  for (const r of ranked) {
    const key = `${r.listing.state}|${r.listing.citySlug}`;
    const row = byCity.get(key) ?? { slug: r.listing.citySlug, city: r.listing.city, state: r.listing.state, views: 0, listings: 0 };
    row.views += r.views;
    row.listings++;
    byCity.set(key, row);
  }
  const cities = [...byCity.values()].sort((a, b) => b.views - a.views).slice(0, 12);
  const cityMax = Math.max(1, ...cities.map((c) => c.views));
  const stateViews = ["WA", "OR"].map((st) => ({ st, views: ranked.filter((r) => r.listing.state === st).reduce((n, r) => n + r.views, 0) }));

  const actionsTotalByType = traffic.actions.reduce(
    (acc, d) => ({ website: acc.website + d.website, directions: acc.directions + d.directions, phone: acc.phone + d.phone }),
    { website: 0, directions: 0, phone: 0 }
  );

  return (
    <>
      <PageHeader
        eyebrow="Know the market"
        title="Traffic"
        description="Groomer profile views and contact taps logged by the site, plus Google Search Console. Hours that look like a crawler (many views, each on a different listing) are shown hatched and left out of every total."
        actions={<RangeSwitch basePath="/admin/dashboard/traffic" current={range} />}
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile label={`Listing views, ${range} days`} value={compact(traffic.viewTotal)} delta={<Delta value={pctDelta(traffic.viewTotal, traffic.previousViewTotal)} />} />
          <StatTile label="Contact taps" value={traffic.actionTotal} sub={`${actionsTotalByType.website} website · ${actionsTotalByType.phone} phone · ${actionsTotalByType.directions} directions`} delta={<Delta value={pctDelta(traffic.actionTotal, traffic.previousActionTotal)} />} />
          <StatTile label="Tap rate" value={`${clickRate.toFixed(clickRate < 1 ? 2 : 1)}%`} sub="Contact taps per listing view" tone={clickRate < 1 && traffic.viewTotal > 200 ? "warn" : undefined} />
          <StatTile label="Listings viewed" value={viewed.length} sub={`of ${core.listings.length.toLocaleString("en-US")} in the directory`} />
          <StatTile label="Crawler views left out" value={compact(traffic.crawlerViews)} sub={`${traffic.views.filter((p) => p.crawler > 0).length} days touched by a crawler · ${core.localEventCount} localhost views also ignored`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Listing views per day" description="Each groomer profile page load. No visitor ids are logged, so this is page loads, not people.">
            <DailyChart
              days={traffic.views.map((p) => p.day)}
              series={[{ key: "views", label: "Listing views", color: "var(--color-adm-s1)" }]}
              values={traffic.views.map((p) => ({ views: p.count }))}
              extra={traffic.views.map((p) => p.crawler)}
            />
          </Panel>
          <Panel title="Contact taps per day" description="A pet owner tapping the website, phone number or directions on a listing.">
            <DailyChart
              days={traffic.actions.map((d) => d.day)}
              series={[
                { key: "website", label: "Website", color: "var(--color-adm-s1)" },
                { key: "phone", label: "Phone", color: "var(--color-adm-s2)" },
                { key: "directions", label: "Directions", color: "var(--color-adm-s3)" },
              ]}
              values={traffic.actions.map(({ website, phone, directions }) => ({ website, phone, directions }))}
            />
          </Panel>
        </div>

        <Panel id="search-console" title="Google search" description={gsc.state === "ok" ? `${gsc.site}, ${formatDay(gsc.startDate)} to ${formatDay(gsc.endDate)} (Google reports about two days behind).` : undefined}>
          {gsc.state === "ok" && gsc.totals ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile label="Clicks from Google" value={compact(gsc.totals.clicks)} />
                <StatTile label="Impressions" value={compact(gsc.totals.impressions)} />
                <StatTile label="Click-through rate" value={`${(gsc.totals.ctr * 100).toFixed(1)}%`} />
                <StatTile label="Average position" value={gsc.totals.position.toFixed(1)} />
              </div>
              <DailyChart
                days={gsc.byDay.map((d) => d.day)}
                series={[{ key: "clicks", label: "Clicks", color: "var(--color-adm-s3)" }]}
                values={gsc.byDay.map((d) => ({ clicks: d.clicks }))}
                height={180}
              />
              <div className="grid gap-6 lg:grid-cols-2">
                {(["queries", "pages"] as const).map((kind) => (
                  <div key={kind} className="overflow-x-auto rounded-xl border border-adm-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className={th}>{kind === "queries" ? "Search" : "Page"}</th>
                          <th className={`${th} text-right`}>Clicks</th>
                          <th className={`${th} text-right`}>Impr.</th>
                          <th className={`${th} text-right`}>Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gsc[kind].map((r) => (
                          <tr key={r.key} className={rowCls}>
                            <td className={`${td} max-w-xs truncate`}>{kind === "pages" ? r.key.replace(/^https?:\/\/[^/]+/, "") || "/" : r.key}</td>
                            <td className={`${td} text-right tabular-nums`}>{r.clicks}</td>
                            <td className={`${td} text-right tabular-nums text-stone-500`}>{compact(r.impressions)}</td>
                            <td className={`${td} text-right tabular-nums text-stone-500`}>{r.position.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <StatusIcon tone="warn" />
              <div className="text-sm text-stone-700">
                <p className="font-medium">Search Console is not connected right now.</p>
                <p className="mt-1 text-xs text-stone-600">{gsc.error}</p>
                <p className="mt-2 text-xs text-stone-500">
                  This panel fills in by itself once the token works. If the Google Cloud OAuth consent screen is in Testing mode, refresh tokens expire after 7
                  days; switching it to In production stops that.
                </p>
              </div>
            </div>
          )}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-5">
          <Panel flush className="xl:col-span-3" title="Most viewed listings" description={`Top 20 in the last ${range} days.`}>
            {ranked.length === 0 ? (
              <div className="px-5 pb-5">
                <Empty title="No listing views in this window" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Listing</th>
                    <th className={`${th} text-right`}>Views</th>
                    <th className={`${th} text-right`}>Taps</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.slice(0, 20).map((r) => (
                    <tr key={r.listing.id} className={rowCls}>
                      <td className={td}>
                        <a href={`/groomer/${r.listing.slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                          {r.listing.name}
                        </a>
                        <p className="text-xs text-stone-500">
                          {r.listing.city}, {r.listing.state}
                        </p>
                      </td>
                      <td className={`${td} text-right font-semibold tabular-nums`}>{r.views}</td>
                      <td className={`${td} text-right tabular-nums ${r.actions ? "text-emerald-700" : "text-stone-400"}`}>{r.actions}</td>
                      <td className={td}>{r.listing.ownerId ? <Pill tone="ok">Claimed</Pill> : <Pill tone="neutral">Unclaimed</Pill>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel className="xl:col-span-2" title="Where the views are" description="Listing views by city.">
            <div className="mb-4 grid grid-cols-2 gap-3">
              {stateViews.map((s) => (
                <div key={s.st} className="rounded-xl bg-adm-plane/70 px-3 py-2">
                  <p className="text-[11px] text-stone-500">{s.st === "WA" ? "Washington" : "Oregon"}</p>
                  <p className="text-xl font-semibold tabular-nums text-brand-primary">{compact(s.views)}</p>
                </div>
              ))}
            </div>
            <ul className="space-y-2.5">
              {cities.map((c) => (
                <li key={`${c.state}-${c.slug}`}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-stone-700">
                      {c.city}, {c.state}
                      <span className="text-stone-400"> · {c.listings} listings viewed</span>
                    </span>
                    <span className="font-semibold tabular-nums text-brand-primary">{c.views}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-teal-50">
                    <div className="h-full rounded-full bg-adm-s1" style={{ width: `${(c.views / cityMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel flush id="unclaimed" title="Unclaimed listings people are viewing" description="The owner does not know these views exist yet. Lead with the number when you reach out.">
          {unclaimed.length === 0 ? (
            <div className="px-5 pb-5">
              <Empty title="No views on unclaimed listings in this window" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Listing</th>
                    <th className={`${th} text-right`}>Views</th>
                    <th className={th}>Phone</th>
                    <th className={th}>Email on file</th>
                    <th className={th}>Outreach</th>
                  </tr>
                </thead>
                <tbody>
                  {unclaimed.map((r) => {
                    const c = contacts.get(r.listing.slug);
                    return (
                      <tr key={r.listing.id} className={rowCls}>
                        <td className={td}>
                          <a href={`/groomer/${r.listing.slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                            {r.listing.name}
                          </a>
                          <p className="text-xs text-stone-500">
                            {r.listing.city}, {r.listing.state}
                          </p>
                        </td>
                        <td className={`${td} text-right font-semibold tabular-nums`}>{r.views}</td>
                        <td className={`${td} whitespace-nowrap`}>
                          {r.listing.phone ? (
                            <a href={`tel:${r.listing.phone}`} className="tabular-nums text-teal-700 hover:underline">
                              {r.listing.phone}
                            </a>
                          ) : (
                            <span className="text-stone-400">none</span>
                          )}
                        </td>
                        <td className={`${td} text-xs text-stone-600`}>{r.listing.email ?? (c?.status === "sent" ? c.email : null) ?? <span className="text-stone-400">none</span>}</td>
                        <td className={td}>
                          {c?.status === "sent" ? (
                            <Pill tone="teal">Emailed {formatDay(c.sent)}</Pill>
                          ) : c?.status === "bounced" ? (
                            <Pill tone="fail">Bounced</Pill>
                          ) : c ? (
                            <Pill tone="warn">On call list</Pill>
                          ) : (
                            <Pill tone="neutral">Not contacted</Pill>
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
      </PageBody>
    </>
  );
}
