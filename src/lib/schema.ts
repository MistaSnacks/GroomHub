// --- JSON-LD Schema Generators ---
import type { NormalizedListing } from "./types";
import type { BlogPostFull } from "./blog";
import { getServiceTag } from "./tags";

const BASE_URL = "https://groomlocal.com";

/** Validate that a string looks like a valid URL */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Force http to https for image URLs, validate result */
function safeImageUrl(url: string | undefined | null): string | undefined {
  if (!url || !url.trim()) return undefined;
  let resolved = url.trim();
  if (resolved.startsWith("http://")) resolved = resolved.replace("http://", "https://");
  if (resolved.startsWith("/")) resolved = `${BASE_URL}${resolved}`;
  if (!isValidUrl(resolved)) return undefined;
  return resolved;
}

/** Validate and normalize a website URL */
function safeWebsiteUrl(url: string | undefined | null): string | undefined {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (!isValidUrl(trimmed)) return undefined;
  return trimmed;
}

function sanitizeDescription(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  let clean = text.replace(/https?:\/\/\S+/g, "").trim();
  clean = clean.replace(/<[^>]*>/g, "").trim();
  clean = clean.replace(/\s+/g, " ").trim();
  if (clean.length < 20) return undefined;
  if (clean.length > 300) clean = clean.substring(0, 297) + "...";
  return clean;
}

/** Valid schema.org day names */
const VALID_DAYS = new Set([
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
]);

/** Validate time format (HH:MM or H:MM) */
function isValidTime(time: string): boolean {
  return /^\d{1,2}:\d{2}(:\d{2})?(\s?(AM|PM))?$/i.test(time);
}

export function localBusinessSchema(listing: NormalizedListing) {
  const image = safeImageUrl(listing.images?.[0]);
  const validWebsite = safeWebsiteUrl(listing.website);
  const hours = listing.hours?.filter(
    (h) => !h.closed && h.open && h.close && VALID_DAYS.has(h.day) && isValidTime(h.open) && isValidTime(h.close)
  );

  // Build address only with non-empty fields
  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressCountry: "US",
  };
  if (listing.address?.trim()) address.streetAddress = listing.address.trim();
  if (listing.city?.trim()) address.addressLocality = listing.city.trim();
  if (listing.state?.trim()) address.addressRegion = listing.state.trim();
  if (listing.zip?.trim()) address.postalCode = listing.zip.trim();

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/groomer/${listing.slug}`,
    name: listing.name,
    address,
  };

  const desc = sanitizeDescription(listing.short_description) || sanitizeDescription(listing.description);
  if (desc) schema.description = desc;

  // Only include telephone when it has a real value
  if (listing.phone?.trim()) schema.telephone = listing.phone.trim();

  if (validWebsite) schema.url = validWebsite;
  if (listing.email?.trim()) schema.email = listing.email.trim();

  // Geo coordinates must be valid numbers
  if (
    typeof listing.lat === "number" && typeof listing.lng === "number" &&
    isFinite(listing.lat) && isFinite(listing.lng) &&
    listing.lat !== 0 && listing.lng !== 0
  ) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.lat,
      longitude: listing.lng,
    };
  }

  // priceRange is deprecated by Google - use makesOffer/priceSpecification instead
  // (removed priceRange field entirely)

  if (image) schema.image = image;

  if (hours && hours.length > 0) {
    schema.openingHoursSpecification = hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day,
      opens: h.open,
      closes: h.close,
    }));
  }

  // Service catalog with proper Offer types
  if (listing.service_tags && listing.service_tags.length > 0) {
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Grooming Services",
      itemListElement: listing.service_tags.map((slug) => {
        const tag = getServiceTag(slug);
        const offer: Record<string, unknown> = {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: tag?.label || slug,
            ...(tag?.description ? { description: tag.description } : {}),
          },
        };
        return offer;
      }),
    };
  }

  if (typeof listing.price_min === "number" && listing.price_min > 0) {
    schema.makesOffer = {
      "@type": "Offer",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: listing.price_min,
        ...(typeof listing.price_max === "number" && listing.price_max > 0
          ? { maxPrice: listing.price_max }
          : {}),
        priceCurrency: "USD",
      },
    };
  }

  return schema;
}

export function breadcrumbSchema(
  items: { name: string; href: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.href}`,
    })),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GroomLocal",
    url: BASE_URL,
    description: "Find the best dog groomers in Seattle, Tacoma, Portland, and across the Pacific Northwest.",
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GroomLocal",
    url: BASE_URL,
    logo: `${BASE_URL}/icon.svg`,
    description: "The Pacific Northwest's most trusted pet grooming directory.",
    areaServed: [
      { "@type": "AdministrativeArea", name: "Washington" },
      { "@type": "AdministrativeArea", name: "Oregon" },
    ],
  };
}

