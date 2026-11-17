import { BandMaui, type BandMauiPose } from "@/components/band-maui";
import { PawPrint, MapPin, Scissors, CalendarBlank } from "@phosphor-icons/react/dist/ssr";

interface CityStatsBlockProps {
  groomerCount: number;
  metroCityCount: number;
  serviceCount: number;
  lastUpdated: string;
  /** Maui sits on the right end of the tiles when the page header is a band. */
  pose?: BandMauiPose;
}

const stats = [
  { key: "groomers", icon: PawPrint, label: "Listed Groomers" },
  { key: "cities", icon: MapPin, label: "Nearby Cities" },
  { key: "services", icon: Scissors, label: "Services Available" },
  { key: "updated", icon: CalendarBlank, label: "Last Updated" },
] as const;

export function CityStatsBlock({
  groomerCount,
  metroCityCount,
  serviceCount,
  lastUpdated,
  pose,
}: CityStatsBlockProps) {
  const values: Record<string, string | number> = {
    groomers: groomerCount,
    cities: metroCityCount,
    services: serviceCount,
    updated: lastUpdated,
  };

  return (
    <div className={`relative ${pose ? "mt-[4.25rem] lg:mt-5" : "mt-5"}`}>
      {pose && <BandMaui pose={pose} className="bottom-[calc(100%-8px)] right-3 w-20 lg:bottom-[calc(100%-10px)] lg:w-[clamp(104px,9vw,140px)]" />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ key, icon: Icon, label }) => (
          <div
            key={key}
            className="band-card rounded-xl border border-border bg-white px-4 py-3 text-center"
          >
            <Icon weight="duotone" className="w-5 h-5 text-brand-secondary mx-auto mb-1" />
            <div className="text-lg font-semibold text-brand-primary">{values[key]}</div>
            <div className="text-xs text-text-muted">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
