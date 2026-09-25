"use client";

import { useState } from "react";
import Link from "next/link";
import { approveClaim, rejectClaim, type ClaimRequestRow } from "./actions";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
}

export function ClaimsClient({ requests: initial, view }: { requests: ClaimRequestRow[]; view: "pending" | "all" }) {
  const [requests, setRequests] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setMessage(null);
    let note = "";
    if (action === "reject") {
      note = window.prompt("Optional note to the claimant (why it was not verified):") ?? "";
    }
    const result = action === "approve" ? await approveClaim(id) : await rejectClaim(id, note);
    if (result.ok) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r)).filter((r) => view === "all" || r.status === "pending"));
      setMessage(action === "approve" ? "Claim approved and the owner emailed." : "Claim rejected and the claimant emailed.");
    } else {
      setMessage(result.error);
    }
    setBusy(null);
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claim Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Claims whose email domain did not match the listing website wait here. Approving sets the owner and emails them.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/dashboard/claims" className={`px-3 py-1.5 rounded-lg ${view === "pending" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>Pending</Link>
          <Link href="/admin/dashboard/claims?view=all" className={`px-3 py-1.5 rounded-lg ${view === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>All</Link>
        </div>
      </div>

      {message && <p role="status" className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800">{message}</p>}

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">No {view === "pending" ? "pending " : ""}claim requests.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Listing</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Claimant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Website</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Requested</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">
                    <Link href={`/groomer/${r.listing_slug}`} target="_blank" className="font-medium text-blue-600 hover:underline">{r.listing_name}</Link>
                    {r.listing_owner_id && r.status === "pending" && <span className="ml-2 text-xs text-amber-700">already owned</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.user_email}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-[220px]">{r.listing_website ?? "none"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-gray-700">{r.status}{r.verification === "domain_match" ? " (auto)" : ""}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" ? (
                      <div className="inline-flex gap-2">
                        <button type="button" disabled={busy === r.id} onClick={() => act(r.id, "approve")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Approve</button>
                        <button type="button" disabled={busy === r.id} onClick={() => act(r.id, "reject")} className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 disabled:opacity-50">Reject</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">{r.reviewed_by ?? ""}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
