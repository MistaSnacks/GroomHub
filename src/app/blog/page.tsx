import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "@phosphor-icons/react/dist/ssr";
import { getBlogPosts, getCategoryLabel, getGuideTopics } from "@/lib/blog";
import { getGuideListing } from "@/lib/grooming-guides";
import { blogListingSchema } from "@/lib/schema";
import { BlogCard } from "@/components/blog-card";
import { NewsletterCta } from "@/components/newsletter-cta";
import { WaveDivider } from "@/components/wave-divider";

export const metadata: Metadata = {
  title: "Grooming Guides | Tips & Pet Care",
  description:
    "Find grooming advice by topic, from choosing a groomer and understanding costs to seasonal care and breed-specific tips.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Grooming Guides | Tips & Pet Care",
    description: "Practical grooming guides for getting started, costs, special care, seasons, and breeds.",
    type: "website",
    url: "/blog",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GroomLocal Grooming Guides" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grooming Guides | Tips & Pet Care",
    description: "Practical grooming guides for getting started, costs, special care, seasons, and breeds.",
    images: ["/og-image.png"],
  },
};

interface BlogPageProps {
  searchParams: Promise<{ category?: string | string[]; topic?: string | string[] }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams;
  const [allPostsForSchema, topics] = await Promise.all([getBlogPosts(), getGuideTopics()]);
  const { topic, category, posts } = getGuideListing(allPostsForSchema, sp, topics);
  const title = topic?.title ?? (category ? getCategoryLabel(category) : "All grooming guides");
  const jsonLd = blogListingSchema(allPostsForSchema);

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="bg-bg py-14 md:py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-4 py-1.5 text-sm text-brand-accent font-semibold mb-6">
            <BookOpen weight="fill" className="w-4 h-4 text-brand-secondary" />
            Pet Care & Grooming
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-brand-primary">
            Grooming <span className="text-brand-secondary">Guides</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Find the right groomer, understand costs, and care for your pet’s coat. Browse by topic or explore every guide below.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      <section id="guides" className="bg-white py-10 scroll-mt-24 flex-1" aria-labelledby="guide-topics">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="guide-topics" className="font-heading text-2xl font-semibold text-brand-primary mb-5">
            What do you need help with?
          </h2>
          <nav aria-label="Guide topics" className="flex flex-wrap gap-2">
            <Link
              href="/blog#guides"
              aria-current={!topic && !category ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary ${
                !topic && !category
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-border bg-bg text-brand-primary hover:border-brand-primary/40"
              }`}
            >
              All guides ({allPostsForSchema.length})
            </Link>
            {topics.map((item) => (
              <Link
                key={item.id}
                href={`/blog?topic=${item.id}#guides`}
                aria-current={topic?.id === item.id ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary ${
                  topic?.id === item.id
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-border bg-bg text-brand-primary hover:border-brand-primary/40"
                }`}
              >
                {item.title} ({allPostsForSchema.filter((post) => item.slugs.includes(post.slug)).length})
              </Link>
            ))}
          </nav>
          <div className="mt-8 mb-6" aria-live="polite" aria-atomic="true">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">{title}</h2>
            <p className="mt-2 text-text-muted">
              {topic?.subtitle ?? "Practical advice for your pet’s next groom."}{" "}
              {posts.length} {posts.length === 1 ? "guide" : "guides"}
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted">
              <p className="font-heading text-lg">No guides found in this category.</p>
              <Link href="/blog" className="text-brand-accent hover:underline text-sm mt-2 inline-block">
                View all guides
              </Link>
            </div>
          )}
        </div>
      </section>

      <WaveDivider variant="steep" fromColor="#FFFFFF" toColor="#FF7E67" />

      {/* Newsletter CTA */}
      <NewsletterCta />

      <WaveDivider variant="footer" fromColor="#FF7E67" toColor="#4ECDC4" />
    </div>
  );
}
