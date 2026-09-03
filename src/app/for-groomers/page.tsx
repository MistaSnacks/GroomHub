import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  TrendUp,
  ChartBar,
  ShieldCheck,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import { MauiMascot } from "@/components/maui-mascot";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";

export const metadata: Metadata = {
  title: "For Groomers | List Your Business",
  description:
    "Get your grooming business in front of thousands of pet owners in the PNW. Free to list, powerful tools to grow. Join the pack today.",
  alternates: { canonical: "/for-groomers" },
  openGraph: {
    title: "For Groomers | List Your Business",
    description: "Get your grooming business in front of thousands of pet owners in the PNW. Free to list, powerful tools to grow.",
    type: "website",
    url: "/for-groomers",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "List your grooming business on GroomLocal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "For Groomers | List Your Business",
    description: "Get your grooming business in front of thousands of pet owners in the PNW. Free to list, powerful tools to grow.",
    images: ["/og-image.png"],
  },
};

const features = [
  {
    icon: Users,
    title: "Reach More Pet Parents",
    desc: "Thousands of local pet owners searching for groomers in your area every month.",
    colored: false,
  },
  {
    icon: TrendUp,
    title: "Grow Your Bookings",
    desc: "Get qualified leads delivered to your inbox. No fake leads, no aggressive upsells.",
    colored: true,
    color: "teal" as const,
  },
  {
    icon: ChartBar,
    title: "Manage Your Listing",
    desc: "Update photos, hours, services, and contact info from your dashboard anytime.",
    colored: false,
  },
  {
    icon: ShieldCheck,
    title: "Build Trust with Badges",
    desc: 'Earn "Paw-Verified" and "Best in Show" badges that make pet parents choose you.',
    colored: true,
    color: "amber" as const,
  },
];

const steps = [
  {
    step: "1",
    title: "Claim Your Listing",
    desc: "Search for your business and claim it, or create a new one in under 5 minutes.",
  },
  {
    step: "2",
    title: "Add Your Details",
    desc: "Upload photos, set your services and pricing, add your hours, and write your description.",
  },
  {
    step: "3",
    title: "Get Found",
    desc: "Your listing goes live instantly. Pet owners in your area can now find and contact you.",
  },
];

export default function ForGroomersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-bg py-16 md:py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-[1.5] text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
                For Groomers
              </p>
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-brand-primary">
                Get more clients.{" "}
                <span className="text-brand-secondary italic">Grow your business.</span>
              </h1>
              <p className="text-lg text-text-muted mb-8 max-w-xl mx-auto lg:mx-0">
                Join hundreds of PNW groomers who are finding new clients, building their reputation, and growing their business every day.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/get-listed#claim"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90 transition-all w-full sm:w-auto"
                >
                  Claim Your Free Listing
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white border border-border text-brand-primary font-bold text-lg hover:bg-surface transition-all w-full sm:w-auto"
                >
                  View Pricing
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-text-muted">
                <span className="flex items-center gap-1.5"><Check weight="bold" className="text-brand-accent" /> Free tier available</span>
                <span className="flex items-center gap-1.5"><Check weight="bold" className="text-brand-accent" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><Check weight="bold" className="text-brand-accent" /> Set up in 5 minutes</span>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <MauiMascot src="/maui-assets/14-maui-sitting-pretty-alt.png" size={360} animation="float" priority />
            </div>
          </div>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Features - 2x2 grid with colored accents */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
              Why GroomLocal
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-2">
              Everything you need to grow
            </h2>
            <p className="text-text-muted">Tools built specifically for PNW pet grooming businesses.</p>
          </div>
          <AnimatedSection variant="stagger" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map(({ icon: Icon, title, desc, colored, color }) => {
              const bgClass = colored
                ? color === "teal"
                  ? "bg-brand-accent text-white"
                  : "bg-brand-secondary text-brand-primary"
                : "bg-white border border-border text-brand-primary";
              const iconBgClass = colored
                ? "bg-white/20"
                : "bg-surface border border-border";

              return (
                <AnimatedItem key={title}>
                  <div className={`${bgClass} rounded-2xl p-6 md:p-8 h-full`}>
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconBgClass}`}>
                      <Icon weight="duotone" className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-2">{title}</h3>
                    <p className={`text-sm leading-relaxed ${colored ? "opacity-80" : "text-text-muted"}`}>{desc}</p>
                  </div>
                </AnimatedItem>
              );
            })}
          </AnimatedSection>
        </div>
      </section>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* How It Works - 3 steps */}
      <section className="bg-bg py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
              Getting Started
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-2">
              How It Works
            </h2>
          </div>
          <AnimatedSection variant="stagger" className="relative">
            {/* Dashed connector line */}
            <div className="absolute left-6 top-8 bottom-8 w-px border-l-2 border-dashed border-border hidden md:block" />

            <div className="space-y-8">
              {steps.map(({ step, title, desc }) => (
                <AnimatedItem key={step}>
                  <div className="flex items-start gap-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary text-white font-heading font-bold text-lg shrink-0 relative z-10">
                      {step}
                    </div>
                    <div className="pt-2">
                      <h3 className="font-heading font-bold text-lg text-brand-primary mb-1">{title}</h3>
                      <p className="text-text-muted text-sm">{desc}</p>
                    </div>
                  </div>
                </AnimatedItem>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA - Coral */}
      <WaveDivider variant="steep" fromColor="#FDF8F0" toColor="#FA8072" />

      <section className="bg-brand-accent py-16 md:py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 flex justify-center -mb-8">
              <MauiMascot src="/maui-assets/14-maui-sitting-pretty-alt.png" size={320} animation="float" />
            </div>
            <div className="flex-[1.5] text-center md:text-left text-white">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                Ready to get more clients?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto md:mx-0">
                Join the PNW&apos;s best pet grooming directory today. Start free, upgrade when you&apos;re ready.
              </p>
              <Link
                href="/get-listed#claim"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-brand-accent font-bold text-lg hover:bg-surface transition-all"
              >
                Claim Your Free Listing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FA8072" toColor="#FA8072" />
    </>
  );
}
