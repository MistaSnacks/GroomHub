import { cache } from "react";
import { readCollection, imageUrl, plainText, sectionText, type CmsAsset, type CmsSection, type CmsSeo, type PortableBlock } from "./cms/content";
import { stegaClean } from "./cms/sdk";

export interface BlogAuthor { name: string; avatar: string | null; bio: string }
export interface BlogPostMeta {
  slug: string; title: string; excerpt: string; category: string; author: BlogAuthor;
  date: string; dateModified: string | null; readTime: string; image: string | null;
  tags: string[]; topic?: string; imageAlt?: string;
}
export interface BlogPostFull extends BlogPostMeta {
  id: string; content: string; body: PortableBlock[]; sections: CmsSection[]; seo?: CmsSeo;
  relatedSlugs?: string[];
}
interface CmsPost {
  _id: string; slug: string; title: string; excerpt?: string; category?: string;
  authorBio?: string;
  author?: {_id?: string; name?: string; bio?: string; avatar?: CmsAsset};
  topic?: {slug?: string}; date?: string; dateModified?: string; readTime?: string;
  heroImage?: CmsAsset; heroAlt?: string; tags?: string[]; body?: PortableBlock[];
  sections?: CmsSection[]; seo?: CmsSeo; relatedGuides?: {slug?: string}[];
}
export interface GuideTopic { id: string; title: string; subtitle: string; slugs: string[] }
const POST_INCLUDES = ["heroImage", "author", "topic", "seo.image", "relatedGuides", "sections.*.image"];
const clean = (value: string | undefined) => stegaClean(value || "");

const CATEGORIES: Record<string, string> = {
  "grooming-tips": "Grooming Tips",
  guides: "Guides",
  seasonal: "Seasonal",
  "cat-care": "Cat Care",
};


export const getBlogPosts = cache(async (category?: string, publishedOnly = false): Promise<BlogPostFull[]> => {
  const [records, authors] = await Promise.all([
    readCollection<CmsPost>("blogPost", POST_INCLUDES, publishedOnly),
    readCollection<{_id:string; avatar?:CmsAsset}>("author", ["avatar"], publishedOnly),
  ]);
  const portraits = new Map(authors.map(author=>[author._id,imageUrl(author.avatar)]));
  const posts = records.map(p => ({
    id: p._id, slug: clean(p.slug), title: p.title || "Untitled guide", excerpt: p.excerpt || "",
    category: clean(p.category), topic: clean(p.topic?.slug),
    author: {name: p.author?.name || "GroomLocal", bio: p.authorBio || p.author?.bio || "", avatar: portraits.get(p.author?._id || "") || null},
    date: clean(p.date), dateModified: clean(p.dateModified) || null,
    readTime: p.readTime || `${Math.max(1, Math.ceil((plainText(p.body)+sectionText(p.sections)).split(/\s+/).length / 220))} min read`,
    image: imageUrl(p.heroImage), imageAlt: p.heroAlt || p.title,
    tags: p.tags || [], body: p.body || [], sections: p.sections || [], seo: p.seo,
    content: plainText(p.body)+"\n"+sectionText(p.sections),
    relatedSlugs: p.relatedGuides?.map(r=>clean(r.slug)).filter(Boolean),
  })).filter(p=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug));
  posts.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime() || a.slug.localeCompare(b.slug));
  return category ? posts.filter(p=>p.category===category) : posts;
});

export const getGuideTopics = cache(async (): Promise<GuideTopic[]> => {
  const [topics, posts] = await Promise.all([readCollection<{slug:string;title:string;description:string}>("guideTopic"),getBlogPosts()]);
  return topics.map(t=>({id:clean(t.slug), title:t.title, subtitle:t.description, slugs:posts.filter(p=>p.topic===clean(t.slug)).map(p=>p.slug)}));
});

export async function getBlogPostBySlug(slug: string) { return (await getBlogPosts()).find(p=>p.slug===slug); }
export async function getBlogCategories() {
  const used = new Set((await getBlogPosts()).map(p=>p.category));
  return Object.entries(CATEGORIES).filter(([slug])=>used.has(slug)).map(([slug,label])=>({slug,label}));
}

export function getCategoryLabel(slug: string): string {
  return CATEGORIES[slug] ?? slug;
}

export function formatBlogDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  },
): string {
  return new Date(date).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}


export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<BlogPostFull[]> {
  const posts = await getBlogPosts();
  const current = posts.find(p=>p.slug===currentSlug);
  if (!current) return posts.slice(0,limit);
  const rank = (p: BlogPostFull) => (current.relatedSlugs?.includes(p.slug) ? 1000 : 0)
    + (p.topic && p.topic === current.topic ? 100 : 0)
    + p.tags.filter(t=>current.tags.includes(t)).length * 5
    + Number(p.category === current.category);
  return posts.filter(p=>p.slug!==currentSlug).sort((a,b)=>rank(b)-rank(a)).slice(0,limit);
}
