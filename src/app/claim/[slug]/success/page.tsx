import Link from "next/link";
import { CheckCircle, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WaveDivider } from "@/components/wave-divider";
import { getListingBySlug } from "@/lib/supabase/queries";

export default async function ClaimSuccessPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const listing = await getListingBySlug(slug);

    return (
        <div className="flex flex-col flex-1 bg-bg">
            {/* Header section */}
            <section className="py-20 flex-1 flex flex-col items-center justify-center">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">

                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-accent/20 rounded-full animate-ping" />
                            <div className="w-24 h-24 bg-brand-accent rounded-full flex items-center justify-center relative z-10 shadow-xl shadow-brand-accent/20">
                                <CheckCircle weight="fill" className="w-12 h-12 text-white" />
                            </div>
                        </div>
                    </div>

                    <h1 className="font-heading text-3xl md:text-5xl font-bold text-brand-primary mb-4">
                        Listing Claimed!
                    </h1>
                    <p className="text-lg text-text-muted mb-8">
                        Welcome to the PNW Grooming Directory. You now have full control over <strong className="text-brand-primary">{listing?.name || 'your business'}</strong>.
                    </p>

                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm mb-8 text-left max-w-sm mx-auto">
                        <h3 className="font-semibold text-brand-primary mb-3">Next Steps:</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-sm text-text-muted">
                                <div className="w-6 h-6 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold text-xs shrink-0 mt-0.5">1</div>
                                Complete your profile details
                            </li>
                            <li className="flex gap-2 text-sm text-text-muted">
                                <div className="w-6 h-6 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold text-xs shrink-0 mt-0.5">2</div>
                                Add business hours and website
                            </li>
                            <li className="flex gap-2 text-sm text-text-muted">
                                <div className="w-6 h-6 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold text-xs shrink-0 mt-0.5">3</div>
                                Upload your best photos
                            </li>
                        </ul>
                    </div>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-4 text-base font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-md"
                    >
                        Go to My Dashboard
                        <ArrowRight weight="bold" className="w-5 h-5" />
                    </Link>

                    <div className="mt-6">
                        <Link
                            href={`/groomer/${slug}`}
                            className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors"
                        >
                            View public profile
                        </Link>
                    </div>
                </div>
            </section>

            <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
        </div>
    );
}
