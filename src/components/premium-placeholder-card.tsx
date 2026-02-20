import Link from "next/link";
import { Storefront, ArrowRight, Star } from "@phosphor-icons/react/dist/ssr";

export function PremiumPlaceholderCard({ index = 0 }: { index?: number }) {
  const rotations = ['rotate-1', '-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1', '-rotate-1'];
  const rotationClass = rotations[index % rotations.length];

  return (
    <article
      className={`bg-white rounded-xl relative group cursor-pointer animate-fade-slide-up paper-shadow hover:-translate-y-1 transition-transform duration-300 ${rotationClass} hover:rotate-0 z-10 hover:z-20`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="washi-tape absolute -top-3 left-1/2 transform -translate-x-1/2 z-30"></div>

      <Link href="/pricing" className="block rounded-xl overflow-hidden flex flex-col h-full border-t-[6px] border border-border border-t-brand-secondary/40 border-dashed">
        {/* Placeholder image area */}
        <div className="relative w-full h-40 flex flex-col items-center justify-center bg-gradient-to-br from-surface via-white to-brand-secondary/5">
          <Storefront weight="duotone" className="w-14 h-14 text-brand-secondary/30 mb-2" />
          <span className="text-sm font-heading font-semibold text-brand-primary/40">
            Your Business Here
          </span>
        </div>

        <div className="p-4">
          {/* Fake header skeleton */}
          <div className="mb-2">
            <div className="h-5 bg-surface rounded-full w-3/4 mb-2"></div>
            <div className="h-3 bg-surface rounded-full w-1/2"></div>
          </div>

          {/* Fake rating */}
          <div className="flex items-center gap-0.5 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                weight="fill"
                className="w-3.5 h-3.5 text-brand-secondary/20"
              />
            ))}
          </div>

          {/* Fake tag skeletons */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <div className="h-5 bg-brand-accent/5 rounded-full w-20 border border-brand-accent/10"></div>
            <div className="h-5 bg-brand-accent/5 rounded-full w-16 border border-brand-accent/10"></div>
            <div className="h-5 bg-brand-accent/5 rounded-full w-24 border border-brand-accent/10"></div>
          </div>

          {/* CTA */}
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            Get featured on our homepage and reach thousands of local pet parents.
          </p>

          <div className="flex gap-2 mt-auto pt-1">
            <span className="flex flex-1 items-center justify-center cta-gradient text-brand-primary font-semibold text-xs rounded-xl h-9">
              Get Featured
              <ArrowRight weight="bold" className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
