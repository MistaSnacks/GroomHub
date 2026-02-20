import type { Metadata } from "next";
import Link from "next/link";
import { CaretRight, ArrowRight, PawPrint } from "@phosphor-icons/react/dist/ssr";
import { SPECIALTY_TAGS } from "@/lib/tags";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";

export const metadata: Metadata = {
  title: "Grooming Specialties — Find Expert Care",
  description: "Browse groomers by specialty across the PNW. From doodle experts to fear-free certified — find the exact expertise your pet needs.",
};

// Mixed card sizes: Row 1 = 2 wider, Row 2+ = 3 equal
// Colored backgrounds: 1=teal, 3=amber, 6=amber
function getSpecialtyCardStyle(index: number) {
  if (index === 1)
    return { bg: "bg-brand-accent text-white", iconBg: "bg-white/20", link: "text-white/80 hover:text-white" };
  if (index === 3 || index === 6)
    return { bg: "bg-brand-secondary text-brand-primary", iconBg: "bg-brand-primary/10", link: "text-brand-primary/70 hover:text-brand-primary" };
  return { bg: "bg-white border border-border text-brand-primary", iconBg: "bg-brand-accent/10 text-brand-accent", link: "text-brand-accent hover:text-brand-accent" };
}

export default function SpecialtiesHub() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Specialties</span>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
            Specialized Care
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3 text-brand-primary">
            Grooming <span className="text-brand-accent">Specialties</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Does your pet have unique needs? Find groomers with the exact expertise you&apos;re looking for.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Specialties Grid */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <AnimatedSection variant="stagger">
            {/* First row: 2 wider cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {SPECIALTY_TAGS.slice(0, 2).map((specialty, index) => {
                const style = getSpecialtyCardStyle(index);
                return (
                  <AnimatedItem key={specialty.slug}>
                    <Link
                      href={`/specialties/${specialty.slug}`}
                      className={`${style.bg} rounded-2xl p-6 md:p-8 min-h-[220px] flex flex-col group transition-all hover:shadow-md`}
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${style.iconBg} mb-4 shrink-0`}>
                        <PawPrint weight="fill" className="w-6 h-6" />
                      </div>
                      <h3 className="font-heading text-xl font-bold mb-2 leading-tight">
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
            </div>

            {/* Remaining rows: 3 equal cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SPECIALTY_TAGS.slice(2).map((specialty, i) => {
                const index = i + 2;
                const style = getSpecialtyCardStyle(index);
                return (
                  <AnimatedItem key={specialty.slug}>
                    <Link
                      href={`/specialties/${specialty.slug}`}
                      className={`${style.bg} rounded-2xl p-6 min-h-[200px] flex flex-col group transition-all hover:shadow-md`}
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${style.iconBg} mb-4 shrink-0`}>
                        <PawPrint weight="fill" className="w-6 h-6" />
                      </div>
                      <h3 className="font-heading text-lg font-bold mb-1 leading-tight">
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
            </div>
          </AnimatedSection>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </div>
  );
}
