import postsData from "@/data/blog/posts.json";

export interface BlogAuthor {
  name: string;
  avatar: string | null;
  bio: string;
}

export interface BlogContentBlock {
  type: "paragraph" | "heading" | "callout";
  text: string;
}

export interface BlogPostFull {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: BlogAuthor;
  date: string;
  readTime: string;
  image: string | null;
  tags: string[];
  content: BlogContentBlock[];
}

const posts: BlogPostFull[] = postsData as BlogPostFull[];

const CATEGORIES: Record<string, string> = {
  "grooming-tips": "Grooming Tips",
  "guides": "Guides",
  "seasonal": "Seasonal",
  "cat-care": "Cat Care",
};

export function getBlogPosts(category?: string): BlogPostFull[] {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  if (category) {
    return sorted.filter((p) => p.category === category);
  }
  return sorted;
}

export function getBlogPostBySlug(slug: string): BlogPostFull | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getBlogCategories(): { slug: string; label: string }[] {
  const usedCategories = new Set(posts.map((p) => p.category));
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
