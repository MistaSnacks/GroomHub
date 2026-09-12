import Link from "next/link";
import Image from "next/image";
import { PortableContent } from "./cms-content";
import { MarketingHeading } from "./marketing-heading";
import type { MarketingCopy, MarketingLink } from "@/lib/marketing-copy";

export function MarketingButtons({ links }: { links: (MarketingLink | undefined)[] }) {
  const buttons = links.filter(link => link?.label && link.href);
  if (!buttons.length) return null;
  return <div className="flex flex-wrap gap-4 mt-6">{buttons.map((link,index) => <Link key={index} href={link!.href!} className="inline-flex rounded-full bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-accent-ink">{link!.label}</Link>)}</div>;
}

/** Additional editorial content; the existing page layouts retain their keyed sections. */
export function MarketingBody({ copy, sections = false }: { copy?: MarketingCopy; sections?: boolean }) {
  if (!copy || (!copy.body?.length && !copy.faqs?.length && !(sections && copy.sections?.length))) return null;
  return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
    <PortableContent blocks={copy.body} />
    {sections && copy.sections?.map((section,index) => <section key={section.key || index} className="my-12">
      {section.eyebrow && <p className="text-sm font-semibold uppercase text-brand-accent-ink">{section.eyebrow}</p>}
      {section.heading && <h2 className="font-heading text-3xl font-bold text-brand-primary mb-4"><MarketingHeading text={section.heading} emphasis={section.emphasis} /></h2>}
      {section.intro && <p className="text-lg text-text-muted mb-6">{section.intro}</p>}
      <PortableContent blocks={section.body} />
      {section.imageSrc && <Image src={section.imageSrc} alt={section.imageAlt || ""} width={960} height={640} className="my-6 h-auto max-h-[480px] w-full object-contain" />}
      <MarketingButtons links={[section.cta,section.secondaryCta]} />
    </section>)}
    {!!copy.faqs?.length && <section className="mt-12"><h2 className="font-heading text-3xl font-bold text-brand-primary mb-6">Frequently asked questions</h2>{copy.faqs.map((faq,index) => <div key={faq._id || index} className="mb-6"><h3 className="font-heading text-xl font-bold text-brand-primary mb-2">{faq.question}</h3><PortableContent blocks={faq.answer} /></div>)}</section>}
  </div>;
}
