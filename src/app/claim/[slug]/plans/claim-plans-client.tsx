"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { getLimits } from "@/lib/tiers";
import { processClaim } from "@/app/claim/actions";

export function ClaimPlansClient({ slug }: { slug: string }) {
  const error = useSearchParams().get("error");
  return (
    <section className="flex-1 bg-bg px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <p className="text-sm text-text-muted mb-2">Step 2 of 2</p>
          <h1 className="font-heading text-3xl font-bold text-brand-primary">Confirm your free listing</h1>
          <p className="text-text-muted mt-3">Manage your business details, add photos, and receive inquiries. No credit card required.</p>
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error === "already-claimed" ? "This listing has already been claimed by another user." : "We couldn't complete this claim. Please try again."}</p>}
        <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
          <h2 className="font-heading text-xl font-bold text-brand-primary">Free · $0</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            <li>Business details, hours, website and booking link</li>
            <li>Services, specialties, pricing and up to {getLimits("free").photos} photos during beta</li>
            <li>Owner Confirmed badge and contact inquiries</li>
          </ul>
          <p className="text-xs text-text-muted">By confirming, you state that you are authorized to manage this business.</p>
          <form action={processClaim}>
            <input type="hidden" name="slug" value={slug} />
            <ConfirmButton />
          </form>
        </div>
        <p className="text-sm text-text-muted text-center">Interested in a Sponsored spot? <Link href="/contact" className="text-brand-primary underline">Contact us about availability</Link>. This claim creates a free listing and does not reserve a paid placement.</p>
        <Link href={`/groomer/${slug}`} className="block text-center text-sm text-brand-primary underline">Back to business profile</Link>
      </div>
    </section>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{pending ? "Confirming…" : "Confirm Free Listing"}</button>;
}
