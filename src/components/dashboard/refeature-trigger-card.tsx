"use client";

import { useEffect, useState } from "react";
import { getRefeatureTrigger } from "@/app/admin/dashboard/actions";

type Status = Awaited<ReturnType<typeof getRefeatureTrigger>>;

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${ok ? "text-emerald-700" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}

export function RefeatureTriggerCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRefeatureTrigger().then(setStatus).catch(() => setError("Could not load trigger status"));
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">House listing re-feature trigger</h2>
          <p className="text-xs text-gray-500 mt-1">
            Checked daily. Rules: same terms as any sponsor, never the first or only Sponsored listing, never in a city with a waitlisted sponsor.
          </p>
        </div>
        {status && (
          <span
            className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              status.met ? "bg-emerald-50 text-emerald-700" : status.configured ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700"
            }`}
          >
            {status.met ? "Conditions met" : status.configured ? "Not yet" : "Not configured"}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!status && !error && <p className="text-sm text-gray-400">Loading...</p>}

      {status && (
        <div>
          <Row
            label="Other claimed listings"
            value={`${status.otherClaimed} / ${status.claimedTarget}`}
            ok={status.otherClaimed >= status.claimedTarget}
          />
          <Row
            label="Paying sponsors elsewhere"
            value={`${status.payingSponsors} / ${status.sponsorsTarget}`}
            ok={status.payingSponsors >= status.sponsorsTarget}
          />
          <Row
            label="House listing currently sponsored"
            value={status.houseCurrentlySponsored ? "Yes" : "No"}
            ok={!status.houseCurrentlySponsored}
          />
          <Row
            label={`Waitlisted sponsor in ${status.houseCity ?? "house city"}`}
            value="Manual check"
            ok={false}
          />
        </div>
      )}
    </div>
  );
}
