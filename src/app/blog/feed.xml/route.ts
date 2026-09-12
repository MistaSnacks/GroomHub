import fs from "fs";
import path from "path";
import { getBlogPosts } from "@/lib/blog";

const BASE_URL = "https://groomlocal.com";

const ENCLOSURE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (value: string) => value.replace(/\]\]>/g, "]]]]><![CDATA[>");

async function enclosureTag(image: string | null): Promise<string> {
  if (!image) return "";
  const url = new URL(image, BASE_URL);
  const type = ENCLOSURE_TYPES[path.extname(url.pathname).toLowerCase()];
  if (!type) return "";
  let length: number;
  if (url.origin === BASE_URL) {
    const publicPath = path.join(process.cwd(), "public", url.pathname);
    if (!fs.existsSync(publicPath)) return "";
    length = fs.statSync(publicPath).size;
  } else {
    if (url.protocol !== "https:" || url.hostname !== "media.snackboxcms.com") return "";
    try {
      const response = await fetch(url, {method:"HEAD", redirect:"error", signal:AbortSignal.timeout(5000), next:{revalidate:86400}});
      length = Number(response.headers.get("content-length"));
      if (!response.ok || !Number.isSafeInteger(length) || length <= 0) return "";
    } catch { return ""; }
  }
  return `<enclosure url="${xml(url.href)}" type="${type}" length="${length}" />`;
}

export async function GET() {
  const posts = await getBlogPosts(undefined, true);

  const items = (await Promise.all(posts.filter(post=>!post.seo?.noIndex)
    .map(async (post) => {
      const pubDate = new Date(post.date).toUTCString();
      const imageTag = await enclosureTag(post.image);

      return `    <item>
      <title><![CDATA[${cdata(post.title)}]]></title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${cdata(post.excerpt)}]]></description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${cdata(post.author.name)}]]></dc:creator>
      <category>${xml(post.category)}</category>
      ${imageTag}
    </item>`;
    })))
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>GroomLocal Grooming Guides</title>
    <link>${BASE_URL}/blog</link>
    <description>Expert grooming tips, seasonal care guides, and pet care advice from PNW groomers.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
