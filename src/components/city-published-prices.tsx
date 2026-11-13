import Link from "next/link";
import {
  formatCollectedOn,
  PUBLISHED_PRICES_ARTICLE_PATH,
  type CityPublishedPrices,
} from "@/lib/city-price-tables";

interface CityPublishedPricesProps {
  cityName: string;
  prices: CityPublishedPrices;
}

export function CityPublishedPricesSection({ cityName, prices }: CityPublishedPricesProps) {
  return (
    <section className="bg-white pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-semibold text-brand-primary mb-2">
          Published grooming prices in {cityName}
        </h2>
        <p className="text-sm text-text-muted mb-6">
          These are starting prices published on {prices.groomerCount} {cityName} groomer websites, collected{" "}
          {formatCollectedOn(prices.collectedOn)}. They are not quotes. Half of the groomers fall inside the middle range. Read how we collected them in the{" "}
          <Link
            href={PUBLISHED_PRICES_ARTICLE_PATH}
            className="text-brand-accent underline hover:text-brand-primary"
          >
            dog grooming price index
          </Link>
          .
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-bg/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                <th scope="col" className="px-3 py-3 sm:px-4 font-semibold">Service</th>
                <th scope="col" className="px-3 py-3 sm:px-4 font-semibold">Median</th>
                <th scope="col" className="px-3 py-3 sm:px-4 font-semibold">Middle range</th>
                <th scope="col" className="px-3 py-3 sm:px-4 font-semibold">Groomers</th>
              </tr>
            </thead>
            <tbody>
              {prices.rows.map((row) => (
                <tr key={row.service} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-3 py-3 sm:px-4 font-medium text-brand-primary">{row.label}</th>
                  <td className="px-3 py-3 sm:px-4 font-heading text-lg font-semibold text-brand-primary">${row.median}</td>
                  <td className="px-3 py-3 sm:px-4 text-text-muted">${row.p25} to ${row.p75}</td>
                  <td className="px-3 py-3 sm:px-4 text-text-muted">{row.groomers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
