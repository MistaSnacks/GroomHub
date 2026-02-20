"use client";

import { MauiLoader } from "@/components/maui-loader";

export default function GroomerLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-bg">
      <MauiLoader message="Sniffing out this groomer's profile…" />
    </div>
  );
}
