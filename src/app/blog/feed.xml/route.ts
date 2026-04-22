import { getBlogPosts } from "@/lib/blog";

const BASE_URL = "https://groomlocal.com";

export async function GET() {
  const posts = getBlogPosts();

  const items = posts
    .map((post) => {
      const pubDate = new Date(post.date).toUTCString();
      const imageTag = post.image
        ? `<enclosure url="${BASE_URL}${post.image}" type="image/png" length="0" />`
        : "";

      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>${post.author.name}</author>
      <category>${post.category}</category>
      ${imageTag}
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
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
