// ─── JSON-LD Schema Generators ──────────────────────────
import type { NormalizedListing } from "./types";
import type { BlogPostFull } from "./blog";

export function localBusinessSchema(listing: NormalizedListing) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://groomhub.com/groomer/${listing.slug}`,
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
    ...(listing.rating > 0 && {
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
    image: listing.images?.[0],
    openingHoursSpecification: listing.hours
      ?.filter((h) => !h.closed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.day,
        opens: h.open,
        closes: h.close,
      })),
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
      item: `https://groomhub.com${item.href}`,
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
  return {
    breadcrumb: breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: type === "service" ? "Services" : "Specialties", href: "/services" },
      { name: label, href: `${basePath}/${slug}` },
    ]),
    itemList: itemListSchema(listings, `${label} Groomers in the Pacific Northwest`),
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
        url: `https://groomhub.com/groomer/${listing.slug}`,
        ...(listing.rating > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.review_count,
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
    author: {
      "@type": "Person",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "GroomHub",
      url: "https://groomhub.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://groomhub.com/blog/${post.slug}`,
    },
    ...(post.image && { image: post.image }),
  };
}
