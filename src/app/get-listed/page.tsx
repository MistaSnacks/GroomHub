import type { Metadata } from "next";
import Link from "next/link";
import { Storefront, EnvelopeSimple, CheckCircle, ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { WaveDivider } from "@/components/wave-divider";

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

            {/* Form */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-border p-6 md:p-8">
              <h2 className="font-heading text-2xl font-bold text-brand-primary mb-6">
                Submit your business
              </h2>
              <form
                action="mailto:hello@groomlocal.com"
                method="GET"
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-1.5">Business name *</label>
                    <input type="text" name="subject" required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="e.g. Pawfect Grooming" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-1.5">Your name</label>
                    <input type="text" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="First and last" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-1.5">City *</label>
                    <input type="text" required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="e.g. Seattle" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-1.5">State *</label>
                    <select required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent bg-white">
                      <option value="">Select state</option>
                      <option value="WA">Washington</option>
                      <option value="OR">Oregon</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1.5">Email *</label>
                  <input type="email" required className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="you@yourbusiness.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1.5">Phone</label>
                  <input type="tel" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1.5">Website</label>
                  <input type="url" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" placeholder="https://yourbusiness.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-primary mb-1.5">Anything else?</label>
                  <textarea rows={3} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent resize-none" placeholder="Services offered, hours, anything we should know..." />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-brand-primary font-semibold hover:bg-brand-primary/90 transition-colors"
                  style={{ color: "#FFFFFF" }}
                >
                  Submit My Business
                  <ArrowRight weight="bold" className="w-4 h-4" />
                </button>
              </form>
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
