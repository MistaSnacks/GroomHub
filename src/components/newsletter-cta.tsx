"use client";

import { EnvelopeSimple } from "@phosphor-icons/react";
import { DecorativePaws } from "./decorative-paws";

export function NewsletterCta() {
  return (
    <section className="bg-brand-accent py-16 md:py-20 relative overflow-hidden section-dark">
      <DecorativePaws variant="scattered" color="white" />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 text-white">
          <EnvelopeSimple weight="bold" className="w-4 h-4" />
          <span>Stay in the Loop</span>
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
          Grooming tips delivered to your inbox
        </h2>
        <p className="text-white/80 mb-8 max-w-md mx-auto">
          Get weekly grooming tips, seasonal care guides, and PNW pet community updates. No spam, just helpful content.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 rounded-xl px-5 py-3.5 text-sm bg-white/15 border border-white/25 text-white placeholder-white/50 focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            className="bg-white text-brand-accent rounded-xl px-6 py-3.5 text-sm font-bold hover:bg-white/90 transition-all shrink-0"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
