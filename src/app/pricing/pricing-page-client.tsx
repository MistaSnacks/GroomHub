"use client";

import { useState } from "react";
import Link from "next/link";
import { CaretDown, CaretRight, Check, X, Star, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";
import { FeaturedAvailability } from "@/components/featured-availability";
import { pricingTiers } from "@/lib/pricing";

const faqs = [
  {
    q: "Is the Free listing really free?",
    a: "Yes. Your free listing includes your website, booking link, hours, services, pricing, and up to 10 photos. It is not a trial and it does not expire.",
  },
  {
    q: "Why should I claim my listing if my business is already shown?",
    a: "Claiming gives you control. You can correct your hours, add a booking link, upload photos, and receive inquiries from pet parents. Claimed listings show an Owner Confirmed badge so people know the details come from you.",
  },
  {
    q: "What does Owner Confirmed mean?",
    a: "It means the business owner has claimed the listing and manages its details. It is not a safety inspection or a credential check, and it is never for sale. Free and Sponsored listings show the exact same badge.",
  },
  {
    q: "What does Sponsored mean?",
    a: "Sponsored businesses pay for a labeled spot at the top of their city page, limited to three per city. The Sponsored label is always visible. Payment never changes your badge or where you appear in the regular list.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Sponsored is month to month with no contract or cancellation fee. Your listing stays on Free with everything intact.",
  },
  {
    q: "Can pet parents book through GroomLocal?",
    a: "Add your booking link to your free listing and pet parents book through your existing scheduling software, straight from your profile.",
  },
  {
    q: "Do you offer discounts for annual billing?",
    a: "The listed annual rate is $41 per month ($492 per year), a $96 saving compared with twelve monthly payments. Contact us to confirm availability and billing terms.",
  },
];

interface CityAvailability {
  cityName: string;
  taken: number;
}

interface PricingPageClientProps {
  featuredCounts: CityAvailability[];
}

export function PricingPageClient({ featuredCounts }: PricingPageClientProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
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
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
              For Groomers
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-primary mb-3">
              Simple, <span className="text-brand-secondary">transparent</span> pricing
            </h1>
            <p className="text-text-muted text-lg mb-8">
              Claim your free listing today. Contact us to confirm Sponsored availability and billing terms; claiming a listing does not reserve a paid spot.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 bg-white border border-border rounded-full p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${!isAnnual
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-brand-primary"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-muted hover:text-brand-primary"
                  }`}
              >
                Annual
                <span className="text-[10px] bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded-full font-bold">
                  Save $96/yr
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Pricing Cards */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection variant="stagger" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => {
              const displayPrice = isAnnual ? tier.annualPrice : tier.price;
              const isFeatured = tier.isPopular;
              const isPremium = tier.slug === "premium";

              const cardBg = isFeatured
                ? "bg-brand-accent text-white border-brand-accent"
                : isPremium
                  ? "bg-brand-secondary text-brand-primary border-brand-secondary"
                  : "bg-white text-brand-primary border-border";

              const ctaBg = isFeatured
                ? "bg-white text-brand-accent hover:bg-white/90"
                : isPremium
                  ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                  : tier.price === 0
                    ? "bg-surface text-brand-primary hover:bg-border border border-border"
                    : "bg-brand-primary text-white hover:bg-brand-primary/90";

              return (
                <AnimatedItem key={tier.slug}>
                  <div className={`relative rounded-2xl border-2 p-6 flex flex-col h-full ${cardBg}`}>
                    {isFeatured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-white px-4 py-1 text-xs font-bold text-brand-accent shadow-sm whitespace-nowrap">
                          Most Pawpular
                        </span>
                      </div>
                    )}

                    <div className="mb-5">
                      <h3 className="font-heading text-xl font-bold">{tier.name}</h3>
                      <p className={`text-sm mt-1 ${isFeatured || isPremium ? "opacity-80" : "text-text-muted"}`}>
                        {tier.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading text-4xl font-bold">
                          ${displayPrice}
                        </span>
                        {tier.price > 0 && (
                          <span className={`text-sm ${isFeatured || isPremium ? "opacity-60" : "text-text-muted"}`}>/mo</span>
                        )}
                      </div>
                      {isAnnual && tier.price > 0 && (
                        <p className={`text-xs mt-1 ${isFeatured ? "text-white/70" : isPremium ? "text-brand-primary/60" : "text-brand-accent"}`}>
                          Save ${(tier.price - tier.annualPrice) * 12}/year
                        </p>
                      )}
                    </div>

                    <ul className="flex-1 space-y-2.5 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check weight="bold" className={`h-4 w-4 mt-0.5 shrink-0 ${isFeatured ? "text-white" : isPremium ? "text-brand-primary" : "text-brand-accent"}`} />
                          ) : (
                            <X weight="bold" className={`h-4 w-4 mt-0.5 shrink-0 ${isFeatured || isPremium ? "opacity-30" : "text-border"}`} />
                          )}
                          <span className={`text-sm ${feature.included
                            ? ""
                            : isFeatured || isPremium ? "opacity-40" : "text-text-muted/50"
                            }`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={tier.slug === "free" ? "/get-listed" : "/contact"}
                      className={`block text-center rounded-full py-3 px-6 text-sm font-bold transition-all ${ctaBg}`}
                    >
                      {tier.slug === "free" ? tier.ctaText : "Ask About Sponsorship"}
                    </Link>
                  </div>
                </AnimatedItem>
              );
            })}
          </AnimatedSection>

          {/* Scarcity signal - featured spot availability */}
          <FeaturedAvailability cities={featuredCounts} />
        </div>
      </section>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* FAQ */}
      <section className="bg-bg py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
              Questions
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-white border border-border rounded-2xl overflow-hidden px-5 transition-all shadow-sm open:shadow-md"
              >
                <summary className="font-semibold text-sm text-brand-primary hover:text-brand-accent py-4 text-left cursor-pointer list-none flex items-center justify-between [&::-webkit-details-marker]:hidden outline-none">
                  {faq.q}
                  <CaretDown weight="bold" className="h-4 w-4 text-text-muted transition-transform group-open:rotate-180 shrink-0 ml-4" />
                </summary>
                <div className="text-sm text-text-muted pb-4 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <WaveDivider variant="steep" fromColor="#FDF8F0" toColor="#4ECDC4" />

      <section className="bg-brand-secondary py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-lg text-brand-primary/70 mb-8 max-w-md mx-auto">
            No credit card required. Claim your free listing in minutes and start connecting with local pet parents.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/get-listed"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90 transition-all"
            >
              Start Free Today
              <ArrowRight weight="bold" className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/80 text-brand-primary font-bold text-lg hover:bg-white transition-all"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#4ECDC4" toColor="#4ECDC4" />
    </div>
  );
}
