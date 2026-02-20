import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Buildings,
    MapPin,
    ChartLineUp,
    Image as ImageIcon,
    Trophy,
    Star,
    ArrowRight,
    ShieldCheck,
    EnvelopeSimpleOpen
} from "@phosphor-icons/react/dist/ssr";

export default async function DashboardPage() {
    const supabase = await createClient();

    // The middleware already protects this route, but just in case:
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login");
    }

    // Fetch all business listings owned by the user
    const { data: listings, error } = await supabase
        .from("business_listings")
        .select("*")
        .eq("owner_id", user.id);

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
            <div className="mb-4">
                <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
                    Overview
                </h1>
                <p className="text-text-muted">
                    Manage your grooming business listings
                </p>
            </div>

            {/* Main Dashboard Content */}
            {!listings || listings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm max-w-2xl mx-auto w-full">
                    <div className="w-16 h-16 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Buildings className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-brand-primary mb-2">
                        No businesses claimed yet
                    </h2>
                    <p className="text-text-muted mb-6">
                        You haven't claimed any grooming businesses yet. Search the directory to find your business and claim your profile.
                    </p>
                    <Link
                        href="/dog-grooming"
                        className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:scale-[1.02] shadow-sm"
                    >
                        Search Directory
                        <ArrowRight weight="bold" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left col: Listings */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        <h2 className="font-heading text-xl font-bold text-brand-primary">
                            Your Listings
                        </h2>

                        {listings.map((listing) => (
                            <div key={listing.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col sm:flex-row transition-all hover:shadow-md">
                                <div className="w-full sm:w-48 h-48 sm:h-auto bg-brand-secondary/20 flex-shrink-0 relative">
                                    {listing.images?.[0] ? (
                                        <Image src={listing.images[0]} alt={listing.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 192px" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Buildings className="w-12 h-12 text-brand-primary/40" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-heading text-xl font-bold text-brand-primary hover:text-brand-accent transition-colors block">
                                                {listing.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <div className="flex items-center text-sm text-text-muted">
                                                    <MapPin className="w-4 h-4 mr-1 text-brand-primary/60" />
                                                    {listing.city}, {listing.state}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Tier Badge */}
                                        <div className={`capitalize px-3 py-1 rounded-full text-xs font-bold border shrink-0
                            ${listing.subscription_tier === 'premium' ? 'bg-brand-secondary/20 text-brand-primary border-brand-secondary' :
                                                listing.subscription_tier === 'featured' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                            {listing.subscription_tier} Plan
                                        </div>
                                    </div>

                                    {/* Mock Management Actions */}
                                    <div className="mt-auto pt-6 flex flex-wrap gap-3">
                                        <Link
                                            href={`/groomer/${listing.slug}`}
                                            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            View Listing
                                        </Link>
                                        <Link href={`/dashboard/profile?id=${listing.id}`} className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors shadow-sm">
                                            Edit Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right col: Quick Actions & Upsells */}
                    <div className="flex flex-col gap-6">

                        {/* Upgrade Ad (if any listing is NOT premium) */}
                        {listings.some(l => l.subscription_tier !== 'premium') && (
                            <div className="bg-brand-primary rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-secondary/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                                <Trophy weight="duotone" className="w-8 h-8 text-brand-secondary mb-4" />
                                <h3 className="font-heading text-lg font-bold mb-2">Upgrade to Premium</h3>
                                <p className="text-sm text-white/80 mb-6">
                                    Get the "Best in Show" badge, lead generation inbox, and #1 search placement.
                                </p>
                                <Link
                                    href={`/claim/${listings[0].slug}/plans`}
                                    className="block text-center w-full rounded-full bg-brand-secondary px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-white"
                                >
                                    View Plans
                                </Link>
                            </div>
                        )}

                        {/* Dashboard Stats */}
                        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-border bg-gray-50/50">
                                <h3 className="font-heading text-sm font-bold text-text-muted uppercase tracking-wider">
                                    Performance
                                </h3>
                            </div>
                            <div className="p-5">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-text">Profile Views</span>
                                        <span className="text-lg font-bold text-brand-primary">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-text">Website Clicks</span>
                                        <span className="text-lg font-bold text-brand-primary">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-text flex items-center gap-1.5"><EnvelopeSimpleOpen weight="bold" /> New Leads</span>
                                        <span className="text-lg font-bold text-brand-primary">0</span>
                                    </div>
                                </div>
                                <p className="text-xs text-text-muted mt-6 text-center">
                                    Analytics tracking coming soon.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
