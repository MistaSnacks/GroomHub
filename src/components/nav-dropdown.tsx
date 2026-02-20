"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CaretDown, MapPin, Scissors, PawPrint } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { STATES, stateSlugFromAbbr, stateNameFromAbbr } from "@/lib/geography";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import type { CityWithCount } from "@/lib/types";

interface NavDropdownProps {
  label: string;
  type: "cities" | "services" | "specialties";
  cities?: CityWithCount[];
}

export function NavDropdown({ label, type, cities = [] }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium text-text-muted hover:text-brand-primary transition-colors"
      >
        {label}
        <CaretDown
          weight="bold"
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 min-w-[320px] rounded-xl border border-border bg-white shadow-lg overflow-hidden"
          >
            {type === "cities" ? (
              <CitiesDropdown cities={cities} onClose={() => setOpen(false)} />
            ) : type === "services" ? (
              <ServicesDropdown onClose={() => setOpen(false)} />
            ) : (
              <SpecialtiesDropdown onClose={() => setOpen(false)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CitiesDropdown({
  cities,
  onClose,
}: {
  cities: CityWithCount[];
  onClose: () => void;
}) {
  const waCities = cities.filter((c) => c.state_abbr === "WA").slice(0, 8);
  const orCities = cities.filter((c) => c.state_abbr === "OR").slice(0, 8);

  return (
    <div className="p-4 grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
      {[
        { label: "Washington", abbr: "WA", list: waCities },
        { label: "Oregon", abbr: "OR", list: orCities },
      ].map(({ label, abbr, list }) => (
        <div key={abbr}>
          <Link
            href={`/dog-grooming/${stateSlugFromAbbr(abbr)}`}
            onClick={onClose}
            className="text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-brand-primary transition-colors mb-2 block"
          >
            {label}
          </Link>
          <ul className="space-y-1">
            {list.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/dog-grooming/${stateSlugFromAbbr(abbr)}/${city.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-text hover:bg-surface transition-colors"
                >
                  <MapPin weight="fill" className="w-3 h-3 text-brand-secondary shrink-0" />
                  {city.name}
                  <span className="text-[10px] text-text-muted ml-auto">
                    {city.groomer_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="col-span-2 pt-2 border-t border-border">
        <Link
          href="/dog-grooming"
          onClick={onClose}
          className="text-xs font-medium text-brand-primary hover:underline"
        >
          View all cities
        </Link>
      </div>
    </div>
  );
}

function ServicesDropdown({ onClose }: { onClose: () => void }) {
  const topServices = SERVICE_TAGS.filter((t) =>
    ["full-groom", "cat-grooming", "nail-care", "dog-bath", "mobile-grooming", "self-wash", "teeth-cleaning", "deshedding", "puppy-grooming", "creative-grooming"].includes(t.slug)
  );

  return (
    <div className="p-4 max-h-[400px] overflow-y-auto w-[280px]">
      <ul className="space-y-1">
        {topServices.map((tag) => (
          <li key={tag.slug}>
            <Link
              href={`/services/${tag.slug}`}
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-text hover:bg-surface transition-colors"
            >
              <Scissors weight="duotone" className="w-4 h-4 text-brand-secondary shrink-0" />
              {tag.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="pt-2 mt-2 border-t border-border">
        <Link
          href="/services"
          onClick={onClose}
          className="text-xs font-medium text-brand-primary hover:underline px-2 block"
        >
          View all services
        </Link>
      </div>
    </div>
  );
}

function SpecialtiesDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-4 max-h-[400px] overflow-y-auto w-[280px]">
      <ul className="space-y-1">
        {SPECIALTY_TAGS.map((tag) => (
          <li key={tag.slug}>
            <Link
              href={`/specialties/${tag.slug}`}
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-text hover:bg-surface transition-colors"
            >
              <PawPrint weight="fill" className="w-3 h-3 text-brand-accent shrink-0" />
              {tag.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="pt-2 mt-2 border-t border-border">
        <Link
          href="/specialties"
          onClick={onClose}
          className="text-xs font-medium text-brand-primary hover:underline px-2 block"
        >
          View all specialties
        </Link>
      </div>
    </div>
  );
}
