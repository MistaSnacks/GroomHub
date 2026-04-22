import { PawPrint, MapPin, Scissors, CalendarBlank } from "@phosphor-icons/react/dist/ssr";

interface CityStatsBlockProps {
  groomerCount: number;
  metroCityCount: number;
  serviceCount: number;
  lastUpdated: string;
}

const stats = [
  { key: "groomers", icon: PawPrint, label: "Verified Groomers" },
  { key: "cities", icon: MapPin, label: "Nearby Cities" },
  { key: "services", icon: Scissors, label: "Services Available" },
  { key: "updated", icon: CalendarBlank, label: "Last Updated" },
] as const;

export function CityStatsBlock({
  groomerCount,
  metroCityCount,
  serviceCount,
  lastUpdated,
}: CityStatsBlockProps) {
  const values: Record<string, string | number> = {
    groomers: groomerCount,
    cities: metroCityCount,
    services: serviceCount,
    updated: lastUpdated,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
      {stats.map(({ key, icon: Icon, label }) => (
        <div
          key={key}
          className="rounded-xl border border-border bg-white px-4 py-3 text-center"
        >
          <Icon weight="duotone" className="w-5 h-5 text-brand-secondary mx-auto mb-1" />
          <div className="text-lg font-semibold text-brand-primary">{values[key]}</div>
          <div className="text-xs text-text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
