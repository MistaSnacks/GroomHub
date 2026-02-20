import { Check, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { PricingTier } from "@/lib/types";

interface PricingCardProps {
  tier: PricingTier;
  isAnnual: boolean;
}

export function PricingCard({ tier, isAnnual }: PricingCardProps) {
  const displayPrice = isAnnual ? tier.annualPrice : tier.price;

  return (
    <div
      className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col ${tier.isPopular
          ? "border-brand-secondary shadow-lg shadow-brand-secondary/10 scale-[1.02]"
          : "border-border"
        }`}
    >
      {tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-brand-secondary px-4 py-1 text-xs font-bold text-white shadow-sm">
            Most Pawpular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-[family-name:var(--font-fredoka)] text-xl font-semibold text-brand-primary">
          {tier.name}
        </h3>
        <p className="text-sm text-text-muted mt-1">{tier.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="font-[family-name:var(--font-fredoka)] text-4xl font-bold text-brand-primary">
            ${displayPrice}
          </span>
          {tier.price > 0 && (
            <span className="text-sm text-text-muted">/month</span>
          )}
        </div>
        {isAnnual && tier.price > 0 && (
          <p className="text-xs text-success mt-1">
            Save ${(tier.price - tier.annualPrice) * 12}/year
          </p>
        )}
      </div>

      <ul className="flex-1 space-y-3 mb-6">
        {tier.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-2.5">
            {feature.included ? (
              <Check weight="bold" className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            ) : (
              <X weight="bold" className="h-4 w-4 text-border mt-0.5 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${feature.included ? "text-text" : "text-text-muted/50"
                }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/for-groomers"
        className={`block text-center rounded-full py-3 px-6 text-sm font-semibold transition-colors ${tier.isPopular
            ? "bg-brand-secondary text-white hover:bg-brand-secondary/90"
            : tier.price === 0
              ? "bg-surface text-brand-primary hover:bg-border"
              : "bg-brand-primary text-white hover:bg-brand-primary/90"
          }`}
      >
        {tier.ctaText}
      </Link>
    </div>
  );
}
