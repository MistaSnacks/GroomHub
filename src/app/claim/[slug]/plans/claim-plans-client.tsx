"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, X, WarningCircle, Star } from "@phosphor-icons/react/dist/ssr";
import { WaveDivider } from "@/components/wave-divider";
import { pricingTiers } from "@/lib/pricing";
import { processClaim } from "@/app/claim/actions";

export function ClaimPlansClient({ slug }: { slug: string }) {
    const [isAnnual, setIsAnnual] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>("standard");
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <div className="flex-1 flex flex-col bg-bg">
            {/* Error banner */}
            {error && (
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-6">
                    <div className="flex items-center gap-3 p-4 text-sm text-[#C2185B] bg-[#FCE4EC] rounded-xl border border-[#F48FB1]">
                        <WarningCircle weight="bold" className="w-5 h-5 shrink-0" />
                        {error === "already-claimed"
                            ? "This listing has already been claimed by another user."
                            : "We couldn't complete this claim. Please try again."}
                    </div>
                </div>
            )}

            {/* Founding member banner */}
            <section className="pt-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-accent/15 flex items-center justify-center shrink-0">
                        <Star weight="fill" className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                        <p className="font-semibold text-brand-primary text-sm mb-1">Founding Member Beta</p>
                        <p className="text-sm text-text-muted">
                            As an early member, you get <strong className="text-brand-primary">all Premium features free for 90 days</strong>.
                            In return, we ask that you add a GroomLocal link on your website and share a quick testimonial.
                            Pick any plan below to get started.
                        </p>
                    </div>
                </div>
            </section>

            {/* Header section */}
            <section className="py-12">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
                        Step 2 of 2
                    </p>
                    <h1 className="font-heading text-3xl md:text-5xl font-bold text-brand-primary mb-4">
                        Select your plan
                    </h1>
                    <p className="text-lg text-text-muted">
                        Choose how you want to manage your listing. All plans include full features during our founding member beta.
                    </p>

                    <div className="mt-8 inline-flex items-center gap-1 bg-white border border-border rounded-full p-1">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${!isAnnual
                                ? "bg-brand-primary text-white shadow-sm"
                                : "text-text-muted hover:text-brand-primary"
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual
                                ? "bg-brand-primary text-white shadow-sm"
                                : "text-text-muted hover:text-brand-primary"
                                }`}
                        >
                            Annual
                            <span className="text-[10px] bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded-full font-bold">
                                Save 2mo
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Plans */}
            <section className="pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pricingTiers.map((tier) => {
                        const displayPrice = isAnnual ? tier.annualPrice : tier.price;
                        const isFeatured = tier.isPopular;
                        const isPremium = tier.slug === "premium";
                        const isSelected = selectedPlan === tier.slug;

                        const cardBg = isFeatured
                            ? "bg-brand-accent text-white border-brand-accent"
                            : isPremium
                                ? "bg-brand-secondary text-brand-primary border-brand-secondary"
                                : "bg-white text-brand-primary border-border";

                        return (
                            <div
                                key={tier.slug}
                                className={`relative rounded-2xl border-2 p-6 flex flex-col h-full ${cardBg} ${isSelected ? 'ring-4 ring-brand-primary/20 scale-[1.02]' : ''}`}
                            >
                                <button
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => setSelectedPlan(tier.slug)}
                                    className={`text-left flex flex-col flex-1 cursor-pointer transition-transform ${isSelected ? '' : 'hover:scale-[1.01]'}`}
                                >
                                    <div className="absolute top-6 right-6 w-5 h-5 rounded-full border-2 border-brand-primary/20 flex items-center justify-center bg-white/50">
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />}
                                    </div>

                                    {isFeatured && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="rounded-full bg-white px-4 py-1 text-xs font-bold text-brand-accent shadow-sm whitespace-nowrap">
                                                Most Pawpular
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-5 pr-8">
                                        <h3 className="font-heading text-xl font-bold">{tier.name}</h3>
                                        <p className={`text-sm mt-1 ${isFeatured || isPremium ? "opacity-80" : "text-text-muted"}`}>
                                            {tier.description}
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-heading text-4xl font-bold">
                                                ${displayPrice}
                                            </span>
                                            {tier.price > 0 && (
                                                <span className={`text-sm ${isFeatured || isPremium ? "opacity-60" : "text-text-muted"}`}>/mo</span>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="flex-1 space-y-2.5 mb-6">
                                        {tier.features.slice(0, 5).map((feature) => (
                                            <li key={feature.text} className="flex items-start gap-2">
                                                {feature.included ? (
                                                    <Check weight="bold" className={`h-4 w-4 mt-0.5 shrink-0 ${isFeatured ? "text-white" : isPremium ? "text-brand-primary" : "text-brand-accent"}`} />
                                                ) : (
                                                    <X weight="bold" className={`h-4 w-4 mt-0.5 shrink-0 ${isFeatured || isPremium ? "opacity-30" : "text-border"}`} />
                                                )}
                                                <span className={`text-sm ${feature.included ? "" : isFeatured || isPremium ? "opacity-40" : "text-text-muted/50"}`}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </button>
                                <p className="text-xs font-medium pt-2 opacity-60">
                                    <Link href="/pricing" target="_blank" className="hover:underline">View full feature list ↗</Link>
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Checkout Footer Mock */}
                <div className="mt-12 max-w-2xl mx-auto bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
                            Selected Plan
                        </p>
                        <p className="font-heading text-2xl font-bold text-brand-primary capitalize">
                            {selectedPlan} {isAnnual ? '(Annual)' : '(Monthly)'}
                        </p>
                    </div>

                    <form action={processClaim}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="plan" value={selectedPlan} />
                        <input type="hidden" name="isAnnual" value={String(isAnnual)} />
                        <SubmitButton label={selectedPlan === 'free' ? 'Complete Claim' : 'Proceed to Checkout'} />
                    </form>
                </div>
            </section>

            <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
        </div>
    );
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-brand-primary px-8 py-4 text-base font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md cursor-pointer disabled:opacity-70 disabled:hover:scale-100"
        >
            {pending ? "Claiming..." : label}
            {!pending && <ArrowRight weight="bold" className="w-5 h-5" />}
        </button>
    );
}
