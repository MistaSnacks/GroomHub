import type { Metadata } from "next";
import Link from "next/link";
import { Storefront, EnvelopeSimple, CheckCircle, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BandMaui } from "@/components/band-maui";
import { WaveDivider } from "@/components/wave-divider";
import { GetListedForm } from "./get-listed-form";
import { ListingSearch } from "./listing-search";

export const metadata: Metadata = {
  title: "Get Listed | Add Your Grooming Business",
  description:
    "Not in our directory yet? Submit your grooming business to GroomLocal and start connecting with local pet parents across the PNW.",
  alternates: { canonical: "/get-listed" },
  openGraph: {
    title: "Get Listed | Add Your Grooming Business",
    description: "Submit your grooming business to GroomLocal and start connecting with local pet parents across the PNW.",
    type: "website",
    url: "/get-listed",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Get listed on GroomLocal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Listed | Add Your Grooming Business",
    description: "Submit your grooming business to GroomLocal and start connecting with local pet parents across the PNW.",
    images: ["/og-image.png"],
  },
};

export default function GetListedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="page-band relative overflow-hidden">
        <BandMaui pose="groomers" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Get Listed</span>
          </nav>

          <h1 className="lg:max-w-[min(62rem,calc(100%-9rem))] font-heading text-4xl md:text-5xl font-bold text-brand-primary mb-3">
            Get Your Business <span className="text-brand-secondary">Listed</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Not in our directory yet? We&apos;d love to add you. Search for your business first. If you&apos;re not here, add yourself below and your free listing goes live right away.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-brand-primary">
            {["Free to list", "No credit card", "Live as soon as you submit"].map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <CheckCircle weight="fill" className="h-4 w-4" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#4ECDC4" toColor="#FFFFFF" />

      {/* Form + Info */}
      <section className="bg-white py-10 md:py-12 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

            {/* Search + Form */}
            <div className="lg:col-span-3 space-y-6">
              <div id="claim" className="scroll-mt-24">
                <ListingSearch />
              </div>
              <GetListedForm />
            </div>

            {/* Info sidebar */}
            <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">
              <div className="paws rounded-2xl bg-brand-accent p-6 text-brand-primary">
                <h2 className="font-heading text-xl font-bold mb-4">What you get</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/35">
                      <CheckCircle weight="fill" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading font-bold">100% Free</h3>
                      <p className="text-sm text-brand-primary/85">
                        Basic listings are always free. No credit card required, no hidden fees.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/35">
                      <Storefront weight="fill" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading font-bold">Quick Setup</h3>
                      <p className="text-sm text-brand-primary/85">
                        Your listing goes live as soon as you submit. Make an account to add photos and hours.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="paws rounded-2xl p-6 bg-brand-secondary">
                <h2 className="font-heading text-lg font-bold mb-2 text-brand-primary">Already listed?</h2>
                <p className="text-sm mb-3 text-brand-primary/85">
                  Use the search above to find your business and claim it. Claiming unlocks editing and photo uploads.
                </p>
                <Link
                  href="/pricing"
                  className="text-sm font-semibold text-brand-primary underline underline-offset-2"
                >
                  Learn about groomer tools
                </Link>
              </div>

              <div className="paws-coral rounded-2xl border border-brand-accent/25 bg-brand-accent/10 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <EnvelopeSimple weight="fill" className="w-5 h-5 text-brand-accent-ink" />
                  <h2 className="font-heading font-bold text-brand-primary">Questions?</h2>
                </div>
                <p className="text-sm text-text">
                  Reach us anytime at{" "}
                  <a href="mailto:hello@groomlocal.com" className="font-semibold text-brand-accent-ink underline underline-offset-2 hover:text-brand-primary">
                    hello@groomlocal.com
                  </a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
