// ─── JSON-LD Schema Generators ──────────────────────────
import type { NormalizedListing } from "./types";
import type { BlogPostFull } from "./blog";

const BASE_URL = "https://groomlocal.com";

/** Force http → https for image URLs */
function safeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return url;
}

export function localBusinessSchema(listing: NormalizedListing) {
  const image = safeImageUrl(listing.images?.[0]);
  const hours = listing.hours?.filter((h) => !h.closed);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BASE_URL}/groomer/${listing.slug}`,
    name: listing.name,
    description: listing.short_description || listing.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip,
      addressCountry: "US",
    },
    telephone: listing.phone,
    ...(listing.website && { url: listing.website }),
    ...(listing.email && { email: listing.email }),
    ...(listing.rating > 0 && listing.review_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: listing.rating,
        reviewCount: listing.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(listing.lat && listing.lng && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: listing.lat,
        longitude: listing.lng,
      },
    }),
    priceRange: listing.price_range || "$$",
    ...(image && { image }),
    ...(hours && hours.length > 0 && {
      openingHoursSpecification: hours.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.day,
        opens: h.open,
        closes: h.close,
      })),
    }),
  };
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

export function faqSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function servicePageSchema(
  slug: string,
  label: string,
  type: "service" | "specialty",
  listings: NormalizedListing[]
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

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumbBody, itemListBody],
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
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((listing, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: listing.name,
        url: `${BASE_URL}/groomer/${listing.slug}`,
        ...(listing.rating > 0 && listing.review_count > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      },
    })),
  };
}

export function blogPostSchema(post: BlogPostFull) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "GroomLocal",
      url: BASE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${post.slug}`,
    },
    image: safeImageUrl(post.image ?? undefined) || `${BASE_URL}/og-image.png`,
  };
}
