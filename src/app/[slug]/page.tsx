import { notFound } from "next/navigation";
import Image from "next/image";
import { getMarketingPage, marketingMetadata, RESERVED_MARKETING_SLUGS } from "@/lib/cms/marketing";
import { stegaClean, editableField } from "@/lib/cms/sdk";
import { SnackboxOverlay } from "@/lib/cms/Overlay";
import { MarketingBody, MarketingButtons } from "@/components/marketing-body";
import { MarketingHeading } from "@/components/marketing-heading";

type Props = { params: Promise<{slug:string}> };
async function readPage(slug:string) {
  if (RESERVED_MARKETING_SLUGS.has(slug)) notFound();
  const copy = await getMarketingPage(slug);
  if (!copy) notFound();
  return copy;
}

export async function generateMetadata({params}:Props) {
  const {slug} = await params;
  const copy = await readPage(slug);
  const title = stegaClean(copy.title || "");
  const description = stegaClean(copy.intro || "");
  return marketingMetadata(copy,{title,description,alternates:{canonical:`/${slug}`},openGraph:{title,description,type:"website",url:`/${slug}`,siteName:"GroomLocal"},twitter:{card:"summary_large_image",title,description}});
}

export default async function MarketingPage({params}:Props) {
  const copy = await readPage((await params).slug);
  return <>
    {copy._id && <SnackboxOverlay documents={[{docId:copy._id,title:stegaClean(copy.title || "Page")}]} />}
    <section className="bg-bg py-16 md:py-24"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      {copy.eyebrow && <p className="font-semibold uppercase tracking-widest text-brand-accent-ink mb-4">{copy.eyebrow}</p>}
      <h1 {...(copy._id ? editableField(copy._id,"title") : {})} className="font-heading text-4xl md:text-6xl font-bold text-brand-primary mb-6"><MarketingHeading text={copy.title || ""} emphasis={copy.emphasis} /></h1>
      {copy.intro && <p className="text-xl text-text-muted">{copy.intro}</p>}
      <MarketingButtons links={[copy.primaryCta,copy.secondaryCta]} />
      {copy.heroSrc && <Image src={copy.heroSrc} alt={copy.heroAlt || ""} width={960} height={640} priority className="mt-8 h-auto max-h-[480px] w-full object-contain" />}
    </div></section>
    <MarketingBody copy={copy} sections />
  </>;
}
