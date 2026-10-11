import { Camera, Globe, Mail, Phone } from "lucide-react";
import { buildTraffic, loadCore, ownerRecords, trafficByListing, type OwnerRecord } from "@/lib/admin-console/data";
import { loadOutreach } from "@/lib/admin-console/outreach";
import { contactIndex, daysToClaim, externalOwners } from "@/lib/admin-console/insights";
import { formatDay, relativeTime } from "@/lib/admin-console/metrics";
import { FIRST_REMINDER_AFTER_DAYS, MAX_REMINDERS, REMINDER_EVERY_DAYS, reminderDecision } from "@/lib/owner-reminders";
import { FREE_PROMO_ENDS_AT } from "@/lib/listing-rules";
import { MIN_PHOTOS } from "@/lib/profile-completeness";
import { listingSearchStats, searchConsoleConfigured, searchWindow, type PageSearchStats } from "@/lib/search-console";
import { reportPeriod } from "@/lib/owner-report";
import { siteLinksToGroomLocal, type SiteLinkState } from "@/lib/admin-console/website-links";
import { Empty, ExternalA, Meter, PageBody, PageHeader, Panel, Pill, StatTile, prettyUrl } from "../../_components/ui";
import { OwnerActions } from "./owner-actions";

export const metadata = { title: "Owners" };

const GAP_LABEL: Record<string, string> = {
  photos: "photos",
  logo: "logo",
  description: "description",
  services: "services",
  specialties: "specialties",
};

function reminderLine(o: OwnerRecord, now: number, enabled: boolean): { text: string; tone: "ok" | "warn" | "neutral" | "info" } {
  if (o.listing.gaps.length === 0) return { text: "Profile complete, no reminders needed", tone: "ok" };
  if (o.optedOut) return { text: "Turned off profile reminders", tone: "neutral" };
  const events = o.emails.map((e) => ({ kind: e.kind as "claim_approved" | "profile_reminder" | "monthly_report", sent_at: e.sentAt }));
  const decision = reminderDecision({ claimedAt: o.listing.claimedAt, events, now: new Date(now) });
  const sent = events.filter((e) => e.kind === "profile_reminder").length;
  const suffix = enabled ? "" : " (reminders are switched off)";
  if (decision.due) return { text: `Reminder ${decision.sequence} of ${MAX_REMINDERS} is due${suffix}`, tone: enabled ? "warn" : "neutral" };
  if (decision.reason === "max_reached") return { text: `All ${MAX_REMINDERS} reminders sent, profile still thin`, tone: "warn" };
  if (decision.reason === "too_soon") {
    const lastTouch = Math.max(Date.parse(o.listing.claimedAt ?? "") || 0, ...events.map((e) => Date.parse(e.sent_at)));
    const wait = sent === 0 ? FIRST_REMINDER_AFTER_DAYS : REMINDER_EVERY_DAYS;
    return { text: `Reminder ${sent + 1} of ${MAX_REMINDERS} on ${formatDay(new Date(lastTouch + wait * 86_400_000).toISOString())}${suffix}`, tone: "info" };
  }
  return { text: "Not claimed", tone: "neutral" };
}

const EMAIL_LABEL: Record<string, string> = {
  claim_approved: "welcome email",
  profile_reminder: "profile reminder",
  monthly_report: "monthly report",
};

/** The 3rd of next month, when the monthly report cron runs. */
function nextReportDay(now: number): string {
  const d = new Date(now);
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + (d.getUTCDate() >= 3 ? 1 : 0), 3, 18));
  return formatDay(next.toISOString());
}

function badgeLine(o: OwnerRecord, site: SiteLinkState | null, badgeViews: number, now: number): { text: string; tone: "ok" | "neutral" } {
  const live = o.badges[0];
  if (live) {
    const more = o.badges.length > 1 ? ` (+${o.badges.length - 1} more)` : "";
    const clicks = badgeViews ? `, ${badgeViews} ${badgeViews === 1 ? "visit" : "visits"} from it in 30 days` : "";
    return { text: `Badge on ${live.host}${more}, last loaded ${relativeTime(live.lastSeen, now)}${clicks}`, tone: "ok" };
  }
  if (site === "links") return { text: "Their homepage links to GroomLocal (badge uploaded as an image, or a text link)", tone: "ok" };
  if (site === "unreachable") return { text: "No badge seen; could not read their homepage", tone: "neutral" };
  if (site === "no_link") return { text: "No badge yet, and no link to us on their homepage", tone: "neutral" };
  return { text: "No badge yet (no website on the listing)", tone: "neutral" };
}

