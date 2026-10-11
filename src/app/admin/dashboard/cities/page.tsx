import { buildTraffic, loadCore, trafficByListing } from "@/lib/admin-console/data";
import { loadOutreach } from "@/lib/admin-console/outreach";
import { contactIndex } from "@/lib/admin-console/insights";
import { isSponsored } from "@/lib/listing-rules";
import { canonicalCityRouteSlug } from "@/lib/city-route";
import { PageBody, PageHeader, StatTile } from "../../_components/ui";
import { CitiesClient, type CityRow } from "./cities-client";

export const metadata = { title: "Cities" };

const SEATS_PER_CITY = 3;

export default async function CitiesPage() {
  const [core, outreach] = await Promise.all([loadCore(), loadOutreach()]);
  const traffic = buildTraffic(core, 90);
  const perListing = trafficByListing(core, traffic);
  const contacts = contactIndex(outreach.data);

  const groups = new Map<string, CityRow & { scoreSum: number }>();
  for (const l of core.listings) {
    const key = `${l.state}|${l.citySlug}`;
    const row =
      groups.get(key) ??
      ({
        slug: l.citySlug,
        href: `/dog-grooming/${l.state.toLowerCase()}/${canonicalCityRouteSlug(l.citySlug)}`,
        city: l.city,
        state: l.state,
        listings: 0,
        claimed: 0,
        seats: 0,
        avgScore: 0,
        views: 0,
        taps: 0,
        emailed: 0,
        withEmail: 0,
        scoreSum: 0,
      } satisfies CityRow & { scoreSum: number });
    row.listings++;
    row.scoreSum += l.score;
    if (l.ownerId) row.claimed++;
    if (isSponsored({ is_featured: l.isFeatured, sponsor_paid_until: l.sponsorPaidUntil }, core.now)) row.seats++;
    const t = perListing.get(l.id);
    row.views += t?.views ?? 0;
    row.taps += t?.actions ?? 0;
    const c = contacts.get(l.slug);
    if (c?.sent) row.emailed++;
    if (l.email || c?.email) row.withEmail++;
    groups.set(key, row);
  }
  const rows: CityRow[] = [...groups.values()].map(({ scoreSum, ...r }) => ({ ...r, avgScore: Math.round(scoreSum / r.listings) }));

  const thin = rows.filter((r) => r.listings < 3);
  const prune = thin.filter((r) => r.views === 0);
  const deep = rows.filter((r) => r.listings >= 10);
  const seatsUsed = rows.reduce((n, r) => n + r.seats, 0);
  const viewsInThin = thin.reduce((n, r) => n + r.views, 0);
  const totalViews = rows.reduce((n, r) => n + r.views, 0);
  const contested = rows.filter((r) => r.listings >= 10 && r.claimed > 0).length;

  return (
    <>
      <PageHeader
        eyebrow="Know the market"
        title="Cities"
        description="Every city page, with how deep its listings are and whether anyone is looking. Use it to choose where to push outreach, where Sponsored seats will sell, and which thin pages to prune."
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile label="Cities with listings" value={rows.length} sub={`${core.listings.length.toLocaleString("en-US")} listings across WA and OR`} />
          <StatTile label="Deep markets" value={deep.length} sub="10 or more listings. Where Sponsored seats can sell." />
          <StatTile
            label="Thin pages"
            value={thin.length}
            sub={`Under 3 listings. ${totalViews ? Math.round((viewsInThin / totalViews) * 100) : 0}% of listing views in 90 days.`}
            tone={thin.length > rows.length / 3 ? "warn" : undefined}
          />
          <StatTile label="Prune candidates" value={prune.length} sub="Thin and no listing views in 90 days" />
          <StatTile label="Sponsored seats in use" value={`${seatsUsed} of ${deep.length * SEATS_PER_CITY}`} sub={`Counting 3 seats in each deep market. ${contested} deep markets already have an owner.`} />
        </div>
        <CitiesClient rows={rows} />
        <p className="text-xs text-stone-500">
          Views and taps are for the groomer profiles in each city over 90 days, crawler days left out. City pages themselves are not logged by the site;
          Search Console on the Traffic page covers them once it is reconnected.
        </p>
      </PageBody>
    </>
  );
}
