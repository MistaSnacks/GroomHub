"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setQuoteStatus, setSubmissionStatus } from "./actions";

/** Small triage buttons for one inbox row. */
export function StatusButtons({ kind, id, status }: { kind: "submission" | "quote"; id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const options: [string, string][] =
    kind === "submission"
      ? status === "new"
        ? [["handled", "Mark handled"], ["dismissed", "Dismiss"]]
        : [["new", "Reopen"]]
      : status === "new"
        ? [["handled", "Mark handled"]]
        : [["new", "Reopen"]];

  function run(next: string) {
    setError(null);
    startTransition(async () => {
      const result = kind === "submission" ? await setSubmissionStatus(id, next) : await setQuoteStatus(id, next);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          disabled={pending}
          onClick={() => run(value)}
          className="rounded-md border border-adm-line bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:border-teal-600/40 hover:text-teal-800 disabled:opacity-50"
        >
          {label}
        </button>
      ))}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
