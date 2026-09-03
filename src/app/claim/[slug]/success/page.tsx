import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WaveDivider } from "@/components/wave-divider";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { CopyBadge } from "@/components/copy-badge";

export default async function ClaimSuccessPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/claim/${slug}`);
    }

    // Use admin client for the ownership check to bypass RLS/caching issues.
    // The anon-key singleton could return stale data or hide owner_id.
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: listing } = await supabaseAdmin
        .from("business_listings")
        .select("*")
        .eq("slug", slug)
        .single();

    if (!listing) {
        redirect(`/dog-grooming`);
    }

    // If listing is NOT owned by this user, send to claim step 1 (not groomer
    // profile, which would show the "Claim" CTA and create a loop)
    if (listing.owner_id !== user.id) {
        redirect(`/claim/${slug}`);
    }

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
                        Welcome, Founding Member!
                    </h1>
                    <p className="text-lg text-text-muted mb-4">
                        You now have full control over <strong className="text-brand-primary">{listing.name}</strong>. Your listing now shows a Verified badge to pet parents.
                    </p>
                    <p className="text-sm text-text-muted mb-8 max-w-md mx-auto">
                        As a founding member, all Premium features are yours free for 90 days. We just ask for two small things: a link to GroomLocal on your website, and a one-line testimonial about your experience.
                    </p>

                    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm mb-8 text-left max-w-sm mx-auto">
                        <h3 className="font-semibold text-brand-primary mb-3">Next Steps:</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-2 text-sm text-text-muted">
                                <div className="w-6 h-6 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold text-xs shrink-0 mt-0.5">1</div>
                                Complete your profile details and hours
                            </li>
                            <li className="flex gap-2 text-sm text-text-muted">
                                <div className="w-6 h-6 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary font-bold text-xs shrink-0 mt-0.5">2</div>
                                Upload your best grooming photos
                            </li>
                            <li className="flex gap-2 text-sm text-text-muted">
                                <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-xs shrink-0 mt-0.5">3</div>
                                Add the GroomLocal badge to your website (below)
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

            {/* Growth & Marketing Section: High Value Local Link Building */}
            <section className="bg-white py-16 border-t border-border mt-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1">
                            <h2 className="font-heading text-2xl font-bold text-brand-primary mb-3">
                                Add your GroomLocal badge
                            </h2>
                            <p className="text-text-muted mb-2">
                                Paste this badge on your website (footer, about page, or sidebar) to show clients you are a verified local business. It also helps your search ranking by creating a trusted backlink.
                            </p>
                            <p className="text-sm text-brand-accent font-medium mb-6">
                                This is part of your founding member agreement to keep Premium features free.
                            </p>
                            <CopyBadge listingSlug={slug} />
                        </div>
                        <div className="w-full md:w-1/3 flex justify-center order-first md:order-last">
                            <div className="relative w-48 h-48 bg-bg rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                {/* Using a placeholder or existing Maui image here to make it friendly */}
                                <img src="/maui-assets/14-maui-sitting-pretty-alt.png" alt="Maui the Mascot" className="w-36 h-36 object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <WaveDivider variant="footer" fromColor="#FDF8F0" toColor="#4ECDC4" />
        </div>
    );
}
