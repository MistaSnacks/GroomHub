import { cache } from "react";
import { cms, site } from "./index";
import { stegaClean } from "./sdk";

export interface CmsAsset { _ref?: string; id?: string; url?: string; originalUrl?: string; width?: number; height?: number; alt?: string }
export interface PortableSpan { _type: string; _key?: string; text: string; marks?: string[] }
export interface PortableBlock { _type: string; _key?: string; style?: string; listItem?: string; level?: number; children?: PortableSpan[]; markDefs?: {_key: string; _type: string; href?: string}[] }
export interface CmsSection { kind?: string; heading?: string; body?: PortableBlock[]; image?: CmsAsset; imageAlt?: string; caption?: string; table?: {headings?: string[]; rows?: {cells?: string[]}[]}; cta?: {label?: string; href?: string} }
export interface CmsSeo { title?: string; description?: string; image?: CmsAsset; imageAlt?: string; noIndex?: boolean }

export function imageUrl(asset?: CmsAsset | null): string | null {
  const value = stegaClean(asset?.url || asset?.originalUrl || "");
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" && url.hostname === "media.snackboxcms.com" ? value : null; } catch { return null; }
}

// Cache within a render; the SDK supplies persistent cache tags and a short TTL.
// Pagination must continue beyond the API's default first 100 documents.
const publicSite = cms("groomlocal", {baseUrl: "https://snackboxcms.com"});
export const readCollection = cache(async <T,>(type: string, includes: string[] = [], publishedOnly = false): Promise<T[]> => {
  const client = publishedOnly ? publicSite : site;
  const records: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const direct = includes.filter(field=>!field.includes(".*."));
    let batch = await client.query<T>(type).include(...direct).limit(100).offset(offset).find();
    const expanded = new Set<string>();
    for (const field of includes.filter(field=>field.includes(".*."))) {
      const [list, suffix] = field.split(".*.");
      for (const doc of batch) {
        const items = (doc as Record<string, unknown>)[list];
        if (Array.isArray(items)) items.forEach((_,index)=>expanded.add(`${list}.${index}.${suffix}`));
      }
    }
    if (expanded.size) batch = await client.query<T>(type).include(...direct,...expanded).limit(100).offset(offset).find();
    records.push(...batch);
    if (batch.length < 100) return records;
  }
});

export function plainText(body: PortableBlock[] = []): string {
  return body.map(block => block.children?.map(span => span.text).join("") || "").join("\n");
}

export function sectionText(sections: CmsSection[] = []): string {
  return sections.map(section => [section.heading, plainText(section.body), section.table?.headings?.join(" "), section.table?.rows?.map(row => row.cells?.join(" ")).join(" ")].filter(Boolean).join("\n")).join("\n");
}

export function safeContentHref(value?: string): string | undefined {
  if (!value) return undefined;
  value = stegaClean(value);
  if (/^\/(?!\/)/.test(value) || value.startsWith("#")) return value;
  try { const url = new URL(value); return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? value : undefined; } catch { return undefined; }
}
