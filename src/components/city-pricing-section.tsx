import { Dog, Cat, Van } from "@phosphor-icons/react/dist/ssr";
import type { PricingBreakdown } from "@/lib/city-pricing";

interface CityPricingSectionProps {
  cityName: string;
  pricing: PricingBreakdown;
  serviceLabel: string;
}

const SIZE_CONFIG = [
  { key: "small" as const, label: "Small Dogs", note: "Under 25 lbs", icon: Dog },
  { key: "medium" as const, label: "Medium Dogs", note: "25 to 50 lbs", icon: Dog },
  { key: "large" as const, label: "Large Dogs", note: "Over 50 lbs", icon: Dog },
];

export function CityPricingSection({ cityName, pricing, serviceLabel }: CityPricingSectionProps) {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-semibold text-brand-primary mb-2">
          {serviceLabel} Prices in {cityName}
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Typical price ranges based on dog size. Actual prices vary by breed, coat condition, and services selected.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SIZE_CONFIG.map(({ key, label, note, icon: Icon }) => {
            const range = pricing[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-border bg-bg/50 p-5 text-center"
              >
                <Icon weight="duotone" className="w-8 h-8 text-brand-secondary mx-auto mb-2" />
                <div className="font-heading text-lg font-semibold text-brand-primary">{label}</div>
                <div className="text-xs text-text-muted mb-3">{note}</div>
                <div className="text-2xl font-bold text-brand-primary">
                  ${range.min} to ${range.max}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
