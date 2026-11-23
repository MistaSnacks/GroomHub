import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BlogCard } from "@/components/blog-card";
import { getHomeGuides, getLinkableBlogSlugs } from "@/lib/blog";

export async function HomeGuidesSection() {
  const [guides, linkable] = await Promise.all([getHomeGuides(), getLinkableBlogSlugs()]);
  const priceIndexSlug = "dog-grooming-prices-pnw-price-index-2026";
  if (guides.length === 0) return null;

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <h2 className="display-h2 font-heading text-brand-primary mb-4">
            What Dog Grooming Costs
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Read our price guides and tips so you know what to expect before you book.
          </p>
          {linkable.has(priceIndexSlug) && (
            <p className="text-text-muted text-base max-w-2xl mx-auto mt-4">
              Our Washington and Oregon price index covers published starting prices
              from 174 groomer websites, collected October 1, 2026. These are starting
              prices, not final quotes for your pet.{" "}
              <Link
                href={"/blog/" + priceIndexSlug}
                data-link-src="home-price-index"
                className="font-semibold text-brand-accent-ink underline underline-offset-2 hover:text-brand-primary"
              >
                See the source data, method, and sample counts
              </Link>.
            </p>
          )}
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
