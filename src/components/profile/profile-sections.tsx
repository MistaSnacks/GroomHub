import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { getServiceLabel, getServiceTag } from "@/lib/tags";
import { isDefaultHours, SERVICES_NOT_LISTED_LINE, UNCONFIRMED_HOURS_LINE } from "@/lib/listing-facts";
import { dollars, harvestedServiceLabel, seenOnLabel, type HarvestedPriceSet } from "@/lib/harvested-prices";

/** Profile "Services" card. Unknown services (see listing-facts) show one neutral line, not a guessed list. */
export function ServicesSection({ listing }: { listing: { listed_service_tags: string[] } }) {
  const tags = listing.listed_service_tags;
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">Services</h2>
      {tags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tags.map((slug) => {
            const tag = getServiceTag(slug);
            return (
              <div key={slug} className="rounded-xl bg-brand-secondary/5 border border-brand-secondary/15 p-3">
                <span className="text-sm font-semibold text-brand-primary">{getServiceLabel(slug)}</span>
                {tag?.description && <p className="text-xs text-text-muted mt-1 leading-relaxed">{tag.description}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{SERVICES_NOT_LISTED_LINE}</p>
      )}
    </div>
  );
}

/** Prices read off the groomer's own website. Callers check shouldShowHarvestedPrices() first. */
export function HarvestedPricesSection({ name, set }: { name: string; set: HarvestedPriceSet }) {
  const seen = seenOnLabel(set.seenOn);
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-heading text-xl font-semibold text-brand-primary mb-1">Prices from their website</h2>
      <p className="text-xs text-text-muted mb-4">Seen on their website, {seen}. Prices change, so check with {name} before you book.</p>
      <div className="divide-y divide-border">
        {set.prices.map((p) => (
          <div key={p.service} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
            <span className="text-sm font-medium text-text">{harvestedServiceLabel(p.service)}</span>
            <span className="flex items-baseline gap-3 text-sm">
              <span className="font-semibold text-brand-primary">Starting at {dollars(p.from)}</span>
              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs text-brand-accent hover:underline">
                Source <ArrowSquareOut weight="bold" className="h-3 w-3" aria-hidden />
                <span className="sr-only">for the {harvestedServiceLabel(p.service).toLowerCase()} price</span>
              </a>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HoursEntry {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

/** "Business Hours" card. The import's default week shows as unconfirmed instead of as fact. */
export function HoursSection({ hours }: { hours: HoursEntry[] | null | undefined }) {
  if (!Array.isArray(hours) || hours.length === 0) return null;
  const unconfirmed = isDefaultHours(hours);
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">Business Hours</h2>
      {unconfirmed ? (
        <p className="text-sm text-text-muted">{UNCONFIRMED_HOURS_LINE}</p>
      ) : (
        <div className="divide-y divide-border">
          {hours.map((h) => (
            <div key={h.day} className="flex items-center justify-between py-2.5">
              <span className="text-sm font-medium text-text">{h.day}</span>
              <span className={`text-sm ${h.closed ? "text-fun-pop" : "text-text-muted"}`}>{h.closed ? "Closed" : `${h.open} - ${h.close}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
