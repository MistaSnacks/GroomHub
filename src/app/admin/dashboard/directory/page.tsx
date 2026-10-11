import { buildTraffic, loadCore, trafficByListing } from "@/lib/admin-console/data";
import { loadOutreach } from "@/lib/admin-console/outreach";
import { contactIndex } from "@/lib/admin-console/insights";
import { QUALITY_CHECKS } from "@/lib/admin-console/metrics";
import { isSponsored } from "@/lib/listing-rules";
import { PageBody, PageHeader, Panel, StatTile } from "../../_components/ui";
import { DirectoryClient, type DirectoryFilters, type DirectoryRow } from "./directory-client";

export const metadata = { title: "Directory" };

type Params = Partial<Record<keyof DirectoryFilters, string | string[]>>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const [core, outreach] = await Promise.all([loadCore(), loadOutreach()]);
  const traffic = buildTraffic(core, 30);
  const perListing = trafficByListing(core, traffic);
  const contacts = contactIndex(outreach.data);

  const rows: DirectoryRow[] = core.listings.map((l) => {
    const c = contacts.get(l.slug);
    const t = perListing.get(l.id);
    return {
      id: l.id,
      slug: l.slug,
      name: l.name,
      city: l.city,
      state: l.state,
      score: l.score,
      missing: l.missing,
      photos: l.photoCount,
      phone: l.phone,
      website: l.website,
      hasEmail: !!l.email,
      outreachEmail: !l.email && c?.status === "sent" && !!c.email,
      claimed: !!l.ownerId,
      sponsored: isSponsored({ is_featured: l.isFeatured, sponsor_paid_until: l.sponsorPaidUntil }, core.now),
      views: t?.views ?? 0,
      taps: t?.actions ?? 0,
      contact: c?.status ?? null,
      contactSent: c?.sent ?? null,
    };
  });

  const total = core.listings.length;
  const coverage = QUALITY_CHECKS.map((check) => {
    const n = core.listings.filter((l) => check.pass(l)).length;
    return { ...check, n, pct: total ? (n / total) * 100 : 0 };
  }).sort((a, b) => b.pct - a.pct);
  const avgScore = Math.round(core.listings.reduce((n, l) => n + l.score, 0) / Math.max(total, 1));
  const strong = core.listings.filter((l) => l.score >= 75).length;
  const outreachEmails = rows.filter((r) => r.outreachEmail).length;

  const initial: DirectoryFilters = {
    q: one(params.q),
    state: one(params.state),
    owner: one(params.owner),
    outreach: one(params.outreach),
    missing: one(params.missing),
    sort: one(params.sort) || "views",
  };

  return (
    <>
      <PageHeader
        eyebrow="Know the market"
        title="Directory"
        description="Every listing on the site, scored for how useful it is to a dog owner deciding who to call. Filter to find what to fix, who to email and who to call."
      />
      <PageBody>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="grid grid-cols-2 gap-4 xl:col-span-1 xl:grid-cols-1">
            <StatTile label="Average listing quality" value={`${avgScore} / 100`} sub="Weighted: photos, website, email, description, phone, services, logo, price, booking" tone={avgScore < 50 ? "warn" : undefined} />
            <StatTile label="Strong listings" value={strong} sub={`Quality 75 or higher, of ${total.toLocaleString("en-US")}`} />
            <StatTile
              label="Emails outreach found but the listing lacks"
              value={outreachEmails}
              sub="Delivered outreach addresses missing from business_listings.email"
              href="/admin/dashboard/directory?outreach=sent&missing=email"
            />
          </div>
          <Panel className="xl:col-span-2" title="Field coverage" description="Share of all listings that have each field. The weakest fields hold the whole directory back.">
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {coverage.map((c) => (
                <li key={c.key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-stone-700">
                      {c.label}
                      <span className="text-stone-400"> · weight {c.weight}</span>
                    </span>
                    <span className="tabular-nums">
                      <span className="font-semibold text-brand-primary">{Math.round(c.pct)}%</span>
                      <span className="text-stone-400"> ({c.n.toLocaleString("en-US")})</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-teal-50">
                    <div className="h-full rounded-full bg-adm-s1" style={{ width: `${Math.max(c.pct, c.n ? 0.8 : 0)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <DirectoryClient rows={rows} initial={initial} />
      </PageBody>
    </>
  );
}
