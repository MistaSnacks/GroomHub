import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { SERVICE_TAGS } from "@/lib/tags";
import { ServiceTagIcon } from "./service-tag-icon";
import { AnimatedSection, AnimatedItem } from "./animated-section";

interface BrowseByServiceSectionProps {
  serviceCounts?: Record<string, number>;
}

const SHOWN_SERVICE_SLUGS = [
  "full-groom",
  "cat-grooming",
  "nail-care",
  "dog-bath",
  "mobile-grooming",
  "self-wash",
  "teeth-cleaning",
  "deshedding",
];

const ICON_BG_COLORS = [
  "bg-brand-accent/15 text-brand-accent",
  "bg-brand-secondary/15 text-brand-secondary",
  "bg-brand-primary/10 text-brand-primary",
  "bg-brand-accent/15 text-brand-accent",
  "bg-brand-secondary/15 text-brand-secondary",
  "bg-brand-primary/10 text-brand-primary",
  "bg-brand-accent/15 text-brand-accent",
  "bg-brand-secondary/15 text-brand-secondary",
];

export function BrowseByServiceSection({ serviceCounts }: BrowseByServiceSectionProps) {
  const services = SERVICE_TAGS.filter((t) =>
    SHOWN_SERVICE_SLUGS.includes(t.slug)
  );

  return (
    <section className="bg-bg py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-2">
            Our Services
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-2">
            Browse by Service
          </h2>
          <p className="text-text-muted text-base max-w-lg">
            Find exactly the grooming service your pet needs
          </p>
        </div>

        <AnimatedSection variant="stagger" className="flex flex-wrap gap-4">
          {services.map((tag, index) => (
            <AnimatedItem key={tag.slug}>
              <Link
                href={`/services/${tag.slug}`}
                className="inline-flex items-center gap-3 bg-white rounded-full px-5 py-3 border border-border hover:border-brand-accent/40 hover:shadow-sm transition-all group"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${ICON_BG_COLORS[index % ICON_BG_COLORS.length]} shrink-0`}>
                  <ServiceTagIcon slug={tag.slug} className="w-5 h-5" />
                </div>
                <span className="font-heading font-semibold text-brand-primary group-hover:text-brand-accent transition-colors">
                  {tag.label}
                </span>
                {serviceCounts?.[tag.slug] !== undefined && (
                  <span className="text-sm text-text-muted">
                    {serviceCounts[tag.slug]} groomers
                  </span>
                )}
              </Link>
            </AnimatedItem>
          ))}

          {/* View all services pill */}
          <AnimatedItem>
            <Link
              href="/services"
              className="inline-flex items-center gap-3 rounded-full px-5 py-3 border-2 border-dashed border-border hover:border-brand-accent/40 transition-all group"
            >
              <span className="font-heading font-semibold text-text-muted group-hover:text-brand-accent transition-colors">
                View all services
              </span>
              <ArrowRight weight="bold" className="w-4 h-4 text-text-muted group-hover:text-brand-accent transition-colors" />
            </Link>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </section>
  );
}
