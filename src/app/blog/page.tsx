import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CaretRight, BookOpen } from "@phosphor-icons/react/dist/ssr";
import { getBlogPosts, getBlogCategories } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { BlogCategoryFilter } from "@/components/blog-category-filter";
import { NewsletterCta } from "@/components/newsletter-cta";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";

export const metadata: Metadata = {
  title: "Blog — Grooming Tips, Guides & Pet Care",
  description:
    "Expert grooming tips, seasonal care guides, and pet care advice from PNW groomers. Keep your furry friend looking and feeling their best.",
};

interface BlogPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams;
  const category = sp.category;
  const allPosts = getBlogPosts(category);
  const categories = getBlogCategories();

  const featuredPost = !category ? allPosts[0] : undefined;
  const gridPosts = featuredPost ? allPosts.slice(1) : allPosts;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-14 md:py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-4 py-1.5 text-sm text-brand-accent font-semibold mb-6">
            <BookOpen weight="fill" className="w-4 h-4 text-brand-secondary" />
            The GroomHub Blog
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-brand-primary">
            Tips, Trends & <span className="text-brand-secondary">Tail Wags</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Expert grooming tips, seasonal care guides, and pet care advice from trusted PNW groomers.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Category Filter + Featured */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense>
            <BlogCategoryFilter categories={categories} />
          </Suspense>

          {/* Featured article */}
          {featuredPost && (
            <div className="mt-8">
              <BlogCard post={featuredPost} featured />
            </div>
          )}
        </div>
      </section>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* Article Grid */}
      <section className="bg-bg py-10 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-semibold text-brand-primary mb-6">
            {category ? "Filtered Articles" : "Latest Articles"}
          </h2>

          {gridPosts.length > 0 ? (
            <AnimatedSection
              variant="stagger"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {gridPosts.map((post) => (
                <AnimatedItem key={post.slug}>
                  <BlogCard post={post} />
                </AnimatedItem>
              ))}
            </AnimatedSection>
          ) : (
            <div className="text-center py-16 text-text-muted">
              <p className="font-heading text-lg">No articles found in this category.</p>
              <Link href="/blog" className="text-brand-accent hover:underline text-sm mt-2 inline-block">
                View all articles
              </Link>
            </div>
          )}
        </div>
      </section>

      <WaveDivider variant="steep" fromColor="#FDF8F0" toColor="#FF7E67" />

      {/* Newsletter CTA */}
      <NewsletterCta />

      <WaveDivider variant="footer" fromColor="#FF7E67" toColor="#4ECDC4" />
    </div>
  );
}
