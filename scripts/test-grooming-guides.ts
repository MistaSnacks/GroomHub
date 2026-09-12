import assert from "node:assert/strict";
import { test } from "node:test";
import { getBlogPosts, getRelatedPosts } from "../src/lib/blog";
import { GUIDE_TOPICS, getGuideListing } from "../src/lib/grooming-guides";

const posts = getBlogPosts();

test("every published guide belongs to exactly one populated topic", () => {
  const slugs = GUIDE_TOPICS.flatMap((topic) => topic.slugs);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.deepEqual([...slugs].sort(), posts.map((post) => post.slug).sort());
  for (const topic of GUIDE_TOPICS) {
    assert.ok(topic.slugs.length > 0);
  }
});

test("topic navigation replaces legacy categories and All restores every guide", () => {
  for (const topic of GUIDE_TOPICS) {
    const result = getGuideListing(posts, { topic: topic.id, category: "cat-care" });
    assert.equal(result.category, undefined);
    assert.deepEqual(result.posts.map((post) => post.slug).sort(), [...topic.slugs].sort());
  }
  assert.deepEqual(getGuideListing(posts, {}).posts, posts);
  assert.deepEqual(getGuideListing(posts, { category: "cat-care" }).posts.map((post) => post.slug), ["cat-grooming-what-to-expect"]);
  for (const filters of [
    { topic: "unknown" },
    { category: "unknown" },
    { topic: ["cost-pricing", "breed-guides"], category: ["guides", "cat-care"] },
  ]) {
    assert.deepEqual(getGuideListing(posts, filters).posts, posts);
  }
});

test("every article has unique suggestions, excludes itself, and prioritizes its topic", () => {
  for (const post of posts) {
    const related = getRelatedPosts(post.slug);
    assert.equal(related.length, 3);
    assert.equal(new Set(related.map((item) => item.slug)).size, 3);
    assert.ok(related.every((item) => item.slug !== post.slug));
    const peers = GUIDE_TOPICS.find((topic) => topic.slugs.includes(post.slug))!
      .slugs.filter((slug) => slug !== post.slug);
    assert.ok(related.slice(0, Math.min(3, peers.length)).every((item) => peers.includes(item.slug)));
  }
});

const baseUrl = process.env.GUIDES_TEST_URL;
test("rendered routes show exactly the selected guides and visible suggestions", { skip: !baseUrl }, async () => {
  const routes = [
    { query: "", filters: {} },
    ...GUIDE_TOPICS.map((topic) => ({ query: `?topic=${topic.id}`, filters: { topic: topic.id } })),
    { query: "?category=cat-care", filters: { category: "cat-care" } },
    { query: "?topic=cost-pricing&category=cat-care", filters: { topic: "cost-pricing", category: "cat-care" } },
    { query: "?topic=unknown&category=unknown", filters: { topic: "unknown", category: "unknown" } },
  ];
  const fetchHtml = async (route: string) => {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, route);
    return response.text();
  };
  const cardSlugs = (html: string) => [...html.matchAll(/<a\b[^>]*href="\/blog\/([^"?#]+)"/g)].map((match) => match[1]);
  for (const { query, filters } of routes) {
    const html = await fetchHtml(`/blog${query}`);
    const section = html.match(/<section id="guides"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, query);
    assert.doesNotMatch(section, /opacity:\s*0(?:[;"}])/, `Hidden results: ${query}`);
    assert.deepEqual(cardSlugs(section), getGuideListing(posts, filters).posts.map((post) => post.slug));
    const nav = section.match(/<nav aria-label="Guide topics"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav);
    assert.ok(nav.includes('href="/blog#guides"'));
    assert.doesNotMatch(nav, /category=/);
    for (const topic of GUIDE_TOPICS) {
      assert.ok(nav.includes(`href="/blog?topic=${topic.id}#guides"`));
    }
  }
  for (const post of posts) {
    const html = await fetchHtml(`/blog/${post.slug}`);
    const heading = html.indexOf("Related Articles</h2>");
    assert.ok(heading >= 0, post.slug);
    const related = html.slice(heading, html.indexOf("</section>", heading));
    assert.doesNotMatch(related, /opacity:\s*0(?:[;"}])/, `Hidden suggestions: ${post.slug}`);
    assert.deepEqual(cardSlugs(related), getRelatedPosts(post.slug).map((item) => item.slug));
  }
});
