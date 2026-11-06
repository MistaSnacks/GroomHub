import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BlogCard } from "@/components/blog-card";
import { getBlogPosts, getLinkableBlogSlugs } from "@/lib/blog";
import { homeGuideSlugs } from "@/lib/internal-links";

export async function HomeGuidesSection() {
  const [posts, linkable] = await Promise.all([getBlogPosts(undefined, true), getLinkableBlogSlugs()]);
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const guides = homeGuideSlugs(linkable)
    .map((slug) => bySlug.get(slug))
    .filter((post) => post !== undefined);
  if (guides.length === 0) return null;

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-brand-primary mb-4">
            What Dog Grooming Costs
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Read our price guides and tips so you know what to expect before you book.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {guides.map((post) => (
            <BlogCard key={post.slug} post={post} linkSrc="home-guides" />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/blog"
            data-link-src="home-guides"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent-ink hover:text-brand-primary transition-colors"
          >
            Browse all grooming guides
            <ArrowRight weight="bold" className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
