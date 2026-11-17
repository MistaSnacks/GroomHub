import Image from "next/image";
import type { ReactNode } from "react";
import { PawPrint, MapPin, Scissors, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { SearchHero } from "@/components/search-hero";
import { WaveDivider } from "@/components/wave-divider";

import type { MarketingCopy } from "@/lib/marketing-copy";
import { fillMarketingCounts } from "@/lib/marketing-copy";
import { MarketingHeading } from "./marketing-heading";
import { editableField } from "@/lib/cms/sdk";

const MAUI_WAVING = "/maui-assets/00-maui-main.png?v=maui-20260904-alpha1";
const MAUI_BLOW_DRY = "/maui-assets/07-maui-blow-dry.png?v=maui-20260904-alpha1";

const CREAM = "#FDF8F0";
const WHITE = "#FFFFFF";
const TEAL = "#4ECDC4";
const CORAL = "#FF7E67";

interface HomeHeroProps {
    copy?: MarketingCopy;
    totalCount: number;
    cityCount: number;
}

/**
 * One hero, two looks. Phones and tablets get a cream page with Maui on a coral circle and a coral ribbon of facts.
 * From 1024px it becomes a teal band with Maui on both sides. The heading and the search box exist once.
 */
export function HomeHero({ totalCount, cityCount, copy }: HomeHeroProps) {
    const groomerCount = totalCount.toLocaleString();
    const mauiSrc = copy?.heroSrc || MAUI_WAVING;
    const mauiAlt = copy?.heroAlt || "Maui, the GroomLocal puppy, waving hello";
    const facts: { icon: ReactNode; text: string }[] = [
        { icon: <Scissors weight="fill" className="h-5 w-5" />, text: `${groomerCount} groomers` },
        { icon: <MapPin weight="fill" className="h-5 w-5" />, text: `${cityCount} cities` },
        { icon: <PawPrint weight="fill" className="h-5 w-5" />, text: "Washington and Oregon" },
        { icon: <MagnifyingGlass weight="bold" className="h-5 w-5" />, text: "Free to search" },
    ];

    return (
        <>
            <section className="hero-home relative isolate -mt-[72px] overflow-x-clip bg-bg pb-10 pt-[104px] lg:bg-brand-secondary lg:pb-20 lg:pt-[148px]">
                <div aria-hidden className="hero-backdrop absolute inset-0 -z-10 overflow-hidden lg:hidden">
                    <div className="ledger absolute inset-0" />
                    <div className="absolute -right-40 top-10 h-[620px] w-[620px] rounded-full bg-brand-accent/25 blur-3xl" />
                    <div className="absolute -left-48 top-[380px] h-[460px] w-[460px] rounded-full bg-brand-secondary/20 blur-3xl" />
                </div>

                <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="maui-pop relative mx-auto mb-6 w-[min(48%,180px)] lg:hidden">
                        <div aria-hidden className="paw-blob absolute left-1/2 top-1/2 aspect-square w-[104%] -translate-x-1/2 -translate-y-[47%] rounded-full bg-brand-accent" />
                        <Image src={mauiSrc} alt={mauiAlt} width={360} height={360} sizes="180px" loading="eager" fetchPriority="high" className="relative aspect-square w-full select-none object-contain" />
                    </div>

                    <h1 {...(copy?._id ? editableField(copy._id, "title") : {})} className="hero-title font-heading font-semibold text-brand-primary">
                        <MarketingHeading text={copy?.title ?? "Find dog groomers in Washington and Oregon"} emphasis={copy?.emphasis ?? "dog groomers"} className="hero-stroke" />
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-slate-600 md:text-xl lg:text-brand-primary/85">
                        {fillMarketingCounts(copy?.intro ?? "{groomerCount} listings across Washington and Oregon. Compare services and published prices, then contact or book directly with the groomer.", { groomerCount })}
                    </p>

                    <div className="mx-auto mt-8 max-w-2xl">
                        <SearchHero />
                        {copy?.primaryCta?.href && <a href={copy.primaryCta.href} className="inline-block mt-5 text-brand-primary underline">{copy.primaryCta.label}</a>}
                    </div>
                </div>

                <div className="maui-pop maui-wiggle absolute bottom-4 left-[max(1.5%,calc(50%-700px))] hidden w-[clamp(140px,15vw,230px)] lg:block">
                    <Image src={MAUI_BLOW_DRY} alt="Maui getting a blow dry" width={460} height={460} sizes="230px" className="aspect-square w-full select-none object-contain" />
                </div>
                <div className="maui-pop maui-wiggle absolute bottom-4 right-[max(1.5%,calc(50%-700px))] hidden w-[clamp(140px,15vw,230px)] lg:block" style={{ animationDelay: "120ms" }}>
                    <Image src={mauiSrc} alt={mauiAlt} width={460} height={460} sizes="230px" className="aspect-square w-full select-none object-contain" />
                </div>
            </section>

            <div className="lg:hidden">
                <WaveDivider variant="double" fromColor={CREAM} toColor={CORAL} height={44} />
                <ul className="paw-ribbon flex flex-wrap items-center justify-center gap-x-8 gap-y-2 bg-brand-accent px-4 py-3 font-heading text-base font-semibold text-brand-primary sm:text-lg md:gap-x-12">
                    {facts.map((fact) => (
                        <li key={fact.text} className="flex items-center gap-2">
                            {fact.icon}
                            {fact.text}
                        </li>
                    ))}
                </ul>
                <WaveDivider variant="gentle" fromColor={CORAL} toColor={WHITE} height={44} />
            </div>
            <WaveDivider variant="gentle" fromColor={TEAL} toColor={WHITE} className="hidden lg:block" />
        </>
    );
}
