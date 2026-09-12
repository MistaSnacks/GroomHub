import { MarketingHeading } from "./marketing-heading";
import type { MarketingSection } from "@/lib/marketing-copy";
import Link from "next/link";
import { MauiMascot } from "./maui-mascot";

export function PromoFindGroomers({copy}: {copy?: MarketingSection} = {}) {
  return (
    <section className="bg-brand-secondary py-20 md:py-28 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: Text content */}
          <div className="flex-[1.5] text-center lg:text-left">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 leading-tight text-slate-900">
              <MarketingHeading text={copy?.heading ?? "Your pet deserves the best groomer in town."} emphasis={copy?.emphasis ?? "best groomer"} className="text-brand-primary italic" />
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto lg:mx-0 text-slate-700">
              {copy?.intro ?? "Compare services, pricing, and specialties to find groomers who are the right fit for your pet. All in one place."}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href={copy?.cta?.href || "/dog-grooming"}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90 hover:scale-[1.02] transition-all shadow-lg"
              >
                {copy?.cta?.label ?? "Search Groomers"}
              </Link>
              <Link
                href={copy?.secondaryCta?.href || "/get-quotes"}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/80 text-slate-900 font-bold text-lg hover:bg-white transition-all shadow-sm"
              >
                {copy?.secondaryCta?.label ?? "Get Free Quotes"}
              </Link>
            </div>
          </div>

          {/* Right: Maui */}
          <div className="flex-1 flex justify-center shrink-0">
            <MauiMascot
              src={copy?.imageSrc || "/maui-assets/01-maui-bath.png?v=maui-20260904-alpha1"}
              alt={copy?.imageAlt}
              size={280}
              animation="float"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
