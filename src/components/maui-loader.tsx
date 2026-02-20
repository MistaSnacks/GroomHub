"use client";

import { PawPrint } from "@phosphor-icons/react/dist/ssr";

interface MauiLoaderProps {
  message?: string;
  size?: number;
}

export function MauiLoader({
  message = "Fetching the good stuff…",
  size = 40,
}: MauiLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 w-full max-w-lg mx-auto">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-brand-secondary/10">
        <PawPrint weight="fill" className="w-6 h-6 text-brand-secondary animate-pulse" />
      </div>
      <p className="text-text-muted text-sm font-heading animate-pulse">
        {message}
      </p>
    </div>
  );
}
