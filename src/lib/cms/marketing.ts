import { cache } from "react";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { readCollection, imageUrl, safeContentHref } from "./content";
import { stegaClean } from "./sdk";
import type { MarketingCopy, MarketingLink } from "../marketing-copy";

const includes=["heroImage","seo.image","sections.*.image","faqs"];
const link=(value?:MarketingLink) => value ? {...value,href:safeContentHref(value.href)} : undefined;
function normalize(value:MarketingCopy):MarketingCopy {
  return {...value,slug:stegaClean(value.slug||""),heroSrc:imageUrl(value.heroImage)||undefined,
    primaryCta:link(value.primaryCta),secondaryCta:link(value.secondaryCta),
    sections:value.sections?.map(section=>({...section,imageSrc:imageUrl(section.image)||undefined,cta:link(section.cta),secondaryCta:link(section.secondaryCta)}))};
}
export const getHomeCopy=cache(async(publishedOnly=false)=>{
  const docs=await readCollection<MarketingCopy>("homePage",includes,publishedOnly);
  return docs[0] ? normalize(docs[0]) : undefined;
});
export const getMarketingPages=cache(async(publishedOnly=false)=>(await readCollection<MarketingCopy>("page",includes,publishedOnly))
  .map(normalize).filter(page=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug||"")));
export const getMarketingPage=cache(async(slug:string)=>(await getMarketingPages()).find(page=>page.slug===slug));

// Application routes retain their purpose even when no route page exists at their root.
export const RESERVED_MARKETING_SLUGS = new Set(["about","for-groomers","admin","api","auth","blog","cat-grooming","claim","contact","dashboard","dog-grooming","get-listed","get-quotes","groomer","login","mobile-grooming","pricing","privacy","resources","search","services","signup","specialties","terms","forgot-password","reset-password"]);

export async function marketingMetadata(copy:MarketingCopy|undefined, fallback:Metadata):Promise<Metadata> {
  if(!copy) return fallback;
  const seo=copy.seo;
  const title=seo?.title ? stegaClean(seo.title) : undefined;
  const description=seo?.description !== undefined ? stegaClean(seo.description) : undefined;
  const image=imageUrl(seo?.image);
  const social={...(title?{title}:{}),...(description!==undefined?{description}:{}),...(image?{images:[{url:image,alt:stegaClean(seo?.imageAlt||copy.title||"")}]}:{})};
  return {...fallback,...(title?{title}:{}),...(description!==undefined?{description}:{}),
    openGraph:{...fallback.openGraph,...social},twitter:{...fallback.twitter,...social},
    ...(seo?.noIndex || (await draftMode()).isEnabled ? {robots:{index:false,follow:true}}:{})};
}