export default async function OwnersPage() {
  const [core, outreach] = await Promise.all([loadCore(), loadOutreach()]);
  const traffic = buildTraffic(core, 30);
  const perListing = trafficByListing(core, traffic);
  const contacts = contactIndex(outreach.data);
  const owners = ownerRecords(core);
  const external = externalOwners(owners);
  const remindersEnabled = process.env.PROFILE_REMINDERS_ENABLED === "true";
  const promoOpen = core.now < Date.parse(FREE_PROMO_ENDS_AT);
  const reportsEnabled = process.env.OWNER_REPORTS_ENABLED === "true";
  const period = reportPeriod(new Date(core.now));

  const window28 = searchWindow(core.today, 28);
  let google: Map<string, PageSearchStats> | null = null;
  let googleError: string | null = searchConsoleConfigured() ? null : "Search Console is not configured";
  if (!googleError) {
    try {
      google = await listingSearchStats(window28.startDate, window28.endDate);
    } catch (err) {
      googleError = err instanceof Error ? err.message : String(err);
    }
  }
  const siteChecks = new Map<string, SiteLinkState>(
    await Promise.all(
      owners
        .filter((o) => o.listing.website && o.badges.length === 0)
        .map(async (o) => [o.listing.id, await siteLinksToGroomLocal(o.listing.website!)] as const)
    )
  );
  const withBadge = external.filter((o) => o.badges.length > 0 || siteChecks.get(o.listing.id) === "links").length;

  const complete = external.filter((o) => o.listing.gaps.length === 0).length;
  const sponsored = owners.filter((o) => o.sponsored).length;
  const signedInRecently = external.filter((o) => o.user?.lastSignInAt && core.now - Date.parse(o.user.lastSignInAt) < 7 * 86_400_000).length;

  return (
    <>
      <PageHeader
        eyebrow="Run the business"
        title="Owners"
        description="Everyone who has claimed a listing: how they found us, how finished their profile is, what we have emailed them, and what their listing is doing."
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Outside owners" value={external.length} sub={`${owners.length - external.length} of your own accounts or the house listing not counted`} />
          <StatTile label="Finished profiles" value={`${complete} of ${external.length}`} sub="Photos, logo, description, services, specialties" tone={complete < external.length ? "warn" : "ok"} />
          <StatTile label="Signed in this week" value={signedInRecently} sub="Outside owners only" />
          <StatTile label="Sponsored spots in use" value={sponsored} sub={promoOpen ? "Free promo available through Dec 31" : "Promo window closed"} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <p className="rounded-xl border border-adm-line bg-white px-4 py-3 text-xs text-stone-600">
            <strong className="text-stone-800">Website badges: {withBadge} of {external.length}</strong> outside owners link to us. A badge counts
            when its image loads from their site, or when their homepage links to groomlocal.com.
          </p>
          <p className="rounded-xl border border-adm-line bg-white px-4 py-3 text-xs text-stone-600">
            <strong className="text-stone-800">Monthly reports {reportsEnabled ? "are on" : "are off"}.</strong>{" "}
            {reportsEnabled
              ? `Next run ${nextReportDay(core.now)}.`
              : "Set OWNER_REPORTS_ENABLED=true in Vercel to send them on the 3rd of each month."}{" "}
            Use Preview on a card to see the {period.label} email.
            {googleError && <span className="block pt-1 text-amber-700">Google numbers unavailable: {googleError}</span>}
          </p>
        </div>

        {!remindersEnabled && (
          <p className="rounded-xl border border-adm-line bg-white px-4 py-3 text-xs text-stone-600">
            PROFILE_REMINDERS_ENABLED is not &quot;true&quot; in this environment, so the daily reminder cron sends nothing from here. The dates below show
            when each reminder would go out if it were on. Production has its own setting in Vercel.
          </p>
        )}

        {owners.length === 0 ? (
          <Empty title="No claimed listings yet" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {owners.map((o) => {
              const l = o.listing;
              const t = perListing.get(l.id);
              const contact = contacts.get(l.slug);
              const d = daysToClaim(l, contact);
              const reminder = reminderLine(o, core.now, remindersEnabled);
              const lapsed = l.isFeatured && !o.sponsored;
              const g = google?.get(l.slug);
              const badge = badgeLine(o, siteChecks.get(l.id) ?? null, t?.badgeViews ?? 0, core.now);
              return (
                <Panel key={l.id} className={o.house || o.user?.internal ? "opacity-80" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a href={`/groomer/${l.slug}`} target="_blank" className="font-heading text-lg font-semibold leading-snug text-brand-primary hover:underline">
                        {l.name}
                      </a>
                      <p className="text-xs text-stone-500">
                        {l.city}, {l.state} · claimed {formatDay(l.claimedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {o.house && <Pill tone="neutral">House listing</Pill>}
                      {o.user?.internal && !o.house && <Pill tone="neutral">Your account</Pill>}
                      {o.sponsored && <Pill tone="warn">{l.sponsorComp ? `Free spot to ${formatDay(l.sponsorPaidUntil)}` : "Sponsored"}</Pill>}
                      {lapsed && <Pill tone="neutral">Spot ended</Pill>}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-stone-600">
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-stone-400" aria-hidden />
                      {o.user ? (
                        <a href={`mailto:${o.user.email}`} className="truncate text-teal-700 hover:underline">
                          {o.user.email}
                        </a>
                      ) : (
                        <span className="text-red-700">Owner account not found</span>
                      )}
                      <span className="ml-auto shrink-0 text-stone-400">signed in {relativeTime(o.user?.lastSignInAt, core.now)}</span>
                    </p>
                    {l.website && (
                      <p className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-stone-400" aria-hidden />
                        <ExternalA href={l.website} className="truncate">
                          {prettyUrl(l.website)}
                        </ExternalA>
                      </p>
                    )}
                    {l.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-stone-400" aria-hidden />
                        <a href={`tel:${l.phone}`} className="tabular-nums hover:underline">
                          {l.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 rounded-xl bg-adm-plane/60 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700">Profile</span>
                      <span className="inline-flex items-center gap-1 text-stone-500">
                        <Camera className="h-3 w-3" aria-hidden /> {l.photoCount} photos
                      </span>
                    </div>
                    <Meter value={l.score} label="Listing quality score" />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {l.gaps.length === 0 ? (
                        <Pill tone="ok" icon>
                          Nothing missing
                        </Pill>
                      ) : (
                        l.gaps.map((g) => (
                          <Pill key={g} tone="warn">
                            {g === "photos" ? `photos ${l.photoCount}/${MIN_PHOTOS}` : `no ${GAP_LABEL[g]}`}
                          </Pill>
                        ))
                      )}
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    <div className="rounded-lg border border-adm-line py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-stone-500">Views 30d</dt>
                      <dd className="text-lg font-semibold tabular-nums text-brand-primary">{t?.views ?? 0}</dd>
                    </div>
                    <div className="rounded-lg border border-adm-line py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-stone-500">Clicks 30d</dt>
                      <dd className="text-lg font-semibold tabular-nums text-brand-primary">{t?.actions ?? 0}</dd>
                    </div>
                    <div className="rounded-lg border border-adm-line py-2" title={g?.queries[0] ? `Top search: ${g.queries[0].query}` : undefined}>
                      <dt className="text-[10px] uppercase tracking-wide text-stone-500">Google 28d</dt>
                      <dd className="text-lg font-semibold tabular-nums text-brand-primary">{google ? (g?.impressions ?? 0) : "–"}</dd>
                    </div>
                    <div className="rounded-lg border border-adm-line py-2">
                      <dt className="text-[10px] uppercase tracking-wide text-stone-500">Emails</dt>
                      <dd className="text-lg font-semibold tabular-nums text-brand-primary">{o.emails.length}</dd>
                    </div>
                  </dl>

                  <ul className="mt-4 space-y-1 text-xs text-stone-600">
                    <li>
                      <span className="text-stone-400">Found us: </span>
                      {contact?.sent ? `outreach email ${formatDay(contact.sent)}${d !== null ? `, claimed ${d === 0 ? "the same day" : `${d} ${d === 1 ? "day" : "days"} later`}` : ""}` : "on their own, no outreach email first"}
                    </li>
                    {o.emails
                      .slice()
                      .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
                      .map((e) => (
                        <li key={`${e.kind}-${e.sentAt}`}>
                          <span className="text-stone-400">{formatDay(e.sentAt)}: </span>
                          {EMAIL_LABEL[e.kind] ?? e.kind}
                        </li>
                      ))}
                    <li className={reminder.tone === "warn" ? "text-amber-700" : reminder.tone === "ok" ? "text-emerald-700" : ""}>
                      <span className="text-stone-400">Next: </span>
                      {reminder.text}
                    </li>
                    {g?.queries[0] && (
                      <li>
                        <span className="text-stone-400">Top Google search: </span>&ldquo;{g.queries[0].query}&rdquo; ({g.queries[0].impressions})
                      </li>
                    )}
                    <li className={badge.tone === "ok" ? "text-emerald-700" : ""}>
                      <span className="text-stone-400">Website: </span>
                      {badge.text}
                    </li>
                    <li>
                      <span className="text-stone-400">Monthly report: </span>
                      {o.optedOut ? "turned off by the owner" : reportsEnabled ? `next on ${nextReportDay(core.now)}` : "off"} ·{" "}
                      <a href={`/admin/dashboard/listings/report/${l.slug}`} className="text-teal-700 hover:underline">
                        Preview {period.label}
                      </a>
                    </li>
                  </ul>

                  <div className="mt-4 border-t border-adm-line pt-3">
                    <OwnerActions slug={l.slug} name={l.name} sponsored={o.sponsored} lapsed={lapsed} promoOpen={promoOpen} />
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </PageBody>
    </>
  );
}
