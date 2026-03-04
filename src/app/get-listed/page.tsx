import type { Metadata } from "next";
import Link from "next/link";
import { Storefront, EnvelopeSimple, CheckCircle, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { WaveDivider } from "@/components/wave-divider";
import { GetListedForm } from "./get-listed-form";
import { ListingSearch } from "./listing-search";

export const metadata: Metadata = {
  title: "Get Listed — Add Your Grooming Business",
  description:
    "Not in our directory yet? Submit your grooming business to GroomLocal and start connecting with local pet parents across the PNW.",
};

export default function GetListedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Get Listed</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <Storefront weight="duotone" className="w-8 h-8 text-brand-secondary" />
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-brand-primary">
              Get Your Business <span className="text-brand-secondary">Listed</span>
            </h1>
          </div>
          <p className="text-text-muted text-lg max-w-2xl">
            Not in our directory yet? We&apos;d love to add you. Fill out the form below and we&apos;ll get your listing live within 48 hours.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Form + Info */}
      <section className="bg-white py-12 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Search + Form */}
            <div className="lg:col-span-3 space-y-6">
              <ListingSearch />
              <GetListedForm />
            </div>

            {/* Info sidebar */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/10">
                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-primary">100% Free</h3>
                </div>
                <p className="text-sm text-text-muted">
                  Basic listings are always free. No credit card required, no hidden fees.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-secondary/15">
                    <Storefront weight="fill" className="w-5 h-5 text-brand-secondary" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-primary">Quick Setup</h3>
                </div>
                <p className="text-sm text-text-muted">
                  We&apos;ll review your submission and get your listing live within 48 hours.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-accent/10">
                    <EnvelopeSimple weight="fill" className="w-5 h-5 text-brand-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-primary">Questions?</h3>
                </div>
                <p className="text-sm text-text-muted mb-2">
                  Reach us anytime at:
                </p>
                <a href="mailto:hello@groomlocal.com" className="text-sm text-brand-accent hover:underline">
                  hello@groomlocal.com
                </a>
              </div>

              <div className="rounded-2xl p-5 bg-brand-secondary">
                <h3 className="font-heading font-bold mb-2 text-slate-900">Already listed?</h3>
                <p className="text-sm mb-3 text-slate-700">
                  If your business is already in our directory, you can claim it to unlock editing and analytics.
                </p>
                <Link
                  href="/for-groomers"
                  className="inline-flex items-center px-4 py-2 rounded-full bg-brand-primary text-white text-sm font-semibold transition-colors hover:bg-brand-primary/90"
                >
                  Claim Your Listing
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
