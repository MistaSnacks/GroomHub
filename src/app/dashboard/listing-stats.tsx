import { OWNER_METRIC_LABELS } from "@/lib/real-visits";
import type { StatsPeriod } from "@/lib/owner-dashboard-stats";

export const NO_STATS_LINE = "Your listing stats will appear here once there is enough activity to report.";

/** The listing's numbers on the owner dashboard. Periods arrive already filtered to the metrics that qualify. */
export function ListingStats({ periods }: { periods: StatsPeriod[] }) {
  if (periods.length === 0) {
    return <p className="text-sm text-text-muted mb-4">{NO_STATS_LINE}</p>;
  }
  return (
    <div className="mb-4 flex flex-col gap-3">
      {periods.map((p) => (
        <section key={p.label} aria-label={p.label}>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">{p.label}</h4>
          <dl className="grid grid-cols-2 gap-2">
            {p.metrics.map((m) => (
              <div key={m.key} className="rounded-xl border border-border px-3 py-2">
                <dt className="text-xs text-text-muted">{OWNER_METRIC_LABELS[m.key].label}</dt>
                <dd className="font-heading text-xl font-bold text-brand-primary tabular-nums">{m.value.toLocaleString("en-US")}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