export function cityPageSchema(
  listings: NormalizedListing[],
  cityName: string,
  stateAbbr: string,
  statePath: string,
  citySlug: string,
  faqs?: Array<{ question: string; answer: string }>
) {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", href: "/" },
    { name: "Dog Grooming", href: "/dog-grooming" },
    { name: stateAbbr === "WA" ? "Washington" : "Oregon", href: `/dog-grooming/${statePath}` },
    { name: cityName, href: `/dog-grooming/${statePath}/${citySlug}` },
  ]);
  const itemList = itemListSchema(listings, `Dog Groomers in ${cityName}, ${stateAbbr}`);

  const { "@context": _bc, ...breadcrumbBody } = breadcrumb;
  const { "@context": _il, ...itemListBody } = itemList;

  const graph: Record<string, unknown>[] = [breadcrumbBody, itemListBody];

  if (faqs && faqs.length > 0) {
    const validFaqs = faqs.filter(
      (faq) => faq.question?.trim() && faq.answer?.trim()
    );
    if (validFaqs.length > 0) {
      const faqSchema = cityFaqSchema(validFaqs);
      const { "@context": _fq, ...faqBody } = faqSchema;
      graph.push(faqBody);
    }
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function serviceCityPageSchema(
  listings: NormalizedListing[],
  cityName: string,
  stateAbbr: string,
  statePath: string,
  citySlug: string,
  hub: { name: string; path: string },
  faqs?: Array<{ question: string; answer: string }>,
  listName?: string
) {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", href: "/" },
    { name: hub.name, href: hub.path },
    { name: stateAbbr === "WA" ? "Washington" : "Oregon", href: `${hub.path}/${statePath}` },
    { name: cityName, href: `${hub.path}/${statePath}/${citySlug}` },
  ]);
  const itemList = itemListSchema(
    listings,
    listName ?? `${hub.name} in ${cityName}, ${stateAbbr}`
  );

  const { "@context": _bc, ...breadcrumbBody } = breadcrumb;
  const { "@context": _il, ...itemListBody } = itemList;

  const graph: Record<string, unknown>[] = [breadcrumbBody, itemListBody];

  if (faqs && faqs.length > 0) {
    const validFaqs = faqs.filter(
      (faq) => faq.question?.trim() && faq.answer?.trim()
    );
    if (validFaqs.length > 0) {
      const faqSchema = cityFaqSchema(validFaqs);
      const { "@context": _fq, ...faqBody } = faqSchema;
      graph.push(faqBody);
    }
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function statePageSchema(stateName: string, statePath: string) {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", href: "/" },
    { name: "Dog Grooming", href: "/dog-grooming" },
    { name: stateName, href: `/dog-grooming/${statePath}` },
  ]);

  const { "@context": _bc, ...breadcrumbBody } = breadcrumb;

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumbBody],
  };
}

