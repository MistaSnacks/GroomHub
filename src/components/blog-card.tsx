import Link from "next/link";
import { CalendarBlank, Clock, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import type { BlogPostFull } from "@/lib/blog";
import { getCategoryLabel } from "@/lib/blog";

interface BlogCardProps {
  post: BlogPostFull;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const categoryLabel = getCategoryLabel(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block card-lift bg-white rounded-2xl border border-border overflow-hidden ${featured ? "md:flex" : ""}`}
    >
      {/* Image */}
      <div className={`bg-gradient-to-br from-bg to-brand-secondary/5 flex items-center justify-center ${featured ? "md:w-2/5 aspect-[4/3] md:aspect-auto" : "aspect-[16/9]"}`}>
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-contain p-4"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <ImageSquare weight="duotone" className="w-12 h-12 text-text-muted/15" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-5 ${featured ? "md:flex-1 md:p-8 md:flex md:flex-col md:justify-center" : ""}`}>
        <span className="inline-block text-xs font-semibold text-brand-accent bg-brand-accent/10 rounded-full px-3 py-1 mb-3">
          {categoryLabel}
        </span>

        <h3 className={`font-heading font-bold text-brand-primary group-hover:text-brand-accent transition-colors mb-2 leading-tight ${featured ? "text-xl md:text-2xl" : "text-lg"}`}>
          {post.title}
        </h3>

        <p className={`text-text-muted leading-relaxed mb-4 ${featured ? "text-base" : "text-sm line-clamp-2"}`}>
          {post.excerpt}
        </p>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <CalendarBlank weight="bold" className="w-3.5 h-3.5" />
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock weight="bold" className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
          <span className="font-medium text-brand-primary">{post.author.name}</span>
        </div>
      </div>
    </Link>
  );
}
