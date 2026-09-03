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

function enclosureTag(image: string | null): string {
  if (!image) return "";

  const ext = path.extname(image).toLowerCase();
  const type = ENCLOSURE_TYPES[ext];
  if (!type) return "";

  const publicPath = path.join(process.cwd(), "public", image.replace(/^\//, ""));
  if (!fs.existsSync(publicPath)) return "";

  const length = fs.statSync(publicPath).size;
  return `<enclosure url="${BASE_URL}${image}" type="${type}" length="${length}" />`;
}

export async function GET() {
  const posts = getBlogPosts();

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.date).toUTCString();
      const imageTag = enclosureTag(post.image);

      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${post.author.name}]]></dc:creator>
      <category>${post.category}</category>
      ${imageTag}
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>GroomLocal Blog</title>
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
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
