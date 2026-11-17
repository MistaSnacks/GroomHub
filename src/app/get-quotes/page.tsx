import type { Metadata } from "next";
import Link from "next/link";
import { CaretRight, ClipboardText, MapPin, Scales } from "@phosphor-icons/react/dist/ssr";
import { BandMaui } from "@/components/band-maui";
import { QuoteWizard } from "@/components/quote-wizard";
import { WaveDivider } from "@/components/wave-divider";

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

const PERKS = [
  { icon: MapPin, title: "Local directory groomers", desc: "Tell us what care you need and where." },
  { icon: ClipboardText, title: "Reviewed by our team", desc: "Requests are reviewed manually during beta." },
  { icon: Scales, title: "Compare and choose", desc: "Availability and responses are not guaranteed." },
];

export default function GetQuotesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="page-band page-band-coral relative overflow-hidden">
        <BandMaui pose="quotes" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Get Quotes</span>
          </nav>
          <h1 className="lg:max-w-[min(62rem,calc(100%-9rem))] font-heading text-4xl md:text-5xl font-bold mb-3 text-brand-primary">
            Get <span className="text-brand-accent">free</span> grooming quotes
          </h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Tell us about your pet. During beta, our team reviews your request and helps you find local grooming options. Submitting a request does not book an appointment.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FF7E67" toColor="#FFFFFF" />

      {/* Wizard + perks */}
      <section className="bg-white py-10 md:py-14 flex-1">
        <div className="mx-auto grid max-w-5xl items-start gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 lg:px-8">
          <div className="bg-white rounded-2xl border border-border paper-shadow p-6 md:p-10">
            <QuoteWizard />
          </div>

          <aside className="space-y-4">
            <div className="paws rounded-2xl bg-brand-secondary p-6 text-brand-primary">
              <h2 className="font-heading text-xl font-bold mb-4">How it works</h2>
              <ul className="space-y-4">
                {PERKS.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/35">
                      <Icon weight="duotone" className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{title}</div>
                      <div className="text-sm text-brand-primary/80">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="paws-coral rounded-2xl border border-brand-accent/25 bg-brand-accent/10 p-5">
              <h2 className="font-heading font-bold text-brand-primary mb-1">Rather look for yourself?</h2>
              <p className="text-sm text-text mb-3">Browse the groomers in your city and contact them directly.</p>
              <Link href="/dog-grooming" className="text-sm font-semibold text-brand-accent-ink underline underline-offset-2 hover:text-brand-primary transition-colors">
                Browse groomers by city
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
