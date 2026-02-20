import Link from "next/link";
import { ArrowRight, PawPrint } from "@phosphor-icons/react/dist/ssr";
import { SPECIALTY_TAGS } from "@/lib/tags";
import { AnimatedSection, AnimatedItem } from "./animated-section";

// Show 6 specialties in a 3x2 grid
const SHOWN_SPECIALTY_SLUGS = [
  "doodle-poodle",
  "fear-free",
  "puppy-specialist",
  "senior-pets",
  "double-coat",
  "breed-specific-cuts",
];

// Indices that get colored backgrounds: 1=teal, 3=amber, 4=teal
function getCardStyle(index: number) {
  if (index === 1 || index === 4)
    return { bg: "bg-brand-accent text-white", iconBg: "bg-white/20", link: "text-white/80 hover:text-white" };
  if (index === 3)
    return { bg: "bg-brand-secondary text-brand-primary", iconBg: "bg-brand-primary/10", link: "text-brand-primary/70 hover:text-brand-primary" };
  return { bg: "bg-white text-brand-primary border border-border", iconBg: "bg-brand-accent/10 text-brand-accent", link: "text-brand-accent hover:text-brand-accent" };
}

export function BrowseBySpecialtySection() {
  const specialties = SPECIALTY_TAGS.filter((t) =>
    SHOWN_SPECIALTY_SLUGS.includes(t.slug)
  ).sort((a, b) =>
    SHOWN_SPECIALTY_SLUGS.indexOf(a.slug) - SHOWN_SPECIALTY_SLUGS.indexOf(b.slug)
  );

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="md:flex-1" />
          <div className="text-left md:text-right max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
              Specialized Care
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-4">
              Browse by Specialty
            </h2>
            <p className="text-text-muted text-base">
              Does your pet have unique needs? Find groomers with the exact expertise you&apos;re looking for.
            </p>
          </div>
        </div>

        <AnimatedSection variant="stagger" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {specialties.map((specialty, index) => {
            const style = getCardStyle(index);
            return (
              <AnimatedItem key={specialty.slug}>
                <Link
                  href={`/specialties/${specialty.slug}`}
                  className={`${style.bg} rounded-2xl p-6 min-h-[220px] flex flex-col group transition-all hover:shadow-md`}
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${style.iconBg} mb-4 shrink-0`}>
                    <PawPrint weight="fill" className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold mb-2 leading-tight">
                    {specialty.label}
                  </h3>
                  {specialty.description && (
                    <p className="text-sm opacity-70 leading-relaxed mb-4 flex-1">
                      {specialty.description}
                    </p>
                  )}
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${style.link} transition-colors mt-auto`}>
                    Browse groomers
                    <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </AnimatedItem>
            );
          })}
        </AnimatedSection>

        <div className="text-center mt-10">
          <Link
            href="/specialties"
            className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-accent transition-colors"
          >
            <span>View all specialties</span>
            <ArrowRight weight="bold" className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
