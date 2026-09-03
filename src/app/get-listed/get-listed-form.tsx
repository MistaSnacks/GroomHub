"use client";

import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { submitListing } from "./actions";

type Status = "idle" | "submitting" | "success" | "error";

export function GetListedForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setStatus("submitting");
    setErrorMsg("");

    startTransition(async () => {
      const result = await submitListing(formData);
      if (result.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(result.error || "Something went wrong.");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 md:p-8 text-center">
        <CheckCircle weight="fill" className="w-12 h-12 text-brand-secondary mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-brand-primary mb-2">
          Submission received!
        </h2>
        <p className="text-text-muted">
          We&apos;ll review your business and get your listing live within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
      <h2 className="font-heading text-2xl font-bold text-brand-primary mb-6">
        Submit your business
      </h2>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-5">
          <WarningCircle weight="fill" className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          name="hp_field"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="listed-business-name" className="block text-sm font-medium text-brand-primary mb-1.5">Business name *</label>
            <input id="listed-business-name" type="text" name="business_name" required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="e.g. Pawfect Grooming" />
          </div>
          <div>
            <label htmlFor="listed-contact-name" className="block text-sm font-medium text-brand-primary mb-1.5">Your name</label>
            <input id="listed-contact-name" type="text" name="contact_name" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="First and last" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="listed-city" className="block text-sm font-medium text-brand-primary mb-1.5">City *</label>
            <input id="listed-city" type="text" name="city" required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="e.g. Seattle" />
          </div>
          <div>
            <label htmlFor="listed-state" className="block text-sm font-medium text-brand-primary mb-1.5">State *</label>
            <select id="listed-state" name="state" required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent bg-white">
              <option value="">Select state</option>
              <option value="WA">Washington</option>
              <option value="OR">Oregon</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="listed-email" className="block text-sm font-medium text-brand-primary mb-1.5">Email *</label>
          <input id="listed-email" type="email" name="email" required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="you@yourbusiness.com" />
        </div>
        <div>
          <label htmlFor="listed-phone" className="block text-sm font-medium text-brand-primary mb-1.5">Phone</label>
          <input id="listed-phone" type="tel" name="phone" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="(555) 123-4567" />
        </div>
        <div>
          <label htmlFor="listed-website" className="block text-sm font-medium text-brand-primary mb-1.5">Website</label>
          <input id="listed-website" type="url" name="website" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="https://yourbusiness.com" />
        </div>
        <div>
          <label htmlFor="listed-notes" className="block text-sm font-medium text-brand-primary mb-1.5">Anything else?</label>
          <textarea id="listed-notes" name="notes" rows={3} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent resize-none" placeholder="Services offered, hours, anything we should know..." />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-brand-primary font-semibold hover:bg-brand-primary/90 transition-colors disabled:opacity-60"
          style={{ color: "#FFFFFF" }}
        >
          {isPending ? "Submitting..." : "Submit My Business"}
          {!isPending && <ArrowRight weight="bold" className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
