import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote-wizard";

export const metadata: Metadata = {
  title: "Get Grooming Quotes",
  description:
    "Tell us about your pet. Our team reviews requests during beta and helps you find local grooming options. No booking or response is guaranteed.",
  alternates: { canonical: "/get-quotes" },
  openGraph: {
    title: "Get Grooming Quotes",
    description: "Tell us about your pet. Our team reviews requests during beta and helps you find local grooming options. No booking or response is guaranteed.",
    type: "website",
    url: "/get-quotes",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Get grooming quotes on GroomLocal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Grooming Quotes",
    description: "Tell us about your pet. Our team reviews requests during beta and helps you find local grooming options. No booking or response is guaranteed.",
    images: ["/og-image.png"],
  },
};

export default function GetQuotesPage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-gradient py-12">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-3 text-brand-primary">
            Get <span className="text-brand-accent">free</span> grooming quotes 🐾
          </h1>
          <p className="text-text-muted text-lg">
            Tell us about your pet. During beta, our team reviews your request and helps you find local grooming options. Submitting a request does not book an appointment.
          </p>
        </div>
      </section>

      {/* Perks */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto py-5 px-4 flex flex-wrap gap-6 justify-center">
          {[
            { icon: "🛡️", title: 'Local directory groomers', desc: "Tell us what care you need and where." },
            { icon: "⏱️", title: 'Reviewed by our team', desc: 'Requests are reviewed manually during beta.' },
            { icon: "⭐", title: 'Compare and choose', desc: 'Availability and responses are not guaranteed.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <div className="text-sm font-medium text-text">{title}</div>
                <div className="text-xs text-text-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard */}
      <section className="container mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-border paper-shadow p-6 md:p-10 max-w-xl mx-auto">
          <QuoteWizard />
        </div>
      </section>
    </>
  );
}