export function servicePageSchema(
  slug: string,
  label: string,
  type: "service" | "specialty",
  listings: NormalizedListing[],
  faqs?: Array<{ question: string; answer: string }>
) {
  const basePath = type === "service" ? "/services" : "/specialties";
  const breadcrumb = breadcrumbSchema([
    { name: "Home", href: "/" },
    { name: type === "service" ? "Services" : "Specialties", href: basePath },
    { name: label, href: `${basePath}/${slug}` },
  ]);
  const itemList = itemListSchema(listings, `${label} Groomers in the Pacific Northwest`);

  // Remove duplicate @context for @graph wrapper
  const { "@context": _bc, ...breadcrumbBody } = breadcrumb;
  const { "@context": _il, ...itemListBody } = itemList;

  const graph: object[] = [breadcrumbBody, itemListBody];

  if (faqs && faqs.length > 0) {
    const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
    if (validFaqs.length > 0) {
      const faq = cityFaqSchema(validFaqs);
      const { "@context": _fq, ...faqBody } = faq;
      graph.push(faqBody);
    }
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function itemListSchema(
  listings: NormalizedListing[],
  name: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: Math.min(listings.length, 20),
    itemListElement: listings.slice(0, 20).map((listing, i) => {
      const item: Record<string, unknown> = {
        "@type": "LocalBusiness",
        name: listing.name,
        url: `${BASE_URL}/groomer/${listing.slug}`,
      };

      if (listing.address?.trim()) {
        const address: Record<string, string> = {
          "@type": "PostalAddress",
          addressCountry: "US",
        };
        if (listing.address.trim()) address.streetAddress = listing.address.trim();
        if (listing.city?.trim()) address.addressLocality = listing.city.trim();
        if (listing.state?.trim()) address.addressRegion = listing.state.trim();
        item.address = address;
      }

      return {
        "@type": "ListItem",
        position: i + 1,
        item,
      };
    }),
  };
}

export function cityFaqSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  const validFaqs = faqs.filter(
    (faq) => faq.question?.trim() && faq.answer?.trim()
  );

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.trim(),
      },
    })),
  };
}

export function blogPostSchema(
  post: BlogPostFull,
  options?: { wordCount?: number; articleSection?: string; keywords?: string[] }
) {
  const image = safeImageUrl(post.image ?? undefined) || `${BASE_URL}/og-image.png`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    dateModified: post.dateModified || post.date,
    inLanguage: "en-US",
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "GroomLocal",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${post.slug}`,
    },
    image,
  };

  if (post.excerpt?.trim()) schema.description = post.excerpt.trim();
  if (options?.wordCount && options.wordCount > 0) schema.wordCount = options.wordCount;
  if (options?.articleSection) schema.articleSection = options.articleSection;
  if (options?.keywords && options.keywords.length > 0) schema.keywords = options.keywords;

  return schema;
}

export function blogListingSchema(
  posts: { title: string; slug: string; excerpt: string; date: string }[]
) {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
  ]);

  const { "@context": _bc, ...breadcrumbBody } = breadcrumb;

  const collectionPage = {
    "@type": "CollectionPage",
    name: "GroomLocal Blog",
    description:
      "Expert grooming tips, seasonal care guides, and pet care advice from PNW groomers.",
    url: `${BASE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "GroomLocal",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icon.svg`,
      },
    },
    hasPart: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      description: post.excerpt,
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumbBody, collectionPage],
  };
}

export function resourcesPageSchema(
  posts: { title: string; slug: string; excerpt: string; date: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pet Owner Resources",
    description:
      "Grooming guides organized by what you need: getting started, costs, special situations, seasonal care, and breed-specific tips.",
    url: `${BASE_URL}/resources`,
    publisher: {
      "@type": "Organization",
      name: "GroomLocal",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icon.svg`,
      },
    },
    hasPart: posts.map((post) => ({
      "@type": "Article",
      headline: post.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      description: post.excerpt,
    })),
  };
}
