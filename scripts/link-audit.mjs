#!/usr/bin/env node
// Crawls the site and reports the internal link graph: inbound links per page,
// in-content (<main>) links versus header/footer links, anchor text, and click depth from "/".
// Usage: node scripts/link-audit.mjs [--base https://groomlocal.com] [--label baseline] [--concurrency 6]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, i, all) => {
  if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1]?.startsWith("--") ? "true" : all[i + 1] ?? "true"]);
  return pairs;
}, []));
const BASE = (args.base || "https://groomlocal.com").replace(/\/$/, "");
const LABEL = args.label || new Date().toISOString().slice(0, 10);
const CONCURRENCY = Number(args.concurrency || 6);
const MAX_PAGES = Number(args.max || 2500);
const PROD_HOSTS = new Set(["groomlocal.com", "www.groomlocal.com", new URL(BASE).host]);
const SKIP = /^\/(api|_next|admin|dashboard|login|signup|reset-password|claim|badge|auth)(\/|$)|\.(xml|svg|png|jpe?g|webp|ico|txt|json)$/i;

// Tagged links that existed before the registry (blog index and related cards) are not counted as template links.
const NAVIGATION_BLOCKS = new Set(["blog-card"]);

export const COST_GUIDES = [
  "/blog/dog-grooming-cost-seattle-portland-2026",
  "/blog/mobile-dog-grooming-cost-guide",
];

function normalize(href, from) {
  if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return null;
  let url;
  try { url = new URL(href.replace(/&amp;/g, "&"), BASE + from); } catch { return null; }
  if (!PROD_HOSTS.has(url.host)) return null;
  const p = decodeURIComponent(url.pathname).replace(/\/+$/, "") || "/";
  return SKIP.test(p) ? null : p;
}

const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

function zoneAt(html) {
  const marks = [];
  for (const tag of ["header", "main", "footer"]) {
    const open = html.search(new RegExp(`<${tag}[\\s>]`));
    const close = html.lastIndexOf(`</${tag}>`);
    if (open >= 0 && close > open) marks.push({ tag, open, close });
  }
  return (i) => marks.find((m) => i >= m.open && i <= m.close)?.tag || "other";
}

function parse(html, from) {
  const zone = zoneAt(html);
  const bodyStart = from.startsWith("/blog/") ? html.indexOf("prose-custom") : -1;
  const bodyEnd = bodyStart >= 0 ? html.indexOf("</article>", bodyStart) : -1;
  const links = [];
  for (const m of html.matchAll(/<a\b([^>]*?)href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const to = normalize(m[2], from);
    if (!to || to === from) continue;
    const attrs = m[1] + m[3];
    const alt = m[4].match(/alt="([^"]*)"/i)?.[1];
    const src = attrs.match(/data-link-src="([^"]*)"/i)?.[1] || null;
    const editorial = bodyStart >= 0 && m.index > bodyStart && m.index < bodyEnd && !src;
    links.push({ to, anchor: text(m[4]) || alt || "", zone: zone(m.index), src, editorial });
  }
  const robots = html.match(/<meta name="robots" content="([^"]*)"/i)?.[1] || "";
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1] || "";
  const cityPage = from.startsWith("/groomer/") ? links.find((l) => /^\/dog-grooming\/[^/]+\/[^/]+$/.test(l.to))?.to || null : null;
  return { links, noindex: /noindex/i.test(robots), canonical, cityPage };
}

