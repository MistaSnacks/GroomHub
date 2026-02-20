"use client";

import { motion } from "framer-motion";
import { PawPrint, Dog } from "@phosphor-icons/react";
import { SearchHero } from "@/components/search-hero";
import { MauiMascot } from "@/components/maui-mascot";

interface HomeHeroProps {
    totalCount: number;
}

export function HomeHero({ totalCount }: HomeHeroProps) {
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
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex-1 text-center lg:text-left z-10 lg:pl-4 order-2 lg:order-1"
                    >
                        <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-4 py-1.5 text-sm mb-6 text-brand-accent shadow-sm font-semibold tracking-wide">
                            <Dog weight="duotone" className="w-5 h-5" /> PNW&apos;s #1 Pet Grooming Directory
                        </div>

                        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-brand-primary">
                            Find the <span className="text-brand-secondary">pawfect</span> groomer<br className="hidden md:block" /> in your city
                        </h1>

                        <p className="text-text-muted text-lg md:text-xl max-w-xl mb-10 mx-auto lg:mx-0 font-medium">
                            {totalCount}+ verified groomers across Washington & Oregon. Search, compare, and book with confidence.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                            className="w-full max-w-2xl mx-auto lg:mx-0"
                        >
                            <SearchHero />
                        </motion.div>
                    </motion.div>

                    {/* Mascot Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
                        className="shrink-0 flex flex-col items-center justify-end z-0 relative group order-1 lg:order-2"
                    >
                        <MauiMascot size={320} interactive className="drop-shadow-2xl z-10" />

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.4 }}
                            className="bg-white/95 backdrop-blur-sm rounded-full px-6 py-2.5 shadow-lg border border-brand-secondary/30 flex items-center gap-2 whitespace-nowrap mt-2 z-10 group-hover:-translate-y-1 transition-transform duration-300"
                        >
                            <PawPrint weight="fill" className="w-5 h-5 text-brand-secondary" />
                            <span className="font-heading font-semibold text-lg text-brand-primary">Hi, I&apos;m Maui!</span>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
