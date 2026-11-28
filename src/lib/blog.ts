import { cache } from "react";
import { unstable_cache } from "next/cache";
import { readCollection, imageUrl, plainText, sectionText, type CmsAsset, type CmsSection, type CmsSeo, type PortableBlock } from "./cms/content";
import { cacheTags, stegaClean } from "./cms/sdk";
import { homeGuideSlugs } from "./internal-links";

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

// A page rebuilds as often as its shortest cache, so directory pages must not read
// the CMS SDK's 15 s fetches directly: each rebuild also reads Supabase. These
// daily entries keep those pages daily. Publishing expires them at once through
// /api/revalidate, and a failed refresh keeps serving the last good entry.
const BLOG_POST_CACHE = {
  revalidate: 86400,
  tags: [cacheTags.project("groomlocal"), cacheTags.type("groomlocal", "blogPost")],
};

const getCachedLinkableSlugs = unstable_cache(
  async () => (await getBlogPosts(undefined, true)).filter(post => !post.seo?.noIndex).map(post => post.slug),
  ["linkable-blog-slugs-daily"],
  BLOG_POST_CACHE,
);

// With no last good set, a page renders without its guide links. Reading this
// entry gives that page a 5-minute life, so the gap does not last all day.
const retryInFiveMinutes = unstable_cache(async () => true, ["blog-links-retry"], { revalidate: 300 });

export async function getLinkableBlogSlugs(): Promise<ReadonlySet<string>> {
  try {
    return new Set(await getCachedLinkableSlugs());
  } catch (error) {
    console.error("getLinkableBlogSlugs error:", error);
    await retryInFiveMinutes();
    return new Set();
  }
}

/** Minimal blog fields for /sitemap.xml, cached daily so bots cannot trigger 15s rebuilds. */
export const getSitemapBlogPosts = unstable_cache(
  async (): Promise<Array<{ slug: string; date: string; dateModified: string | null }>> =>
    (await getBlogPosts(undefined, true))
      .filter((post) => !post.seo?.noIndex)
      .map(({ slug, date, dateModified }) => ({ slug, date, dateModified })),
  ["sitemap-blog-posts-daily"],
  BLOG_POST_CACHE,
);

/** Card fields for the home page guides, without the article bodies. */
export const getHomeGuides = unstable_cache(
  async (): Promise<BlogPostMeta[]> => {
    const posts = await getBlogPosts(undefined, true);
    const bySlug = new Map(posts.map(post => [post.slug, post]));
    return homeGuideSlugs(new Set(posts.filter(post => !post.seo?.noIndex).map(post => post.slug))).flatMap(slug => {
      const post = bySlug.get(slug);
      if (!post) return [];
      const { title, excerpt, category, author, date, dateModified, readTime, image, tags, topic, imageAlt } = post;
      return [{ slug, title, excerpt, category, author, date, dateModified, readTime, image, tags, topic, imageAlt }];
    });
  },
  ["home-guides-daily"],
  BLOG_POST_CACHE,
);

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

export interface BlogFaq { question: string; answer: string }

// Pull question/answer pairs from the "Frequently Asked Questions" section of a post:
// each h3 after that h2 is a question, and the paragraphs until the next heading are its answer.
export function extractFaqs(post: Pick<BlogPostFull, "body" | "sections">): BlogFaq[] {
  const blocks: PortableBlock[] = [...post.body, ...post.sections.flatMap(section => section.body || [])];
  const text = (block: PortableBlock) => stegaClean(block.children?.map(span => span.text).join("") || "").trim();
  const faqs: BlogFaq[] = [];
  let inFaq = false;
  let current: BlogFaq | null = null;
  for (const block of blocks) {
    if (block._type !== "block") { if (inFaq && current) { faqs.push(current); current = null; } continue; }
    const style = block.style || "normal";
    if (style === "h2") {
      if (current) faqs.push(current);
      current = null;
      inFaq = /frequently asked questions|^faqs?$/i.test(text(block));
      continue;
    }
    if (!inFaq) continue;
    if (style === "h3" || style === "h4") {
      if (current) faqs.push(current);
      current = { question: text(block), answer: "" };
    } else if (current && !block.listItem) {
      const answer = text(block);
      if (answer) current.answer = current.answer ? `${current.answer} ${answer}` : answer;
    }
  }
  if (current) faqs.push(current);
  return faqs.filter(faq => faq.question && faq.answer);
}
