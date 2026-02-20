import type { Metadata } from "next";
import Link from "next/link";
import { CaretRight, ArrowRight, PawPrint } from "@phosphor-icons/react/dist/ssr";
import { SERVICE_TAGS, SPECIALTY_TAGS } from "@/lib/tags";
import { getTotalListingCount } from "@/lib/supabase/queries";
import { ServiceTagIcon } from "@/components/service-tag-icon";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";

export const metadata: Metadata = {
  title: "Dog Grooming Services & Specialties",
  description: "Browse dog groomers by service or specialty across the PNW. Find the exact care your pet needs.",
};

// Colored card pattern: indices 3=teal, 4=amber, 7=amber
function getServiceCardStyle(index: number) {
  if (index === 3)
    return { bg: "bg-brand-accent text-white", iconBg: "bg-white/20", link: "text-white/80 hover:text-white", count: "text-white/70" };
  if (index === 4 || index === 7)
    return { bg: "bg-brand-secondary text-brand-primary", iconBg: "bg-brand-primary/10", link: "text-brand-primary/70 hover:text-brand-primary", count: "text-brand-primary/60" };
  return { bg: "bg-white border border-border text-brand-primary", iconBg: "bg-brand-secondary/15 text-brand-secondary", link: "text-brand-accent hover:text-brand-accent", count: "text-brand-secondary" };
}

export default async function ServicesHub() {
  const totalCount = await getTotalListingCount();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Services</span>
          </nav>

          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
            All Grooming Services
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3 text-brand-primary">
            Grooming <span className="text-brand-secondary">Services</span> & Specialties
          </h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Discover specialized care among {totalCount} groomers across the Pacific Northwest.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Services Grid */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              Popular Services
            </h2>
            <span className="text-sm text-text-muted">{SERVICE_TAGS.length} services</span>
          </div>

          <AnimatedSection variant="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_TAGS.map((service, index) => {
              const style = getServiceCardStyle(index);
              return (
                <AnimatedItem key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className={`${style.bg} rounded-2xl p-6 min-h-[200px] flex flex-col group transition-all hover:shadow-md`}
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${style.iconBg} mb-4 shrink-0`}>
                      <ServiceTagIcon slug={service.slug} className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading text-lg font-bold mb-1 leading-tight">
                      {service.label}
                    </h3>
                    {service.description && (
                      <p className="text-sm opacity-70 leading-relaxed mb-4 flex-1">
                        {service.description}
                      </p>
                    )}
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${style.link} transition-colors mt-auto`}>
                      View groomers
                      <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </AnimatedItem>
              );
            })}
          </AnimatedSection>
        </div>
      </section>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* Specialties Section */}
      <section className="bg-bg py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              Specialized Care
            </h2>
            <span className="text-sm text-text-muted">{SPECIALTY_TAGS.length} specialties</span>
          </div>

          <AnimatedSection variant="stagger" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPECIALTY_TAGS.map((specialty) => (
              <AnimatedItem key={specialty.slug}>
                <Link
                  href={`/specialties/${specialty.slug}`}
                  className="bg-white border border-border rounded-2xl p-6 flex flex-col group transition-all hover:shadow-md hover:border-brand-accent/40"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent mb-4 shrink-0">
                    <PawPrint weight="fill" className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-brand-primary mb-1 leading-tight">
                    {specialty.label}
                  </h3>
                  {specialty.description && (
                    <p className="text-sm text-text-muted leading-relaxed mb-4 flex-1">
                      {specialty.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-accent transition-colors mt-auto">
                    Browse groomers
                    <ArrowRight weight="bold" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </AnimatedItem>
            ))}
          </AnimatedSection>
        </div>
      </section>

      <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
    </div>
  );
}
