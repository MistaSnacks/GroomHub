import Link from "next/link";
import { CaretDown, CaretRight, Check } from "@phosphor-icons/react/dist/ssr";
import { WaveDivider } from "@/components/wave-divider";
import { freePlan, SPONSORED_CLOSED_LINE } from "@/lib/pricing";

export const revalidate = 3600;

const faqs = [
  {
    q: "Is the Free listing really free?",
    a: "Yes. Your free listing includes your website, booking link, hours, services, pricing, and photos. It is not a trial and it does not expire.",
  },
  {
    q: "Why should I claim my listing if my business is already shown?",
    a: "Claiming gives you control. You can correct your hours, add a booking link, upload photos, and receive inquiries from pet parents. Claimed listings show an Owner Confirmed badge so people know the details come from you.",
  },
  {
    q: "What does Owner Confirmed mean?",
    a: "It means the business owner has claimed the listing and manages its details. It is not a safety inspection or a credential check, and it is never for sale.",
  },
  {
    q: "What does Sponsored mean?",
    a: `A few businesses hold a spot at the top of their city page, always labeled Sponsored. It never changes their badge or where they appear in the regular list. ${SPONSORED_CLOSED_LINE}`,
  },
  {
    q: "Can pet parents book through GroomLocal?",
    a: "Add your booking link to your free listing and pet parents book through your existing scheduling software, straight from your profile.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-bg py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <Link href="/for-groomers" className="hover:text-brand-primary transition-colors">For Groomers</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Pricing</span>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">For Groomers</p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-primary mb-3">
              Your listing is <span className="text-brand-secondary">free</span>
            </h1>
            <p className="text-text-muted text-lg">Every grooming business on GroomLocal is listed for free. Claim yours to keep the details right.</p>
          </div>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-brand-accent bg-brand-accent text-white p-6 flex flex-col">
            <div className="mb-5">
              <h2 className="font-heading text-xl font-bold">{freePlan.name}</h2>
              <p className="text-sm mt-1 opacity-80">{freePlan.description}</p>
            </div>
            <p className="font-heading text-4xl font-bold mb-6">$0</p>
            <ul className="flex-1 space-y-2.5 mb-6">
              {freePlan.features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-2">
                  <Check weight="bold" className="h-4 w-4 mt-0.5 shrink-0 text-white" />
                  <span className="text-sm">{feature.text}</span>
                </li>
              ))}
            </ul>
            <Link href="/get-listed" className="block text-center rounded-full py-3 px-6 text-sm font-bold transition-all bg-white text-brand-accent hover:bg-white/90">
              {freePlan.ctaText}
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-text-muted">{SPONSORED_CLOSED_LINE}</p>
        </div>
      </section>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      <section className="bg-bg py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">Questions</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-white border border-border rounded-2xl overflow-hidden px-5 transition-all shadow-sm open:shadow-md">
                <summary className="font-semibold text-sm text-brand-primary hover:text-brand-accent py-4 text-left cursor-pointer list-none flex items-center justify-between [&::-webkit-details-marker]:hidden outline-none">
                  {faq.q}
                  <CaretDown weight="bold" className="h-4 w-4 text-text-muted transition-transform group-open:rotate-180 shrink-0 ml-4" />
                </summary>
                <div className="text-sm text-text-muted pb-4 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider variant="steep" fromColor="#FDF8F0" toColor="#4ECDC4" />

      <section className="bg-brand-secondary py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-4">Claim your free listing</h2>
          <p className="text-lg text-brand-primary/70 mb-8 max-w-md mx-auto">No credit card. It takes a few minutes.</p>
          <Link
            href="/get-listed"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90 transition-all"
          >
            Get Started
          </Link>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#4ECDC4" toColor="#4ECDC4" />
    </div>
  );
}
