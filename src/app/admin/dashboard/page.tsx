import Link from "next/link";
import { ArrowRight, Mail, MessageSquare, Send, ShieldCheck, UserPlus, FileText, CircleX, Store } from "lucide-react";
import { buildTraffic, isPayingSponsor, loadCore, ownerRecords, trafficByListing } from "@/lib/admin-console/data";
import { loadOutreach } from "@/lib/admin-console/outreach";
import { checkMailDns, loadSearchConsole } from "@/lib/admin-console/checks";
import { buildFeed, buildTasks, contactIndex, externalOwners, type FeedItem } from "@/lib/admin-console/insights";
import { addDays, compact, formatDay, formatLongDay, pctDelta, relativeTime } from "@/lib/admin-console/metrics";
import { pricingTiers } from "@/lib/pricing";
import { CLAIMED_TARGET, SPONSORS_TARGET } from "@/lib/refeature-trigger";
import { DailyChart } from "../_components/daily-chart";
import { Delta, Empty, Funnel, PageBody, PageHeader, Panel, Pill, StatTile, StatusIcon, td, th, rowCls } from "../_components/ui";

export const metadata = { title: "Today" };

const FEED_ICON: Record<FeedItem["kind"], typeof Mail> = {
  signup: UserPlus,
  claim: ShieldCheck,
  email: Mail,
  quote: MessageSquare,
  lead: MessageSquare,
  submission: FileText,
  outreach: Send,
  bounce: CircleX,
};

