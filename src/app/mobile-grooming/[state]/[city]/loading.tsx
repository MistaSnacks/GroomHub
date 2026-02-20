"use client";

import { MauiLoader } from "@/components/maui-loader";

export default function MobileGroomingLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-bg">
      <MauiLoader message="Finding mobile groomers in your area…" />
    </div>
  );
}
