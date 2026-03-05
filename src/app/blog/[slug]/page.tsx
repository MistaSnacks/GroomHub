import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { CaretRight, CalendarBlank, Clock, Tag } from "@phosphor-icons/react/dist/ssr";
import {
  getBlogPostBySlug,
  getBlogPosts,
  getRelatedPosts,
  getCategoryLabel,
} from "@/lib/blog";
import { blogPostSchema, breadcrumbSchema } from "@/lib/schema";
import { BlogCard } from "@/components/blog-card";
import { AuthorBio } from "@/components/author-bio";
import { AdSlot } from "@/components/ad-slot";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";
import { mdxComponents } from "@/components/mdx-components";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  const ogImage = post.image || "/og-image.png";

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author.name],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);
  const categoryLabel = getCategoryLabel(post.category);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.title, href: `/blog/${post.slug}` },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostSchema(post)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />

      {/* Hero */}
      <section className="bg-brand-secondary py-12 md:py-16 md:pb-0 relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div className="md:pb-16">
              <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 mb-5 font-semibold tracking-wide">
                <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
                <CaretRight weight="bold" className="w-3 h-3 text-slate-500" />
                <Link href="/blog" className="hover:text-slate-900 transition-colors">Blog</Link>
                <CaretRight weight="bold" className="w-3 h-3 text-slate-500" />
                <span className="text-slate-900 truncate max-w-[200px]">{post.title}</span>
              </nav>

              <span className="inline-block text-xs font-semibold text-slate-800 bg-white/20 rounded-full px-3 py-1 mb-4">
                {categoryLabel}
              </span>

              <h1 className="font-heading text-3xl md:text-5xl font-bold !text-slate-900 mb-4 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CalendarBlank weight="bold" className="w-4 h-4" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock weight="bold" className="w-4 h-4" />
                  {post.readTime}
                </span>
                <span className="text-slate-800 font-medium">
                  By {post.author.name}
                </span>
              </div>
            </div>

            {/* Image Content */}
            {post.image && (
              <div className="flex justify-center md:justify-end items-end h-full w-full mt-8 md:mt-0">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-[220px] sm:w-[280px] md:w-[350px] object-contain drop-shadow-xl z-20 relative"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-0">
        <WaveDivider variant="gentle" fromColor="#4ECDC4" toColor="#FFFFFF" />
      </div>

      {/* Article Body */}
      <article className="bg-white py-10 flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose-custom space-y-6">
            <MDXRemote source={post.content} components={mdxComponents} />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag weight="bold" className="w-4 h-4 text-text-muted" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-bg rounded-full px-3 py-1 text-text-muted font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          <div className="mt-8">
            <AuthorBio author={post.author} />
          </div>

          {/* In-article ad */}
          <div className="mt-8">
            <AdSlot slot="blog-article" format="leaderboard" />
          </div>
        </div>
      </article>

      <WaveDivider variant="asymmetric" fromColor="#FFFFFF" toColor="#FDF8F0" />

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="bg-bg py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary mb-6">
              Related Articles
            </h2>
            <AnimatedSection
              variant="stagger"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {related.map((rPost) => (
                <AnimatedItem key={rPost.slug}>
                  <BlogCard post={rPost} />
                </AnimatedItem>
              ))}
            </AnimatedSection>
          </div>
        </section>
      )}

      <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
    </div>
  );
}
