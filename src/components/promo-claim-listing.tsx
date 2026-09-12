import type { MarketingSection } from "@/lib/marketing-copy";
import Link from "next/link";
import { MauiMascot } from "./maui-mascot";

export function PromoClaimListing({copy}: {copy?: MarketingSection} = {}) {
  return (
    <section className="bg-brand-accent py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-16">

          {/* Left: Mascot */}
          <div className="flex-1 flex justify-center shrink-0">
            <MauiMascot
              src={copy?.imageSrc || "/maui-assets/14-maui-sitting-pretty-alt.png?v=maui-20260904-alpha1"}
              alt={copy?.imageAlt}
              size={280}
              animation="bounce"
            />
          </div>

          {/* Right: Content */}
          <div className="flex-[1.5] text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary/60 mb-3">
              {copy?.eyebrow ?? "For Groomers"}
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-brand-primary mb-6 leading-tight">
              {copy?.heading ?? "Get more clients. Claim your free listing today."}
            </h2>
            <p className="text-lg text-brand-primary/80 mb-8 max-w-xl mx-auto md:mx-0">
              {copy?.intro ?? "Join the PNW's fastest growing grooming directory. Manage your profile, showcase your services, and connect with local pet parents."}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link
                href={copy?.cta?.href || "/for-groomers"}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-brand-accent-ink font-bold text-lg hover:bg-white/90 hover:scale-[1.02] transition-all shadow-lg w-full sm:w-auto"
              >
                {copy?.cta?.label ?? "Claim Your Listing"}
              </Link>
              <Link
                href={copy?.secondaryCta?.href || "/for-groomers"}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-lg hover:bg-brand-primary/15 transition-all w-full sm:w-auto"
              >
                {copy?.secondaryCta?.label ?? "Learn More"}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
