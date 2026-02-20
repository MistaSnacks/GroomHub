"use client";

import { MauiLoader } from "@/components/maui-loader";

export default function CatGroomingLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-bg">
      <MauiLoader message="Fetching cat groomers nearby…" />
    </div>
  );
}
