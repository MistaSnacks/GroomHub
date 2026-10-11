import Link from "next/link";
import { loadCore, recentClicks, type ActionType } from "@/lib/admin-console/data";
import { Empty, PageBody, PageHeader, Panel, Pill, StatTile, rowCls, td, th, type Tone } from "../../_components/ui";

export const metadata = { title: "Recent clicks" };

const TYPE_LABEL: Record<ActionType, { label: string; tone: Tone }> = {
  website_click: { label: "Website", tone: "info" },
  phone_click: { label: "Phone", tone: "ok" },
  directions_click: { label: "Directions", tone: "teal" },
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ClicksPage() {
  const core = await loadCore();
  const clicks = recentClicks(core, 150);
  const dayAgo = core.now - 86_400_000;
  const weekAgo = core.now - 7 * 86_400_000;
  const lastDay = clicks.filter((c) => Date.parse(c.at) >= dayAgo).length;
  const lastWeek = clicks.filter((c) => Date.parse(c.at) >= weekAgo);
  const listingsThisWeek = new Set(lastWeek.map((c) => c.listing?.id ?? "?")).size;

  return (
    <>
      <PageHeader
        eyebrow="Know the market"
        title="Recent clicks"
        description="Every website, phone and directions tap on any listing, newest first. Times are Pacific. Refresh in the sidebar to pull the newest."
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatTile label="Last 24 hours" value={lastDay} />
          <StatTile label="Last 7 days" value={lastWeek.length} />
          <StatTile label="Listings tapped, 7 days" value={listingsThisWeek} />
        </div>

        <Panel title="Click feed" description={`The latest ${clicks.length} contact taps.`} flush>
          {clicks.length === 0 ? (
            <Empty title="No clicks yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={th}>When</th>
                    <th className={th}>Groomer</th>
                    <th className={th}>Tap</th>
                    <th className={th}>Owner</th>
                    <th className={th}>Tapped from</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.map((c, i) => {
                    const type = TYPE_LABEL[c.type];
                    return (
                      <tr key={`${c.at}-${i}`} className={rowCls}>
                        <td className={`${td} whitespace-nowrap tabular-nums text-stone-600`}>{when(c.at)}</td>
                        <td className={td}>
                          {c.listing ? (
                            <>
                              <a href={`/groomer/${c.listing.slug}`} target="_blank" className="font-medium text-brand-primary hover:underline">
                                {c.listing.name}
                              </a>
                              <span className="block text-xs text-stone-500">
                                {c.listing.city}, {c.listing.state}
                              </span>
                            </>
                          ) : (
                            <span className="text-stone-500">Deleted listing</span>
                          )}
                        </td>
                        <td className={td}>
                          <Pill tone={type.tone}>{type.label}</Pill>
                        </td>
                        <td className={td}>
                          {c.listing?.ownerId ? <Pill tone="ok">Claimed</Pill> : <Pill tone="neutral">Unclaimed</Pill>}
                        </td>
                        <td className={`${td} text-xs text-stone-500`}>
                          {c.fromPage ? <Link href={c.fromPage} target="_blank" className="hover:underline">{c.fromPage}</Link> : "Own profile"}
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
