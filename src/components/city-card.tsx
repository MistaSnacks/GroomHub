import Link from "next/link";
import { ArrowRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import type { CityWithCount } from "@/lib/types";
import { stateSlugFromAbbr, buildCityPath } from "@/lib/geography";

interface CityCardProps {
  city: CityWithCount;
  index?: number;
  size?: "large" | "medium" | "small";
}

export function CityCard({ city, index = 0, size = "small" }: CityCardProps) {
  const stateSlug = stateSlugFromAbbr(city.state_abbr);
  const isLarge = size === "large";

  return (
    <Link
      href={buildCityPath(stateSlug, city.slug)}
      className={`card-lift bg-white rounded-2xl border border-border flex items-center justify-between group animate-fade-slide-up ${isLarge ? "p-6" : "p-5"}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-secondary ${isLarge ? "h-12 w-12" : "h-10 w-10"}`}>
          <MapPin weight="duotone" className={isLarge ? "w-6 h-6" : "w-5 h-5"} />
        </div>
        <div>
          <h3 className={`font-heading font-semibold text-brand-primary leading-tight ${isLarge ? "text-lg" : "text-base"}`}>
            {city.name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">{city.state_abbr}</p>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <div className={`font-semibold text-text ${isLarge ? "text-lg" : "text-sm"}`}>{city.groomer_count}</div>
          <div className="text-xs text-text-muted">groomers</div>
        </div>
        <ArrowRight weight="bold" className="w-4 h-4 text-text-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