export default async function TodayPage() {
  const core = await loadCore();
  const [outreach, dns, gsc] = await Promise.all([loadOutreach(), checkMailDns(), loadSearchConsole(28, core.today)]);

  const traffic = buildTraffic(core, 30);
  const perListing = trafficByListing(core, traffic);
  const views30 = new Map([...perListing].map(([id, t]) => [id, t.views]));
  const owners = ownerRecords(core);
  const external = externalOwners(owners);
  const contacts = contactIndex(outreach.data);
  const tasks = buildTasks({ core, owners, outreach, contacts, dns: dns.checks, gsc, views30 });
  const feed = buildFeed(core, outreach.data);

  const weekAgo = addDays(core.today, -7);
  const newOwnersWeek = external.filter((o) => o.listing.claimedAt && o.listing.claimedAt.slice(0, 10) >= weekAgo).length;
  const paying = core.listings.filter((l) => isPayingSponsor(l, core.now));
  const sponsoredPrice = pricingTiers.find((t) => t.slug === "premium")?.price ?? 49;

  // Outreach numbers
  const data = outreach.data;
  const sent7 = data ? data.contacted.filter((c) => c.sent > weekAgo).length : null;
  const uniqueContacted = data ? new Set(data.contacted.map((c) => c.slug)) : new Set<string>();
  const delivered = [...uniqueContacted].filter((s) => contacts.get(s)?.status === "sent");
  const claimedFromOutreach = delivered.filter((s) => core.listingByKey.get(s)?.ownerId);
  const completeFromOutreach = claimedFromOutreach.filter((s) => (core.listingByKey.get(s)?.gaps.length ?? 1) === 0);
  const organic = external.filter((o) => !contacts.get(o.listing.slug)?.sent);

  const claims30 = core.claims.filter((c) => c.createdAt.slice(0, 10) >= addDays(core.today, -30)).length;
  const requests30 =
    core.quotes.filter((q) => q.createdAt.slice(0, 10) >= addDays(core.today, -30)).length +
    core.leads.filter((l) => (l.createdAt ?? "").slice(0, 10) >= addDays(core.today, -30)).length;

  const warm = core.listings
    .filter((l) => !l.ownerId && (perListing.get(l.id)?.views ?? 0) > 0)
    .sort((a, b) => (perListing.get(b.id)?.views ?? 0) - (perListing.get(a.id)?.views ?? 0))
    .slice(0, 8);

  const fails = tasks.filter((t) => t.tone === "fail").length;
  const summary = [
    `${external.length} outside ${external.length === 1 ? "owner" : "owners"}`,
    data ? `${uniqueContacted.size} groomers emailed` : null,
    `${paying.length} paying ${paying.length === 1 ? "sponsor" : "sponsors"}`,
    `${compact(traffic.viewTotal)} listing views in 30 days`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        eyebrow={formatLongDay(core.today)}
        title="Today"
        description={summary}
        actions={
          fails > 0 ? (
            <Pill tone="fail" icon>
              {fails} urgent
            </Pill>
          ) : (
            <Pill tone="ok" icon>
              Nothing urgent
            </Pill>
          )
        }
      />
      <PageBody>
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            className="xl:col-span-2"
            title="Needs you"
            description="Built from the database, the outreach list, mail DNS and Search Console each time this page loads."
          >
            {tasks.length === 0 ? (
              <Empty title="All clear">No claims, requests or broken systems waiting.</Empty>
            ) : (
              <ul className="-mx-2 divide-y divide-adm-line/70">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 rounded-lg px-2 py-3">
                    <StatusIcon tone={t.tone} className="mt-0.5 h-4 w-4" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-primary">{t.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{t.detail}</p>
                    </div>
                    <Link href={t.href} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50">
                      {t.cta} <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <section className="adm-rise relative flex flex-col overflow-hidden rounded-2xl bg-adm-rail p-6 text-slate-300 shadow-lg">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-secondary/15 blur-2xl" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-brand-secondary">Owners on GroomLocal</p>
            <p className="mt-3 text-6xl font-semibold leading-none tracking-tight text-white">{external.length}</p>
            <p className="mt-2 text-sm">
              {newOwnersWeek > 0 ? (
                <span className="font-semibold text-emerald-300">+{newOwnersWeek} this week</span>
              ) : (
                <span className="text-slate-400">None new this week</span>
              )}
              <span className="text-slate-500"> · real businesses, your own accounts left out</span>
            </p>
            <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
              {external.slice(0, 5).map((o) => (
                <li key={o.listing.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-slate-200">{o.listing.name}</span>
                  <span className="shrink-0 text-xs text-slate-500">{relativeTime(o.listing.claimedAt, core.now)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
              <p className="pt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Next milestone</p>
              {[
                { label: "Outside owners", value: external.length, target: CLAIMED_TARGET },
                { label: "Paying sponsors", value: paying.length, target: SPONSORS_TARGET },
              ].map((m) => (
                <div key={m.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{m.label}</span>
                    <span className="tabular-nums text-white">
                      {m.value} / {m.target}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-brand-secondary" style={{ width: `${Math.min(100, (m.value / m.target) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-[11px] text-slate-500">Monthly revenue</p>
                  <p className="text-xl font-semibold text-white">${(paying.length * sponsoredPrice).toLocaleString("en-US")}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">At ${sponsoredPrice} a seat</p>
                  <p className="text-xl font-semibold text-white">{paying.length} sold</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile
            label="Listing views, 30 days"
            value={compact(traffic.viewTotal)}
            sub={traffic.crawlerViews > 0 ? `${compact(traffic.crawlerViews)} crawler views left out` : "Crawler traffic left out"}
            spark={traffic.views.map((p) => p.count)}
            delta={<Delta value={pctDelta(traffic.viewTotal, traffic.previousViewTotal)} />}
            href="/admin/dashboard/traffic"
          />
          <StatTile
            label="Contact clicks, 30 days"
            value={traffic.actionTotal}
            sub="Website, phone and directions taps"
            delta={<Delta value={pctDelta(traffic.actionTotal, traffic.previousActionTotal)} />}
            href="/admin/dashboard/traffic"
          />
          <StatTile
            label="Outreach sent, 7 days"
            value={sent7 ?? "-"}
            sub={data ? `${uniqueContacted.size} groomers emailed in total` : (outreach.reason ?? "Unavailable")}
            tone={outreach.state === "live" ? undefined : "warn"}
            href="/admin/dashboard/outreach"
          />
          <StatTile
            label="Claims, 30 days"
            value={claims30}
            sub={`${organic.length} ${organic.length === 1 ? "owner" : "owners"} found us without an outreach email`}
            href="/admin/dashboard/claims?view=all"
          />
          <StatTile label="Pet owner requests, 30 days" value={requests30} sub="Quote requests and groomer messages" href="/admin/dashboard/leads" />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            className="xl:col-span-2"
            title="Listing views per day"
            description={`Last 30 days, Pacific time. ${core.localEventCount ? `${core.localEventCount} views from localhost are not counted.` : ""}`}
          >
            <DailyChart
              days={traffic.views.map((p) => p.day)}
              series={[{ key: "views", label: "Listing views", color: "var(--color-adm-s1)" }]}
              values={traffic.views.map((p) => ({ views: p.count }))}
              extra={traffic.views.map((p) => p.crawler)}
            />
          </Panel>
          <Panel title="Outreach to owner" description="Every groomer the daily job has emailed, and how far each got.">
            {data ? (
              <Funnel
                steps={[
                  { label: "Emailed", value: uniqueContacted.size },
                  { label: "Delivered (no bounce)", value: delivered.length },
                  { label: "Claimed their listing", value: claimedFromOutreach.length },
                  { label: "Finished their profile", value: completeFromOutreach.length },
                  { label: "Paying sponsor", value: claimedFromOutreach.filter((s) => isPayingSponsor(core.listingByKey.get(s)!, core.now)).length },
                ]}
              />
            ) : (
              <Empty title="Outreach list unavailable">{outreach.reason}</Empty>
            )}
            <p className="mt-4 text-xs text-stone-500">
              {organic.length > 0 && `Plus ${organic.length} ${organic.length === 1 ? "owner" : "owners"} who claimed without an outreach email: ${organic.map((o) => o.listing.name).join(", ")}.`}
            </p>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Activity" description="Newest first, across signups, claims, owner emails, requests and outreach.">
            {feed.length === 0 ? (
              <Empty title="No activity yet" />
            ) : (
              <ol className="relative space-y-0.5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-adm-line">
                {feed.map((item, i) => {
                  const Icon = FEED_ICON[item.kind];
                  const body = (
                    <>
                      <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-adm-line bg-white">
                        <Icon className={`h-3.5 w-3.5 ${item.kind === "bounce" ? "text-red-600" : "text-teal-700"}`} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{item.text}</span>
                      <span className="shrink-0 text-[11px] text-stone-400">{item.dayOnly ? formatDay(item.at) : relativeTime(item.at, core.now)}</span>
                    </>
                  );
                  return (
                    <li key={`${item.at}-${i}`}>
                      {item.href ? (
                        <Link href={item.href} className="flex items-center gap-3 rounded-lg py-1.5 pr-2 hover:bg-adm-plane/60">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 py-1.5 pr-2">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          <Panel
            flush
            title="Warm leads"
            description="Unclaimed listings people looked at in the last 30 days. A view count is the best opener for an owner email."
            action={
              <Link href="/admin/dashboard/traffic#unclaimed" className="text-xs font-medium text-teal-700 hover:underline">
                All
              </Link>
            }
          >
            {warm.length === 0 ? (
              <div className="px-5 pb-5">
                <Empty title="No views on unclaimed listings yet" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Listing</th>
                    <th className={`${th} text-right`}>Views</th>
                    <th className={th}>Outreach</th>
                  </tr>
                </thead>
                <tbody>
                  {warm.map((l) => {
                    const c = contacts.get(l.slug);
                    return (
                      <tr key={l.id} className={rowCls}>
                        <td className={td}>
                          <a href={`/groomer/${l.slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                            {l.name}
                          </a>
                          <p className="text-xs text-stone-500">
                            {l.city}, {l.state}
                            {l.phone && <> · {l.phone}</>}
                          </p>
                        </td>
                        <td className={`${td} text-right font-semibold tabular-nums`}>{perListing.get(l.id)?.views ?? 0}</td>
                        <td className={td}>
                          {c?.status === "sent" ? (
                            <Pill tone="teal">Emailed {formatDay(c.sent)}</Pill>
                          ) : c?.status === "bounced" ? (
                            <Pill tone="fail">Bounced</Pill>
                          ) : c?.status === "no_email" || c?.status === "researched" ? (
                            <Pill tone="warn">Call: no email</Pill>
                          ) : l.email ? (
                            <Pill tone="neutral">Not yet</Pill>
                          ) : (
                            <Pill tone="neutral">
                              <Store className="h-3 w-3" aria-hidden /> No email on file
                            </Pill>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
