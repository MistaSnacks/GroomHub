"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({ scope: "blog-error", digest: error.digest, message: error.message }));
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-3xl font-bold text-brand-primary mb-3">Guides are temporarily unavailable</h1>
        <p className="text-text-muted mb-8">
          Our content service did not answer. The directory itself is fine; try the guides again in a few minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={() => reset()} className="inline-flex items-center rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white">
            Try again
          </button>
          <Link href="/dog-grooming" className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-bold text-brand-primary">
            Find a groomer
          </Link>
        </div>
      </div>
    </div>
  );
}
