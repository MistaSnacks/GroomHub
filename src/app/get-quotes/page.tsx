import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote-wizard";

export const metadata: Metadata = {
  title: "Get Grooming Quotes",
  description:
    "Tell us about your pup and get personalized quotes from up to 5 top-rated groomers in your area. Free, fast, and no commitment.",
};

export default function GetQuotesPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-gradient py-12 text-white">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-3 !text-white">
            Get <span className="text-brand-secondary">free</span> grooming quotes 🐾
          </h1>
          <p className="text-white/70 text-lg">
            Tell us about your pet and we&apos;ll send your request to the best-matched local groomers. Free, fast, no obligation.
          </p>
        </div>
      </section>

      {/* Perks */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto py-5 px-4 flex flex-wrap gap-6 justify-center">
          {[
            { icon: "🛡️", title: 'Verified groomers only', desc: 'Every groomer who responds has been vetted.' },
            { icon: "⏱️", title: 'Hear back in 24 hours', desc: 'Most responses arrive within a few hours.' },
            { icon: "⭐", title: 'Compare and choose', desc: 'Pick the best offer — no pressure, no obligation.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <div className="text-sm font-medium text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard */}
      <section className="container mx-auto py-12 px-4">
        <div className="bg-card rounded-2xl border border-border shadow-card card-lift p-6 md:p-10 max-w-xl mx-auto">
          <QuoteWizard />
        </div>
      </section>
    </>
  );
}
