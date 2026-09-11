import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import sharp from 'sharp';
const [root, slug] = process.argv.slice(2);
const file = path.join(root, 'src/content/blog', `${slug}.mdx`);
const {data, content} = matter(fs.readFileSync(file, 'utf8'));
function assert(ok, message) { if (!ok) throw Error(message); }
for (const field of ['slug','title','excerpt','category','date','readTime','image']) assert(typeof data[field] === 'string' && data[field], `Missing string ${field}`);
assert(data.slug === slug, 'Slug mismatch');
assert(data.author?.name && data.author?.bio && Array.isArray(data.tags), 'Author/tags missing');
assert(!/^\s*(import|export)\s/m.test(content) && !/<script[\s>]/i.test(content), 'Executable MDX is not allowed');
await serialize(content, {mdxOptions: {remarkPlugins: [remarkGfm]}});
const imagePath = data.image.split('?')[0];
assert(imagePath.startsWith('/maui-assets/') && !imagePath.includes('..'), 'Use a local Maui asset');
const imageFile = path.join(root, 'public', imagePath);
const metadata = await sharp(imageFile).metadata();
assert(metadata.hasAlpha && metadata.width >= 1024 && metadata.height >= 1024, 'Maui asset needs full-size alpha');
const {data: pixels, info} = await sharp(imageFile).ensureAlpha().raw().toBuffer({resolveWithObject: true});
const corners = [0, info.width-1, (info.height-1)*info.width, info.height*info.width-1];
assert(corners.every(i => pixels[i*4+3] === 0), 'Maui canvas corners are not transparent');
const all = fs.readdirSync(path.join(root,'src/content/blog')).filter(f=>f.endsWith('.mdx')).map(f=>matter(fs.readFileSync(path.join(root,'src/content/blog',f),'utf8')).data);
assert(all.filter(p=>p.slug===slug).length === 1, 'Duplicate article slug');
const topics = fs.readFileSync(path.join(root,'src/lib/grooming-guides.ts'),'utf8');
assert((topics.match(new RegExp(`"${slug}"`,'g'))||[]).length === 1, 'Topic mapping missing or duplicated');
const links = [...content.matchAll(/\]\((\/[^)\s]+)(?:\s+"[^"]*")?\)/g)].map(m=>m[1]);
for (const link of links) {
 const pathname = link.split(/[?#]/)[0];
 if (pathname.startsWith('/blog/')) assert(all.some(p=>'/blog/'+p.slug===pathname), `Missing guide ${pathname}`);
 else if (/^\/(dog-grooming|mobile-grooming)\/(wa|or)(\/[a-z-]+)?$/.test(pathname)) {
   const parts = pathname.split('/').filter(Boolean);
   const route = path.join(root, 'src/app', parts[0], '[state]', ...(parts.length === 3 ? ['[city]'] : []));
   assert(fs.existsSync(path.join(route, 'page.tsx')), `Missing location route ${pathname}`);
 } else assert(!pathname.includes('..') && ['page.tsx','page.ts','page.jsx','page.js'].some(n=>fs.existsSync(path.join(root,'src/app',pathname,n))), `Missing route ${pathname}`);
}
assert(content.match(/https:\/\//), 'Primary source links missing');
console.log(JSON.stringify({slug,title:data.title,image:data.image,words:content.split(/\s+/).length,mdx:'passed',image_alpha:'passed',internal_links:links.length,topic_mapping:'passed'}));
