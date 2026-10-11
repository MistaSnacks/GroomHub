"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Mail, Send, TriangleAlert } from "lucide-react";
import { approveClaim, rejectClaim, type ClaimRequestRow } from "./actions";

export interface ClaimContext {
  emailDomain: string | null;
  websiteHost: string | null;
  domainMatch: boolean;
  outreachSent: string | null;
  outreachEmail: string | null;
}

const when = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" }) : "-";

const day = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function statusLabel(r: ClaimRequestRow): { text: string; cls: string } {
  if (r.status === "pending") return { text: "Waiting", cls: "bg-amber-50 text-amber-800 ring-amber-600/25" };
  if (r.status === "approved") {
    const how = r.verification === "admin_review" ? "approved by hand" : r.reviewed_by === "system:webmail" ? "auto-approved (webmail)" : "auto-approved";
    return { text: how, cls: "bg-emerald-50 text-emerald-800 ring-emerald-600/20" };
  }
  if (r.status === "revoked") return { text: "revoked", cls: "bg-stone-100 text-stone-700 ring-stone-500/15" };
  return { text: r.status, cls: "bg-red-50 text-red-800 ring-red-600/20" };
}

export function ClaimsClient({ requests, view, context }: { requests: ClaimRequestRow[]; view: "pending" | "all"; context: Record<string, ClaimContext> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "fail"; text: string } | null>(null);

  function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setMessage(null);
    startTransition(async () => {
      const result = action === "approve" ? await approveClaim(id) : await rejectClaim(id, note);
      if (result.ok) {
        setMessage({ tone: "ok", text: action === "approve" ? "Approved. The owner has their listing and the welcome email is on its way." : "Rejected. The claimant was emailed." });
        setRejecting(null);
        setNote("");
        router.refresh();
      } else {
        setMessage({ tone: "fail", text: result.error });
      }
      setBusy(null);
    });
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-adm-line bg-white px-6 py-12 text-center">
        <CircleCheck className="mx-auto h-8 w-8 text-emerald-600" aria-hidden />
        <p className="mt-2 text-sm font-medium text-stone-700">{view === "pending" ? "No claims waiting" : "No claims yet"}</p>
        {view === "pending" && <p className="mt-1 text-xs text-stone-500">Everything that came in was approved automatically. See All claims for the history.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p role="status" className={`rounded-xl border px-4 py-2.5 text-sm ${message.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
          {message.text}
        </p>
      )}
      {requests.map((r) => {
        const ctx = context[r.id];
        const s = statusLabel(r);
        return (
          <article key={r.id} className="adm-rise rounded-2xl border border-adm-line bg-white p-5 shadow-[0_1px_2px_rgba(30,41,59,0.04)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`/groomer/${r.listing_slug}`} target="_blank" className="font-heading text-lg font-semibold text-brand-primary hover:underline">
                    {r.listing_name}
                  </a>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.cls}`}>{s.text}</span>
                  {r.listing_owner_id && r.status === "pending" && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-800 ring-1 ring-inset ring-red-600/20">already has an owner</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Requested {when(r.created_at)}
                  {r.reviewed_at && <> · decided {when(r.reviewed_at)} by {r.reviewed_by}</>}
                </p>

                <ul className="mt-3 space-y-1.5 text-sm">
                  <li className="flex items-center gap-2 text-stone-700">
                    <Mail className="h-4 w-4 text-stone-400" aria-hidden />
                    <a href={`mailto:${r.user_email}`} className="text-teal-700 hover:underline">
                      {r.user_email}
                    </a>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    {ctx?.domainMatch ? (
                      <>
                        <CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden />
                        <span className="text-emerald-800">Email domain matches the website ({ctx.websiteHost})</span>
                      </>
                    ) : (
                      <>
                        <TriangleAlert className="h-4 w-4 text-amber-600" aria-hidden />
                        <span className="text-stone-600">
                          Email at <b>{ctx?.emailDomain ?? "unknown"}</b>, website is {ctx?.websiteHost ?? "not on file"}
                        </span>
                      </>
                    )}
                  </li>
                  {ctx?.outreachSent && (
                    <li className="flex items-center gap-2 text-xs text-stone-600">
                      <Send className="h-4 w-4 text-teal-600" aria-hidden />
                      Outreach emailed this listing on {day(ctx.outreachSent)}
                      {ctx.outreachEmail && (
                        <>
                          {" "}
                          at {ctx.outreachEmail}
                          {ctx.outreachEmail.toLowerCase() === r.user_email.toLowerCase() && <b className="text-emerald-700"> (same address as the claim)</b>}
                        </>
                      )}
                    </li>
                  )}
                </ul>
                {r.note && <p className="mt-3 rounded-lg bg-adm-plane/70 px-3 py-2 text-xs text-stone-600">Note: {r.note}</p>}
              </div>

              {r.status === "pending" && (
                <div className="flex shrink-0 flex-col gap-2 md:w-64">
                  {rejecting === r.id ? (
                    <div className="rounded-xl border border-adm-line bg-adm-plane/50 p-3">
                      <label className="text-xs font-medium text-stone-700" htmlFor={`note-${r.id}`}>
                        Note to the claimant (optional)
                      </label>
                      <textarea
                        id={`note-${r.id}`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="mt-1 w-full rounded-md border border-adm-line bg-white px-2 py-1.5 text-xs"
                        placeholder="Why it could not be verified"
                      />
                      <div className="mt-2 flex gap-2">
                        <button type="button" disabled={pending} onClick={() => act(r.id, "reject")} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                          {busy === r.id ? "Sending" : "Reject and email"}
                        </button>
                        <button type="button" onClick={() => setRejecting(null)} className="rounded-lg px-3 py-1.5 text-xs text-stone-600 hover:bg-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button type="button" disabled={pending} onClick={() => act(r.id, "approve")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                        {busy === r.id ? "Approving" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setRejecting(r.id);
                          setNote("");
                        }}
                        className="rounded-lg border border-adm-line bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