async function fetchText(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "GroomLocal-link-audit/1.0" }, redirect: "follow" });
      return { status: res.status, finalPath: new URL(res.url).pathname.replace(/\/+$/, "") || "/", body: res.ok ? await res.text() : "" };
    } catch (error) {
      if (attempt === 2) return { status: 0, finalPath: "", body: "", error: String(error) };
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

async function sitemapPaths() {
  const index = (await fetchText(`${BASE}/sitemap.xml`)).body;
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const isIndex = /<sitemapindex/.test(index);
  const bodies = isIndex
    ? await Promise.all(children.map((u) => fetchText(BASE + new URL(u).pathname).then((r) => r.body)))
    : [index];
  return [...new Set(bodies.flatMap((b) => [...b.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalize(m[1], "/")).filter(Boolean)))];
}

async function crawl() {
  const inSitemap = new Set(await sitemapPaths());
  const pages = new Map();
  const queue = ["/", ...inSitemap];
  const seen = new Set(queue);
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length && pages.size < MAX_PAGES) {
      const p = queue[cursor++];
      const res = await fetchText(BASE + p);
      const parsed = res.body ? parse(res.body, p) : { links: [], noindex: false, canonical: "" };
      pages.set(p, { status: res.status, redirectedTo: res.finalPath !== p ? res.finalPath : null, ...parsed });
      for (const link of parsed.links) if (!seen.has(link.to)) { seen.add(link.to); queue.push(link.to); }
      if (pages.size % 200 === 0) process.stderr.write(`  crawled ${pages.size}/${queue.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { pages, inSitemap };
}

function analyze({ pages, inSitemap }) {
  const indexable = (p) => { const page = pages.get(p); return page && page.status === 200 && !page.redirectedTo && !page.noindex; };
  const inbound = new Map();
  const entry = (p) => inbound.get(p) || inbound.set(p, { sources: new Set(), mainIdx: new Set(), editorialIdx: new Set(), templateIdx: new Set(), anchors: new Map(), anchorPages: new Map() }).get(p);
  const broken = [];
  for (const [from, page] of pages) {
    if (page.status !== 200) continue;
    for (const link of page.links) {
      const target = pages.get(link.to);
      if (target && target.status !== 200) broken.push({ from, to: link.to, status: target.status });
      const e = entry(link.to);
      e.sources.add(from);
      if (!indexable(from) || link.zone !== "main") continue;
      e.mainIdx.add(from);
      if (link.editorial) e.editorialIdx.add(from);
      if (link.src && !NAVIGATION_BLOCKS.has(link.src)) e.templateIdx.add(from);
      const a = link.anchor.toLowerCase().slice(0, 80);
      if (!a) continue;
      e.anchors.set(a, (e.anchors.get(a) || 0) + 1);
      (e.anchorPages.get(a) || e.anchorPages.set(a, new Set()).get(a)).add(from);
    }
  }
  const depth = new Map([["/", 0]]);
  const frontier = ["/"];
  while (frontier.length) {
    const p = frontier.shift();
    for (const link of pages.get(p)?.links || []) {
      if (!depth.has(link.to)) { depth.set(link.to, depth.get(p) + 1); frontier.push(link.to); }
    }
  }
  const section = (p) => (p === "/" ? "home" : p.split("/")[1]) + (/^\/(dog-grooming|cat-grooming|mobile-grooming)\/[^/]+\/[^/]+$/.test(p) ? ":city" : "");
  const rows = [...pages].filter(([, page]) => page.status === 200 && !page.redirectedTo).map(([p, page]) => {
    const e = inbound.get(p);
    const anchors = [...(e?.anchors || [])].sort((a, b) => b[1] - a[1]);
    const main = page.links.filter((l) => l.zone === "main");
    return {
      path: p, section: section(p), inSitemap: inSitemap.has(p), noindex: page.noindex,
      depth: depth.get(p) ?? null, inbound: e?.sources.size || 0, inboundMain: e?.mainIdx.size || 0,
      editorial: e?.editorialIdx.size || 0, template: e?.templateIdx.size || 0,
      distinctAnchors: anchors.length, anchorLinks: anchors.reduce((n, [, c]) => n + c, 0), topAnchors: anchors.slice(0, 10), allAnchors: anchors,
      anchorPageCounts: Object.fromEntries([...(e?.anchorPages || [])].map(([a, set]) => [a, set.size])),
      outMain: new Set(main.map((l) => l.to)).size,
      outMainBlog: new Set(main.filter((l) => l.to.startsWith("/blog/")).map((l) => l.to)).size,
      cityPage: page.cityPage || null,
      ...(p === "/" ? { homeBlogTargets: [...new Set(main.filter((l) => l.to.startsWith("/blog/")).map((l) => l.to))] } : {}),
    };
  });
  return { rows, broken, errors: [...pages].filter(([, page]) => page.status !== 200).map(([p, page]) => ({ path: p, status: page.status })) };
}

export function gates({ rows, broken }) {
  const by = (p) => rows.find((r) => r.path === p);
  const idx = rows.filter((r) => !r.noindex);
  const home = by("/");
  const [costGuide, mobileGuide] = COST_GUIDES.map(by);
  const topShare = (r) => (r?.anchorLinks ? (r.topAnchors[0]?.[1] || 0) / r.anchorLinks : 0);
  const profiles = idx.filter((r) => r.section === "groomer");
  const indexableCity = new Set(idx.filter((r) => r.section === "dog-grooming:city").map((r) => r.path));
  const reachable = profiles.filter((r) => r.cityPage && indexableCity.has(r.cityPage));
  const weakProfiles = reachable.filter((r) => r.inboundMain < 2).length;
  const questionShare = (r) => (r?.anchorLinks ? r.allAnchors.filter(([a]) => /how much|cost|fee/.test(a)).reduce((n, [, c]) => n + c, 0) / r.anchorLinks : 0);
  const profileOut = median(profiles.map((r) => r.outMain));
  const homeBlog = home?.outMainBlog || 0;
  const posts = idx.filter((r) => r.section === "blog" && r.path !== "/blog");
  return [
    ["no internal links to non-200 pages", broken.length === 0, `${broken.length} broken`],
    ["home links both cost guides + 2 more posts", homeBlog >= 4 && COST_GUIDES.every((g) => home?.homeBlogTargets?.includes(g)), `home -> ${homeBlog} posts`],
    ["cost guide has 300+ indexable template sources", (costGuide?.template || 0) >= 300, `${costGuide?.template || 0}`],
    ["mobile guide has 70+ indexable template sources", (mobileGuide?.template || 0) >= 70, `${mobileGuide?.template || 0}`],
    ["cost guide top anchor <= 40% of indexable anchor links", topShare(costGuide) <= 0.4, `${(topShare(costGuide) * 100).toFixed(0)}% "${costGuide?.topAnchors[0]?.[0] || ""}"`],
    ["mobile guide top anchor <= 40% of indexable anchor links", topShare(mobileGuide) <= 0.4, `${(topShare(mobileGuide) * 100).toFixed(0)}% "${mobileGuide?.topAnchors[0]?.[0] || ""}"`],
    ['cost guide anchors with "how much", "cost" or "fee" >= 25%', questionShare(costGuide) >= 0.25, `${(questionShare(costGuide) * 100).toFixed(0)}%`],
    ['"dog grooming prices" anchor on <= 20 indexable pages', (costGuide?.anchorPageCounts["dog grooming prices"] || 0) <= 20, `${costGuide?.anchorPageCounts["dog grooming prices"] || 0}`],
    ["profiles in indexable cities with < 2 indexable in-content inbound: < 20", weakProfiles < 20, `${weakProfiles} of ${reachable.length} (all profiles: ${profiles.filter((r) => r.inboundMain < 2).length} of ${profiles.length})`],
    ["profile in-content outbound median <= 15", profileOut <= 15, `${profileOut}`],
    ["profile click depth <= 3", profiles.every((r) => r.depth !== null && r.depth <= 3), `max ${Math.max(...profiles.map((r) => r.depth ?? 99))}`],
    ["blog post click depth <= 2", posts.every((r) => r.depth !== null && r.depth <= 2), `max ${Math.max(...posts.map((r) => r.depth ?? 99))}`],
  ];
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };

function summarize({ rows, errors, broken }) {
  const lines = [`Link audit ${LABEL} for ${BASE}: ${rows.length} pages (200), ${errors.length} non-200`];
  const bySection = Object.groupBy(rows, (r) => r.section);
  lines.push("", "section (in-main counts from indexable sources)", "section          pages  med-depth  max-depth  med-inbound-main  zero-main-inbound  med-out-blog");
  for (const [s, rs] of Object.entries(bySection).sort((a, b) => b[1].length - a[1].length)) {
    const depths = rs.map((r) => r.depth ?? 99);
    lines.push(`${s.padEnd(16)} ${String(rs.length).padStart(5)}  ${String(median(depths)).padStart(9)}  ${String(Math.max(...depths)).padStart(9)}  ${String(median(rs.map((r) => r.inboundMain))).padStart(16)}  ${String(rs.filter((r) => r.inboundMain === 0).length).padStart(17)}  ${String(median(rs.map((r) => r.outMainBlog))).padStart(12)}`);
  }
  const home = rows.find((r) => r.path === "/");
  lines.push("", `home -> blog posts in <main>: ${home?.outMainBlog ?? 0}`);
  lines.push("", "blog post (counts from indexable sources)              depth  in-main  editorial  template  anchors");
  for (const r of (bySection.blog || []).filter((r) => r.path !== "/blog").sort((a, b) => a.inboundMain - b.inboundMain)) {
    lines.push(`${r.path.replace("/blog/", "").slice(0, 54).padEnd(54)} ${String(r.depth ?? "-").padStart(5)}  ${String(r.inboundMain).padStart(7)}  ${String(r.editorial).padStart(9)}  ${String(r.template).padStart(8)}  ${String(r.distinctAnchors).padStart(7)}`);
  }
  for (const guide of COST_GUIDES) {
    const r = rows.find((x) => x.path === guide);
    lines.push("", `${guide}: depth ${r?.depth}, indexable in-main ${r?.inboundMain}, editorial ${r?.editorial}, template ${r?.template}, anchors (links):`);
    for (const [a, n] of r?.topAnchors || []) lines.push(`  ${String(n).padStart(5)}  ${a}`);
  }
  const deep = rows.filter((r) => r.inSitemap && (r.depth === null || r.depth > 3));
  lines.push("", `sitemap pages deeper than 3 clicks or unreachable from home: ${deep.length}`);
  if (errors.length) lines.push(`non-200: ${errors.slice(0, 15).map((e) => `${e.path} (${e.status})`).join(", ")}`);
  if (broken.length) lines.push(`broken links: ${broken.slice(0, 15).map((b) => `${b.from} -> ${b.to} (${b.status})`).join(", ")}`);
  lines.push("", "gates:");
  for (const [name, pass, detail] of gates({ rows, broken })) lines.push(`  ${pass ? "PASS" : "FAIL"}  ${name}  (${detail})`);
  return lines.join("\n");
}

const crawled = await crawl();
const report = analyze(crawled);
const outDir = path.join(process.cwd(), "output", "link-audit");
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, `${LABEL}.json`), JSON.stringify({ base: BASE, label: LABEL, at: new Date().toISOString(), ...report }, null, 1));
const summary = summarize(report);
await writeFile(path.join(outDir, `${LABEL}.txt`), summary + "\n");
console.log(summary);
if (args.gates === "true" && gates(report).some(([, pass]) => !pass)) process.exit(1);
