"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toggleFeatured } from "./actions";
import { revokeClaim } from "@/app/admin/dashboard/claims/actions";

/**
 * Per-owner controls. Featuring here is the free promo spot (see toggleFeatured);
 * revoking removes the owner and any placement. Both refresh the page from the
 * server afterwards so every number on the card stays true.
 */
export function OwnerActions({
  slug,
  name,
  sponsored,
  lapsed,
  promoOpen,
}: {
  slug: string;
  name: string;
  sponsored: boolean;
  /** is_featured is still set but the paid-through date has passed. */
  lapsed: boolean;
  promoOpen: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "fail"; text: string } | null>(null);

  function feature(next: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await toggleFeatured(slug, next);
      if (!result.success) {
        setMessage({ tone: "fail", text: result.error });
        return;
      }
      setMessage({ tone: "ok", text: next ? "Free Sponsored spot is on through Dec 31." : "Spot removed." });
      router.refresh();
    });
  }

  function revoke() {
    setMessage(null);
    startTransition(async () => {
      const result = await revokeClaim(slug, note);
      if (!result.ok) {
        setMessage({ tone: "fail", text: result.error });
        return;
      }
      setConfirmRevoke(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {sponsored || lapsed ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => feature(false)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"
          >
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-600" aria-hidden />
            {lapsed ? "Clear ended spot" : "Remove spot"}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || !promoOpen}
            onClick={() => feature(true)}
            title={promoOpen ? "Sponsored-labeled spot at the top of their city page, free through Dec 31, 2026" : "The free promo window has ended"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-adm-line bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:border-amber-400 hover:text-amber-800 disabled:opacity-50"
          >
            <Star className="h-3.5 w-3.5" aria-hidden />
            Feature free
          </button>
        )}
        {!confirmRevoke && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmRevoke(true)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            Revoke
          </button>
        )}
      </div>
      {confirmRevoke && (
        <div className="rounded-lg border border-red-200 bg-red-50/60 p-2.5">
          <p className="text-xs text-red-800">Remove the owner from {name}? Their spot and claim end now.</p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the record (optional)"
            className="mt-2 w-full rounded-md border border-red-200 bg-white px-2 py-1 text-xs"
            maxLength={500}
          />
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={pending} onClick={revoke} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50">
              {pending ? "Removing" : "Remove owner"}
            </button>
            <button type="button" onClick={() => setConfirmRevoke(false)} className="rounded-md px-2.5 py-1 text-xs text-stone-600 hover:bg-white">
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && <p className={`text-xs ${message.tone === "ok" ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
    </div>
  );
}
