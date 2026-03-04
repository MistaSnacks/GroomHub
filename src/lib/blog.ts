import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogAuthor {
  name: string;
  avatar: string | null;
  bio: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: BlogAuthor;
  date: string;
  readTime: string;
  image: string | null;
  tags: string[];
}

export interface BlogPostFull extends BlogPostMeta {
  content: string; // raw MDX content (no frontmatter)
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

const CATEGORIES: Record<string, string> = {
  "grooming-tips": "Grooming Tips",
  guides: "Guides",
  seasonal: "Seasonal",
  "cat-care": "Cat Care",
};

function readAllPosts(): BlogPostFull[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug: data.slug ?? filename.replace(/\.mdx$/, ""),
      title: data.title ?? "",
      excerpt: data.excerpt ?? "",
      category: data.category ?? "",
      author: {
        name: data.author?.name ?? "",
        avatar: data.author?.avatar ?? null,
        bio: data.author?.bio ?? "",
      },
      date: data.date ?? "",
      readTime: data.readTime ?? "",
      image: data.image ?? null,
      tags: data.tags ?? [],
      content,
    };
  });
}

// Cache posts in module scope (re-reads on dev server restart)
let _cache: BlogPostFull[] | null = null;
function getPosts(): BlogPostFull[] {
  if (!_cache) {
    _cache = readAllPosts();
  }
  return _cache;
}

export function getBlogPosts(category?: string): BlogPostFull[] {
  const sorted = [...getPosts()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  if (category) {
    return sorted.filter((p) => p.category === category);
  }
  return sorted;
}

export function getBlogPostBySlug(slug: string): BlogPostFull | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function getBlogCategories(): { slug: string; label: string }[] {
  const usedCategories = new Set(getPosts().map((p) => p.category));
  return Object.entries(CATEGORIES)
    .filter(([slug]) => usedCategories.has(slug))
    .map(([slug, label]) => ({ slug, label }));
}

export function getCategoryLabel(slug: string): string {
  return CATEGORIES[slug] ?? slug;
}

export function getRelatedPosts(
  currentSlug: string,
  limit = 3
): BlogPostFull[] {
  const current = getBlogPostBySlug(currentSlug);
  if (!current) return getBlogPosts().slice(0, limit);

  return getBlogPosts()
    .filter((p) => p.slug !== currentSlug)
    .sort((a, b) => {
      const aMatch = a.category === current.category ? 1 : 0;
      const bMatch = b.category === current.category ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, limit);
}
