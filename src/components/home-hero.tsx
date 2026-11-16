import { PawPrint, Dog } from "@phosphor-icons/react/dist/ssr";
import { SearchHero } from "@/components/search-hero";
import { MauiMascot } from "@/components/maui-mascot";

import type { MarketingCopy } from "@/lib/marketing-copy";
import { fillMarketingCounts } from "@/lib/marketing-copy";
import { MarketingHeading } from "./marketing-heading";
import { editableField } from "@/lib/cms/sdk";

interface HomeHeroProps {
    copy?: MarketingCopy;
    totalCount: number;
}

export function HomeHero({ totalCount, copy }: HomeHeroProps) {
    return (
        <section className="bg-bg pt-[136px] md:pt-[168px] pb-20 md:pb-28 -mt-[72px] relative overflow-hidden border-none">
            {/* Decorative paw prints */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none text-brand-primary">
                <PawPrint weight="fill" className="w-[300px] h-[300px] absolute -top-16 -right-16 rotate-12" />
                <PawPrint weight="fill" className="w-[180px] h-[180px] absolute bottom-10 left-10 -rotate-12" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">

                    {/* Text + search */}
                    <div
                        className="flex-1 text-center lg:text-left z-10 lg:pl-4 order-2 lg:order-1"
                    >
                        <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-4 py-1.5 text-sm mb-6 text-brand-accent-ink shadow-sm font-semibold tracking-wide">
                            <Dog weight="duotone" className="w-5 h-5" /> {copy?.eyebrow ?? "Washington & Oregon Grooming Directory"}
                        </div>

                        <h1 {...(copy?._id ? editableField(copy._id,"title") : {})} className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-brand-primary">
                            <MarketingHeading text={copy?.title ?? "Find dog groomers in Washington and Oregon"} emphasis={copy?.emphasis ?? "dog groomers"} breakBefore=" in Washington" />
                        </h1>

                        <p className="text-text-muted text-lg md:text-xl max-w-xl mb-10 mx-auto lg:mx-0 font-medium">
                            {fillMarketingCounts(copy?.intro ?? "{groomerCount} listings across Washington and Oregon. Compare services and published prices, then contact or book directly with the groomer.",{groomerCount:totalCount.toLocaleString()})}
                        </p>

                        <div
                            className="w-full max-w-2xl mx-auto lg:mx-0"
                        >
                            <SearchHero />
                            {copy?.primaryCta?.href && <a href={copy.primaryCta.href} className="inline-block mt-5 text-brand-primary underline">{copy.primaryCta.label}</a>}
                        </div>
                    </div>

                    {/* Mascot Container */}
                    <div
                        className="shrink-0 flex flex-col items-center justify-end z-0 relative group order-1 lg:order-2"
                    >
                        <MauiMascot src={copy?.heroSrc} alt={copy?.heroAlt} size={320} interactive priority className="drop-shadow-2xl z-10" />

                        <div
                            className="bg-white/95 backdrop-blur-sm rounded-full px-6 py-2.5 shadow-lg border border-brand-secondary/30 flex items-center gap-2 whitespace-nowrap mt-2 z-10 group-hover:-translate-y-1 transition-transform duration-300"
                        >
                            <PawPrint weight="fill" className="w-5 h-5 text-brand-secondary" />
                            <span className="font-heading font-semibold text-lg text-brand-primary">{copy?.greeting ?? "Hi, I'm Maui!"}</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
