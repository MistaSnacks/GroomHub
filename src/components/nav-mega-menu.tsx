import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, PawPrint } from "@phosphor-icons/react/dist/ssr";
import { stateSlugFromAbbr } from "@/lib/geography";
import { getServiceLabel, getSpecialtyLabel } from "@/lib/tags";
import { ServiceTagIcon } from "./service-tag-icon";
import type { CityWithCount } from "@/lib/types";

const STATES = [
  { label: "Washington", abbr: "WA" },
  { label: "Oregon", abbr: "OR" },
];
const SERVICES = ["full-groom", "dog-bath", "nail-care", "mobile-grooming", "cat-grooming", "deshedding"];
const SPECIALTIES = ["doodle-poodle", "fear-free", "senior-pets", "large-dogs", "cat-specialist", "matted-coats"];

const HEAD = "mb-2 px-2 text-xs font-bold uppercase tracking-[0.1em]";
const ITEM =
  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-brand-primary transition-colors hover:bg-[#E3F8F5]";
const DOT = "flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]";
const ALL = "mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold hover:underline";

/** The "Find a groomer" panel of the desktop header: cities, services and specialties, with a way to quotes. */
export function NavMegaMenu({ cities, onNavigate }: { cities: CityWithCount[]; onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-[1.5fr_0.9fr_1.15fr_0.9fr] gap-5 xl:grid-cols-[1.5fr_1fr_1fr_1.1fr] xl:gap-8">
      <div>
        <p className={`${HEAD} text-[#0F766E]`}>Cities</p>
        <div className="grid grid-cols-2 gap-x-3">
          {STATES.map(({ label, abbr }) => (
            <div key={abbr}>
              <Link
                href={`/dog-grooming/${stateSlugFromAbbr(abbr)}`}
                onClick={onNavigate}
                className="block rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-[#E3F8F5]"
              >
                {label}
              </Link>
              <ul>
                {cities
                  .filter((city) => city.state_abbr === abbr)
                  .slice(0, 5)
                  .map((city) => (
                    <li key={city.slug}>
                      <Link href={`/dog-grooming/${stateSlugFromAbbr(abbr)}/${city.slug}`} onClick={onNavigate} className={ITEM}>
                        <span className={`${DOT} bg-[#E3F8F5] text-[#0F766E]`}>
                          <MapPin weight="fill" className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{city.name}</span>
                        <span className="ml-auto hidden text-xs text-slate-500 xl:inline">{city.groomer_count}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href="/dog-grooming" onClick={onNavigate} className={`${ALL} text-[#0F766E]`}>
          All cities <ArrowRight weight="bold" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div>
        <p className={`${HEAD} text-[#0F766E]`}>Services</p>
        <ul>
          {SERVICES.map((slug) => (
            <li key={slug}>
              <Link href={`/services/${slug}`} onClick={onNavigate} className={ITEM}>
                <span className={`${DOT} bg-[#E3F8F5] text-[#0F766E]`}>
                  <ServiceTagIcon slug={slug} className="h-4 w-4" />
                </span>
                <span className="truncate">{getServiceLabel(slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/services" onClick={onNavigate} className={`${ALL} text-[#0F766E]`}>
          All services <ArrowRight weight="bold" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div>
        <p className={`${HEAD} text-brand-accent-ink`}>Specialties</p>
        <ul>
          {SPECIALTIES.map((slug) => (
            <li key={slug}>
              <Link href={`/specialties/${slug}`} onClick={onNavigate} className={`${ITEM} hover:bg-[#FFE9E4]`}>
                <span className={`${DOT} bg-[#FFE9E4] text-brand-accent-ink`}>
                  <PawPrint weight="fill" className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{getSpecialtyLabel(slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/specialties" onClick={onNavigate} className={`${ALL} text-brand-accent-ink`}>
          All specialties <ArrowRight weight="bold" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="paws-teal flex flex-col rounded-2xl bg-[#E3F8F5] p-4 xl:p-5">
        <Image
          src="/maui-assets/maui-choosing-groomer-blog.png?v=maui-20260904-alpha1"
          alt=""
          width={240}
          height={240}
          sizes="112px"
          className="mx-auto -mt-1 mb-1 aspect-square w-28 select-none object-contain"
        />
        <p className="font-heading text-xl font-semibold leading-tight text-brand-primary">Not sure where to start?</p>
        <p className="mt-1 text-sm text-slate-700">Tell us what care your pet needs and where.</p>
        <Link
          href="/get-quotes"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center justify-center self-start rounded-full bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-fun-pop"
        >
          Get Free Quotes
        </Link>
      </div>
    </div>
  );
}
