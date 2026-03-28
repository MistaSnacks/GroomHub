import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Users,
  Calendar,
  ArrowSquareOut,
  PawPrint,
  ShieldCheck,
  ImageSquare,
  CaretRight,
  CurrencyDollar,
  CalendarCheck,
  Hourglass,
} from "@phosphor-icons/react/dist/ssr";
import { BadgePill } from "@/components/badge-pill";
import { GalleryImage } from "@/components/gallery-image";
import { ListingCard } from "@/components/listing-card";
import { FeaturedListingBanner } from "@/components/featured-listing-banner";
import { AdSlot } from "@/components/ad-slot";
import { WaveDivider } from "@/components/wave-divider";
import { ContactForm } from "@/components/contact-form";
import { getListingBySlug, getListingsByCity } from "@/lib/supabase/queries";
import { getServiceLabel, getSpecialtyLabel, getServiceTag, getSpecialtyTag } from "@/lib/tags";
import { localBusinessSchema, breadcrumbSchema } from "@/lib/schema";
import { stateSlugFromAbbr, stateNameFromAbbr } from "@/lib/geography";
import { PageViewTracker } from "@/components/page-view-tracker";
import { clampDescription, clampTitle } from "@/lib/seo-utils";

export const revalidate = 300;

interface GroomerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GroomerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) return { title: "Groomer Not Found" };

  const unsanitized = listing.short_description || listing.description;
  // Strip URLs, image refs, markdown artifacts, and excessive whitespace from scraped data
  const rawDesc = unsanitized
    .replace(/\(?\bhttps?:\/\/[^\s)]+\)?/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/[#*_~`]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Build a description that lands in the 120-155 char sweet spot
  // If rawDesc is empty after sanitization, use a constructed fallback
  let truncatedDesc: string;
  if (!rawDesc || rawDesc.length < 20) {
    truncatedDesc = clampDescription(
      `${listing.name} offers professional dog grooming in ${listing.city}, ${listing.state}. View services, pricing, hours, and contact info on GroomLocal.`
    );
  } else if (rawDesc.length < 120) {
    // Pad short descriptions with location and service context
    let padded = `${rawDesc} View services, pricing, and contact info for ${listing.name} in ${listing.city}, ${listing.state}. Compare on GroomLocal.`;
    // If still too short, use a fully constructed fallback
    if (padded.length < 120) {
      padded = `${listing.name} is a dog groomer in ${listing.city}, ${listing.state}. ${rawDesc} View services, pricing, and hours on GroomLocal.`;
    }
    truncatedDesc = clampDescription(padded);
  } else {
    truncatedDesc = clampDescription(rawDesc);
  }
  // Build SEO title: try full format, then drop "Groomer", then truncate name
  const suffix = ` | ${listing.city}, ${listing.state}`;
  const fullTitle = `${listing.name}${suffix} Groomer`;
  let title: string;
  if (fullTitle.length <= 47) {
    title = fullTitle;
  } else if (`${listing.name}${suffix}`.length <= 47) {
    title = `${listing.name}${suffix}`;
  } else {
    title = clampTitle(`${listing.name}${suffix}`);
  }
  const ogImage = `/api/og/groomer?slug=${encodeURIComponent(slug)}`;

  return {
    title,
    description: truncatedDesc,
    alternates: { canonical: `/groomer/${slug}` },
    openGraph: {
      title,
      description: truncatedDesc,
      type: "website",
      url: `/groomer/${slug}`,
      siteName: "GroomLocal",
      images: [{ url: ogImage, width: 1200, height: 630, alt: listing.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: truncatedDesc,
      images: [ogImage],
    },
  };
}

export default async function GroomerPage({ params }: GroomerPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const similarListings = await getListingsByCity(listing.city_slug, listing.state);
  const similar = similarListings.filter((l) => l.slug !== listing.slug).slice(0, 2);
  const stateSlug = stateSlugFromAbbr(listing.state);
  const stateName = stateNameFromAbbr(listing.state);
  // Breadcrumb data
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Dog Grooming", href: "/dog-grooming" },
    { name: stateName, href: `/dog-grooming/${stateSlug}` },
    { name: listing.city, href: `/dog-grooming/${stateSlug}/${listing.city_slug}` },
    { name: listing.name, href: `/groomer/${listing.slug}` },
  ];

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema(listing)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />

      <PageViewTracker listingId={listing.id} />

      {/* Breadcrumbs */}
      <div className="bg-gradient-to-b from-bg to-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <CaretRight weight="bold" className="w-3 h-3" />}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-brand-primary transition-colors">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-brand-primary font-medium truncate max-w-[200px]">
                    {crumb.name}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Business Hero */}
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {listing.badges?.map((badge) => (
                      <BadgePill key={badge} badge={badge} size="md" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {listing.logo_url && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
                        <Image src={listing.logo_url} alt={`${listing.name} logo`} fill className="object-cover" sizes="64px" />
                      </div>
                    )}
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-brand-primary">
                      {listing.name}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-text-muted mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin weight="fill" className="h-4 w-4" />
                  {listing.address}, {listing.city}, {listing.state} {listing.zip}
                </span>
                {listing.phone ? (
                  <a href={`tel:${listing.phone}`} className="flex items-center gap-1.5 hover:text-brand-primary transition-colors">
                    <Phone weight="fill" className="h-4 w-4" />
                    {listing.phone}
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-text-muted/50">
                    <Phone weight="fill" className="h-4 w-4" />
                    Phone not listed
                  </span>
                )}
                {listing.website ? (
                  listing.owner_id ? (
                    <a
                      href={listing.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-brand-accent hover:underline"
                    >
                      <Globe weight="bold" className="h-4 w-4" />
                      Website
                      <ArrowSquareOut weight="bold" className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="flex items-center gap-1.5 text-text-muted">
                      <Globe weight="bold" className="h-4 w-4" />
                      {listing.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1.5 text-text-muted/50">
                    <Globe weight="bold" className="h-4 w-4" />
                    Website not available
                  </span>
                )}
              </div>

              {/* Availability Status */}
              {listing.waitlist_status && (
                <div className="flex items-center gap-2 mt-2">
                  {listing.waitlist_status === "immediate" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                      <CalendarCheck weight="fill" className="w-3.5 h-3.5" />
                      Accepting new clients
                    </span>
                  )}
                  {listing.waitlist_status === "short" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                      <Hourglass weight="fill" className="w-3.5 h-3.5" />
                      Short waitlist
                    </span>
                  )}
                  {listing.waitlist_status === "long" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                      <Hourglass weight="fill" className="w-3.5 h-3.5" />
                      Long waitlist
                    </span>
                  )}
                  {listing.waitlist_status === "closed" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                      <Hourglass weight="fill" className="w-3.5 h-3.5" />
                      Not accepting new clients
                    </span>
                  )}
                </div>
              )}

              {/* Claim CTA - only show if unclaimed */}
              {!listing.owner_id ? (
                <Link
                  href={`/claim/${listing.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-primary transition-colors"
                >
                  <ShieldCheck weight="duotone" className="w-3.5 h-3.5" />
                  Is this your business? Claim this listing
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-brand-secondary font-medium">
                  <ShieldCheck weight="fill" className="w-3.5 h-3.5" />
                  Verified owner
                </span>
              )}
            </div>

            {/* Gallery */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.images && listing.images.filter((img) => !img.includes("unsplash.com") && !img.includes("pexels.com") && !img.includes("placehold.co") && !img.includes("placeholder")).length > 0 ? (
                  listing.images
                    .filter((img) => !img.includes("unsplash.com") && !img.includes("pexels.com") && !img.includes("placehold.co") && !img.includes("placeholder"))
                    .map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface">
                        <GalleryImage
                          src={img}
                          alt={`${listing.name} photo ${i + 1}`}
                        />
                      </div>
                    ))
                ) : (
                  // "Photo here" placeholders
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-gradient-to-br from-surface to-brand-secondary/5 flex flex-col items-center justify-center"
                    >
                      <ImageSquare weight="duotone" className="w-10 h-10 text-text-muted/20 mb-1" />
                      <span className="text-xs text-text-muted/30 font-medium">Photo here</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Services (normalized tags) */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                Services
              </h2>
              {listing.service_tags.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listing.service_tags.map((slug) => {
                    const tag = getServiceTag(slug);
                    return (
                      <div key={slug} className="rounded-xl bg-brand-secondary/5 border border-brand-secondary/15 p-3">
                        <span className="text-sm font-semibold text-brand-primary">
                          {getServiceLabel(slug)}
                        </span>
                        {tag?.description && (
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : listing.services.length > 0 ? (
                <div className="divide-y divide-border">
                  {listing.services.map((service) => (
                    <div key={service} className="flex items-center justify-between py-3">
                      <span className="text-sm text-text">{service}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No services listed yet.</p>
              )}
            </div>

            {/* Specialties */}
            {listing.specialty_tags.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                  Specialties
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listing.specialty_tags.map((slug) => {
                    const tag = getSpecialtyTag(slug);
                    return (
                      <div key={slug} className="rounded-xl bg-brand-accent/5 border border-brand-accent/15 p-3">
                        <span className="text-sm font-semibold text-brand-primary">
                          {getSpecialtyLabel(slug)}
                        </span>
                        {tag?.description && (
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* About */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                About {listing.name}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                {listing.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {listing.year_established > 0 && (
                  <div className="rounded-xl bg-surface p-3 text-center">
                    <Calendar weight="fill" className="h-4 w-4 text-brand-accent mx-auto mb-1" />
                    <p className="text-xs text-text-muted">Est.</p>
                    <p className="text-sm font-semibold text-brand-primary">{listing.year_established}</p>
                  </div>
                )}
                {listing.team_size > 0 && (
                  <div className="rounded-xl bg-surface p-3 text-center">
                    <Users weight="fill" className="h-4 w-4 text-brand-accent mx-auto mb-1" />
                    <p className="text-xs text-text-muted">Team</p>
                    <p className="text-sm font-semibold text-brand-primary">{listing.team_size} groomers</p>
                  </div>
                )}
                <div className="rounded-xl bg-surface p-3 text-center">
                  <CurrencyDollar weight="fill" className="h-4 w-4 text-brand-accent mx-auto mb-1" />
                  <p className="text-xs text-text-muted">Starting at</p>
                  {listing.price_min > 0 ? (
                    <p className="text-sm font-semibold text-brand-primary">
                      ${listing.price_min} - ${listing.price_max}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-brand-primary">{listing.price_range || "$$"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            {listing.price_min > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                  Pricing
                </h2>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-brand-primary">${listing.price_min}</span>
                  <span className="text-text-muted">to</span>
                  <span className="text-2xl font-bold text-brand-primary">${listing.price_max}</span>
                </div>
                <p className="text-sm text-text-muted">
                  Prices vary by breed, coat type, and services requested. Contact {listing.name} for an exact quote.
                </p>
                {listing.transparent_pricing && (
                  <p className="text-xs text-brand-secondary font-medium mt-2 flex items-center gap-1">
                    <ShieldCheck weight="fill" className="w-3.5 h-3.5" />
                    This business offers transparent, upfront pricing
                  </p>
                )}
              </div>
            )}

            {/* Hours */}
            {listing.hours && listing.hours.length > 0 && (
              <div className="rounded-2xl border border-border bg-white p-6">
                <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                  Business Hours
                </h2>
                <div className="divide-y divide-border">
                  {listing.hours.map((h) => (
                    <div key={h.day} className="flex items-center justify-between py-2.5">
                      <span className="text-sm font-medium text-text">{h.day}</span>
                      <span className={`text-sm ${h.closed ? "text-fun-pop" : "text-text-muted"}`}>
                        {h.closed ? "Closed" : `${h.open} - ${h.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Groomers */}
            {similar.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-semibold text-brand-primary mb-4">
                  Similar Groomers in {listing.city}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similar.map((l, i) => (
                    <ListingCard key={l.slug} listing={l} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-[340px] flex-shrink-0">
            <div className="sticky top-24 space-y-4">

              {/* Premium Contact Form */}
              {listing.owner_id && (
                <div className="mb-4">
                  <ContactForm listingId={listing.id} listingName={listing.name} />
                </div>
              )}

              {/* Location */}
              <div className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-heading text-base font-semibold text-brand-primary mb-3">
                  Location
                </h3>
                <div className="space-y-2 text-sm text-text-muted">
                  <p className="flex items-start gap-2">
                    <MapPin weight="fill" className="w-4 h-4 shrink-0 mt-0.5 text-brand-secondary" />
                    {listing.address}<br />{listing.city}, {listing.state} {listing.zip}
                  </p>
                  {listing.phone ? (
                    <p className="flex items-center gap-2">
                      <Phone weight="fill" className="w-4 h-4 shrink-0" />
                      <a href={`tel:${listing.phone}`} className="hover:text-brand-primary transition-colors">{listing.phone}</a>
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-text-muted/50">
                      <Phone weight="fill" className="w-4 h-4 shrink-0" />
                      Phone not listed
                    </p>
                  )}
                  {listing.website ? (
                    listing.owner_id ? (
                      <p className="flex items-center gap-2">
                        <Globe weight="bold" className="w-4 h-4 shrink-0" />
                        <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline truncate">
                          {listing.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </a>
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-text-muted">
                        <Globe weight="bold" className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {listing.website.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </span>
                      </p>
                    )
                  ) : (
                    <p className="flex items-center gap-2 text-text-muted/50">
                      <Globe weight="bold" className="w-4 h-4 shrink-0" />
                      Website not available
                    </p>
                  )}
                </div>

                {/* Map embed */}
                {listing.lat && listing.lng && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-border">
                    <iframe
                      width="100%"
                      height="200"
                      frameBorder="0"
                      style={{ border: 0 }}
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${listing.lat},${listing.lng}&z=15&output=embed`}
                      allowFullScreen
                      title={`Map for ${listing.name}`}
                      loading="lazy"
                    />
                  </div>
                )}

                {listing.booking_url && (
                  <a
                    href={listing.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center w-full px-4 py-2.5 rounded-full cta-gradient text-brand-primary font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    <CalendarCheck weight="bold" className="w-4 h-4 mr-2" />
                    Book an Appointment
                  </a>
                )}
              </div>

              {/* Service Tags Sidebar */}
              {listing.service_tags.length > 0 && (
                <div className="rounded-2xl border border-border bg-white p-5">
                  <h3 className="font-heading text-sm font-semibold text-brand-primary mb-3">
                    Services Offered
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.service_tags.map((slug) => (
                      <span
                        key={slug}
                        className="rounded-full bg-brand-secondary/10 px-3 py-1 text-xs font-medium text-brand-secondary"
                      >
                        {getServiceLabel(slug)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialties Sidebar */}
              {listing.specialty_tags.length > 0 && (
                <div className="rounded-2xl border border-border bg-white p-5">
                  <h3 className="font-heading text-sm font-semibold text-brand-primary mb-3">
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.specialty_tags.map((slug) => (
                      <span
                        key={slug}
                        className="rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent"
                      >
                        {getSpecialtyLabel(slug)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Points */}
              <div className="rounded-2xl border border-border bg-white p-5">
                <h3 className="font-heading text-sm font-semibold text-brand-primary mb-3">
                  Why Pet Parents Trust Them
                </h3>
                <ul className="space-y-2">
                  {listing.is_paw_verified && (
                    <li className="flex items-center gap-2 text-sm text-text-muted">
                      <span className="text-success">&#10003;</span> Paw-Verified Business
                    </li>
                  )}
                  {listing.year_established > 0 && (
                    <li className="flex items-center gap-2 text-sm text-text-muted">
                      <span className="text-success">&#10003;</span> Since {listing.year_established}
                    </li>
                  )}
                  {listing.team_size > 0 && (
                    <li className="flex items-center gap-2 text-sm text-text-muted">
                      <span className="text-success">&#10003;</span> {listing.team_size} professional groomers
                    </li>
                  )}
                </ul>
              </div>

              {/* Claim CTA Card - only show if unclaimed */}
              {!listing.owner_id && (
                <div className="rounded-2xl bg-brand-secondary p-5">
                  <h3 className="font-heading text-base font-bold text-brand-primary mb-2">
                    Is this your business?
                  </h3>
                  <p className="text-sm text-brand-primary/70 mb-4">
                    Claim your free listing to manage your profile and connect with more pet parents.
                  </p>
                  <Link
                    href={`/claim/${listing.slug}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-full bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary/90 transition-colors"
                  >
                    Claim Listing
                  </Link>
                </div>
              )}

              {/* Sidebar Ad */}
              <AdSlot slot="groomer-sidebar" format="sidebar" />
            </div>
          </div>
        </div>
      </div>

      <WaveDivider variant="footer" fromColor="#FFFFFF" toColor="#4ECDC4" />
    </>
  );
}
