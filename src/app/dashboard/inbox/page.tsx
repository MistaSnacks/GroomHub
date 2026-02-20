import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EnvelopeSimpleOpen, Star } from "@phosphor-icons/react/dist/ssr";

export default async function InboxPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    let query = supabase.from("business_listings").select("*").eq("owner_id", user.id);
    if (params.id) {
        query = query.eq("id", params.id);
    }

    const { data: listings } = await query;
    const listing = listings?.[0];

    if (!listing) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-2xl border border-border p-12 text-center">
                    <h2 className="text-xl font-bold text-brand-primary mb-2">No listing found</h2>
                    <p className="text-text-muted">You do not have access to manage this lead inbox.</p>
                </div>
            </div>
        );
    }

    const isPremium = listing.subscription_tier === 'premium';

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-6">
            <div className="mb-2">
                <h1 className="font-heading text-3xl font-bold text-brand-primary mb-2">
                    Lead Inbox
                </h1>
                <p className="text-text-muted">
                    Messages from pet parents requesting your services.
                </p>
            </div>

            {!isPremium && (
                <div className="bg-brand-primary rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden group mb-4">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-brand-secondary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Star weight="fill" className="w-8 h-8 text-brand-secondary" />
                            <h2 className="font-heading text-2xl font-bold">Premium Feature</h2>
                        </div>
                        <p className="text-lg text-white/90 mb-6">
                            Upgrade to Premium to unlock direct Contact Forms on your public profile. Stop losing leads to competitors and capture client details immediately.
                        </p>
                        <a
                            href={`/claim/${listing.slug}/plans`}
                            className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-6 py-3 text-sm font-bold text-brand-primary transition-colors hover:bg-white shadow-sm"
                        >
                            View Upgrade Plans
                        </a>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <EnvelopeSimpleOpen className="w-5 h-5 text-brand-secondary" weight="duotone" />
                        <h2 className="font-heading text-lg font-bold text-brand-primary">
                            Incoming Requests
                        </h2>
                    </div>
                    {isPremium && (
                        <div className="text-sm font-medium text-text-muted bg-gray-100 px-3 py-1 rounded-full border border-border">
                            0 Leads
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    {!isPremium ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex flex-col items-center justify-center mb-4">
                                <EnvelopeSimpleOpen className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="max-w-sm">
                                Direct messaging is locked. Upgrade to Premium to enable the Contact Form on your profile.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex flex-col items-center justify-center mb-4">
                                <EnvelopeSimpleOpen className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="font-heading font-bold text-brand-primary mb-1">No messages yet</p>
                            <p className="max-w-sm text-sm">
                                When pet parents contact you through your profile, their messages will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
