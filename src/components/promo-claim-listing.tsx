import Link from "next/link";
import { MauiMascot } from "./maui-mascot";

export function PromoClaimListing() {
  return (
    <section className="bg-brand-accent py-16 md:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-16">

          {/* Left: Mascot */}
          <div className="flex-1 flex justify-center shrink-0">
            <MauiMascot
              src="/maui-assets/14-maui-sitting-pretty-alt.png"
              size={280}
              animation="bounce"
            />
          </div>

          {/* Right: Content */}
          <div className="flex-[1.5] text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
              For Groomers
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Get more clients. Claim your free listing today.
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto md:mx-0">
              Join the PNW&apos;s fastest growing grooming directory. Manage your profile, showcase your services, and connect with local pet parents.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link
                href="/for-groomers"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-brand-accent font-bold text-lg hover:bg-white/90 hover:scale-[1.02] transition-all shadow-lg w-full sm:w-auto"
              >
                Claim Your Listing
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-bold text-lg hover:bg-white/30 transition-all w-full sm:w-auto"
              >
                Learn More
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
