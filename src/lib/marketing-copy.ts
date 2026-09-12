import type { CmsAsset, CmsSection, CmsSeo, PortableBlock } from "./cms/content";
import { stegaClean } from "./cms/sdk";

export interface MarketingLink {label?:string; href?:string}
export interface MarketingSection extends CmsSection {
  key?:string; eyebrow?:string; emphasis?:string; intro?:string;
  secondaryCta?:MarketingLink; imageSrc?:string;
}
export interface MarketingCopy {
  _id?:string; title?:string; emphasis?:string; eyebrow?:string; intro?:string;
  slug?:string; overview?:string; greeting?:string; heroImage?:CmsAsset; heroAlt?:string; heroSrc?:string;
  primaryCta?:MarketingLink; secondaryCta?:MarketingLink; badges?:string[];
  sections?:MarketingSection[]; body?:PortableBlock[]; seo?:CmsSeo;
  faqs?:{_id?:string;question?:string;answer?:PortableBlock[]}[];
}
export const marketingSection = (copy:MarketingCopy | undefined,key:string):MarketingSection =>
  copy?.sections?.find(section=>stegaClean(section.key||"")===key) || {};

/** Counts remain live database values; only the surrounding sentence is CMS copy. */
export function fillMarketingCounts(value:string, counts:Record<string,string|number>) {
  return value.replace(/\{(groomerCount|cityCount)\}/g,(match,key)=>counts[key]===undefined?match:String(counts[key]));
}
