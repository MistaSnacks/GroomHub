import Link from "next/link";
import { MauiMascot } from "./maui-mascot";

export function PromoFindGroomers() {
  return (
    <section className="bg-brand-secondary py-20 md:py-28 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: Text content */}
          <div className="flex-[1.5] text-center lg:text-left">
            <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 leading-tight text-slate-900">
              Your pet deserves the{" "}
              <span className="text-brand-primary italic">best groomer</span>{" "}
              in town.
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto lg:mx-0 text-slate-700">
              Compare ratings, read real reviews, and find groomers who specialize in exactly what your pet needs. All in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/dog-grooming"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-brand-primary text-white font-bold text-lg hover:bg-brand-primary/90 hover:scale-[1.02] transition-all shadow-lg"
              >
                Search Groomers
              </Link>
              <span className="text-sm text-slate-600">Free to use. Always.</span>
            </div>
          </div>

          {/* Right: Maui */}
          <div className="flex-1 flex justify-center shrink-0">
            <MauiMascot
              src="/maui-assets/01-maui-bath.png"
              size={280}
              animation="float"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
