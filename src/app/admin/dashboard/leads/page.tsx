import Link from "next/link";
import { loadCore } from "@/lib/admin-console/data";
import { formatDateTime } from "@/lib/admin-console/metrics";
import { Empty, ExternalA, PageBody, PageHeader, Panel, Pill, prettyUrl, rowCls, td, th } from "../../_components/ui";
import { StatusButtons } from "./status-buttons";

export const metadata = { title: "Inbox" };

const TABS = [
  { key: "requests", label: "Quote requests" },
  { key: "messages", label: "Groomer messages" },
  { key: "submissions", label: "Listing requests" },
  { key: "staging", label: "Scraped, not imported" },
  { key: "newsletter", label: "Newsletter" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function Notified({ at, error }: { at: string | null; error: string | null }) {
  if (at) return <Pill tone="ok">Emailed {formatDateTime(at)}</Pill>;
  return (
    <Pill tone="fail" icon title={error ?? undefined}>
      Not emailed{error ? `: ${error.slice(0, 40)}` : ""}
    </Pill>
  );
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requested = (await searchParams).tab;
  const tab: TabKey = TABS.some((t) => t.key === requested) ? (requested as TabKey) : "requests";
  const core = await loadCore();

  const activeSubscribers = core.subscribers.filter((s) => !s.unsubscribedAt);
  const counts: Record<TabKey, { total: number; open: number }> = {
    requests: { total: core.quotes.length, open: core.quotes.filter((q) => q.status === "new").length },
    messages: { total: core.leads.length, open: core.leads.filter((l) => l.status === "new").length },
    submissions: { total: core.submissions.length, open: core.submissions.filter((s) => s.status === "new").length },
    staging: { total: core.staging.length, open: core.staging.filter((s) => s.status === "pending").length },
    newsletter: { total: activeSubscribers.length, open: 0 },
  };

  return (
    <>
      <PageHeader
        eyebrow="Run the business"
        title="Inbox"
        description="Everything people sent through the site: pet owners asking for quotes, messages to claimed groomers, businesses asking to be listed, plus scraped finds that never made it into the directory."
      />
      <PageBody>
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-adm-line bg-white p-1" aria-label="Inbox sections">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/dashboard/leads?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-brand-primary text-white" : "text-stone-600 hover:bg-adm-plane"}`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${tab === t.key ? "bg-white/20" : counts[t.key].open ? "bg-brand-accent/90 text-slate-900" : "bg-stone-100 text-stone-500"}`}>
                {counts[t.key].open || counts[t.key].total}
              </span>
            </Link>
          ))}
        </nav>

        {tab === "requests" && (
          <Panel flush title="Quote requests" description="Pet owners asking GroomLocal to find them a groomer. Each one should be answered within a day.">
            {core.quotes.length === 0 ? (
              <div className="px-5 pb-5">
                <Empty title="No quote requests yet">They arrive from the Get Quotes form and are emailed to QUOTE_NOTIFY_EMAIL.</Empty>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={th}>When</th>
                      <th className={th}>Who</th>
                      <th className={th}>Pet and services</th>
                      <th className={th}>City</th>
                      <th className={th}>Notification</th>
                      <th className={th}>Triage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {core.quotes.map((q) => (
                      <tr key={q.id} className={rowCls}>
                        <td className={`${td} whitespace-nowrap text-stone-500`}>{formatDateTime(q.createdAt)}</td>
                        <td className={td}>
                          <p className="font-medium text-brand-primary">{q.name}</p>
                          <a href={`mailto:${q.email}`} className="text-xs text-teal-700 hover:underline">
                            {q.email}
                          </a>
                          {q.phone && <p className="text-xs text-stone-500">{q.phone}</p>}
                        </td>
                        <td className={td}>
                          {q.petType}
                          {q.petBreed ? `, ${q.petBreed}` : ""}
                          <p className="text-xs text-stone-500">{q.services.join(", ")}</p>
                          {q.notes && <p className="mt-1 max-w-xs text-xs text-stone-500">{q.notes}</p>}
                        </td>
                        <td className={td}>{q.city}</td>
                        <td className={td}>
                          <Notified at={q.notifiedAt} error={q.notifyError} />
                        </td>
                        <td className={td}>
                          <StatusButtons kind="quote" id={q.id} status={q.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {tab === "messages" && (
          <Panel flush title="Groomer messages" description="Contact-form messages to claimed listings. The owner sees these in their own inbox; this is the copy for checking delivery.">
            {core.leads.length === 0 ? (
              <div className="px-5 pb-5">
                <Empty title="No messages to claimed listings yet" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className={th}>When</th>
                      <th className={th}>Listing</th>
                      <th className={th}>From</th>
                      <th className={th}>Message</th>
                      <th className={th}>Notification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {core.leads.map((l) => {
                      const listing = core.listingByKey.get(l.listingId);
                      return (
                        <tr key={l.id} className={rowCls}>
                          <td className={`${td} whitespace-nowrap text-stone-500`}>{formatDateTime(l.createdAt)}</td>
                          <td className={td}>
                            {listing ? (
                              <a href={`/groomer/${listing.slug}`} target="_blank" className="text-teal-700 hover:underline">
                                {listing.name}
                              </a>
                            ) : (
                              l.listingId
                            )}
                          </td>
                          <td className={td}>
                            <p className="font-medium text-brand-primary">{l.senderName}</p>
                            <a href={`mailto:${l.senderEmail}`} className="text-xs text-teal-700 hover:underline">
                              {l.senderEmail}
                            </a>
                          </td>
                          <td className={`${td} max-w-md whitespace-pre-wrap text-stone-700`}>{l.message}</td>
                          <td className={td}>
                            <Notified at={l.notifiedAt} error={l.notifyError} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {tab === "submissions" && (
          <Panel title="Listing requests" description="Businesses that used Get Listed. Add real ones to the directory by hand, then mark them handled.">
            {core.submissions.length === 0 ? (
              <Empty title="No listing requests" />
            ) : (
              <ul className="space-y-3">
                {core.submissions.map((s) => {
                  // Any two-letter state code in the city field other than WA/OR ("Washington, UT 84780").
                  const outOfRegion = (s.city.match(/\b[A-Z]{2}\b/g) ?? []).some((code) => code !== "WA" && code !== "OR");
                  return (
                    <li key={s.id} className="flex flex-col gap-3 rounded-xl border border-adm-line p-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-brand-primary">{s.businessName}</p>
                          <Pill tone={s.status === "new" ? "warn" : "neutral"}>{s.status}</Pill>
                          {outOfRegion && (
                            <Pill tone="fail" icon>
                              Looks outside WA/OR
                            </Pill>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-stone-500">
                          {s.city} · state field {s.state} · {formatDateTime(s.createdAt)}
                        </p>
                        <p className="mt-2 text-xs text-stone-600">
                          {s.contactName && <>{s.contactName} · </>}
                          <a href={`mailto:${s.email}`} className="text-teal-700 hover:underline">
                            {s.email}
                          </a>
                          {s.phone && <> · {s.phone}</>}
                          {s.website && (
                            <>
                              {" · "}
                              <ExternalA href={s.website.startsWith("http") ? s.website : `https://${s.website}`}>{prettyUrl(s.website)}</ExternalA>
                            </>
                          )}
                        </p>
                        {s.notes && <p className="mt-2 max-w-2xl rounded-lg bg-adm-plane/60 px-3 py-2 text-xs text-stone-600">{s.notes}</p>}
                      </div>
                      <StatusButtons kind="submission" id={s.id} status={s.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        )}

        {tab === "staging" && (
          <Panel flush title="Scraped, not imported" description="Rows in listings_staging from earlier scrapes. Read-only here; the import scripts decide what becomes a listing.">
            {core.staging.length === 0 ? (
              <div className="px-5 pb-5">
                <Empty title="Staging is empty" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Business</th>
                    <th className={th}>Address</th>
                    <th className={th}>Source</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {core.staging.map((s) => {
                    const exists = s.name ? core.listings.some((l) => l.name.toLowerCase() === s.name!.toLowerCase()) : false;
                    return (
                      <tr key={s.id} className={rowCls}>
                        <td className={td}>
                          <p className="font-medium text-brand-primary">{s.name ?? "(no name)"}</p>
                          {s.website && <ExternalA href={s.website} className="text-xs">{prettyUrl(s.website)}</ExternalA>}
                        </td>
                        <td className={`${td} text-xs text-stone-600`}>{s.address ?? "-"}</td>
                        <td className={`${td} text-xs`}>{s.sourceUrl ? <ExternalA href={s.sourceUrl}>{prettyUrl(s.sourceUrl).slice(0, 48)}</ExternalA> : "-"}</td>
                        <td className={td}>
                          <div className="flex flex-wrap gap-1">
                            <Pill tone="neutral">{s.status ?? "unknown"}</Pill>
                            {exists && <Pill tone="ok">Already listed</Pill>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        )}

        {tab === "newsletter" && (
          <Panel title="Newsletter" description={`${activeSubscribers.length} active, ${core.subscribers.length - activeSubscribers.length} unsubscribed.`}>
            {core.subscribers.length === 0 ? (
              <Empty title="No subscribers yet">The signup box on the blog writes here.</Empty>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>Email</th>
                    <th className={th}>Source</th>
                    <th className={th}>Subscribed</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {core.subscribers.map((s) => (
                    <tr key={s.id} className={rowCls}>
                      <td className={td}>{s.email}</td>
                      <td className={`${td} text-stone-500`}>{s.source ?? "-"}</td>
                      <td className={`${td} text-stone-500`}>{formatDateTime(s.subscribedAt)}</td>
                      <td className={td}>{s.unsubscribedAt ? <Pill tone="neutral">Unsubscribed</Pill> : <Pill tone="ok">Active</Pill>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        )}
      </PageBody>
    </>
  );
}
