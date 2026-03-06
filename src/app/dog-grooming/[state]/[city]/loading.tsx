"use client";

import { PawPrint } from "@phosphor-icons/react";

export default function CityListingsLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-bg gap-3">
      <PawPrint weight="fill" className="w-8 h-8 text-brand-secondary animate-pulse" />
      <p className="text-text-muted text-sm">Fetching groomers in your area...</p>
    </div>
  );
}
