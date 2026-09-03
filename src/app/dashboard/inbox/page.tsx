import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { EnvelopeSimpleOpen } from "@phosphor-icons/react/dist/ssr";

function getAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

interface LeadRow {
    id: string;
    listing_id: string;
    sender_name: string;
    sender_email: string;
    sender_phone: string | null;
    message: string;
    created_at: string | null;
}

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

    const admin = getAdmin();
    let listingsQuery = admin
        .from("business_listings")
        .select("id, slug, name")
        .eq("owner_id", user.id);
    if (params.id) {
        listingsQuery = listingsQuery.eq("id", params.id);
    }

    const { data: listings } = await listingsQuery;
    const owned = listings ?? [];

    if (owned.length === 0) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-2xl border border-border p-12 text-center">
                    <h2 className="text-xl font-bold text-brand-primary mb-2">No listing found</h2>
                    <p className="text-text-muted">You do not have access to manage this lead inbox.</p>
                </div>
            </div>
        );
    }

    const listingIds = owned.map((l) => l.id);
    const listingNames = new Map(owned.map((l) => [l.id, l.name]));

    const { data: leadRows } = await admin
        .from("leads")
        .select("id, listing_id, sender_name, sender_email, sender_phone, message, created_at")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false });

    const leads = (leadRows ?? []) as LeadRow[];

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

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-border bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <EnvelopeSimpleOpen className="w-5 h-5 text-brand-secondary" weight="duotone" />
                        <h2 className="font-heading text-lg font-bold text-brand-primary">
                            Incoming Requests
                        </h2>
                    </div>
                    <div className="text-sm font-medium text-text-muted bg-gray-100 px-3 py-1 rounded-full border border-border">
                        {leads.length} {leads.length === 1 ? "Lead" : "Leads"}
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    {leads.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex flex-col items-center justify-center mb-4">
                                <EnvelopeSimpleOpen className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="font-heading font-bold text-brand-primary mb-1">No messages yet</p>
                            <p className="max-w-sm text-sm">
                                When pet parents contact you through your profile, their messages will appear here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {leads.map((lead) => (
                                <li key={lead.id} className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                        <div>
                                            <p className="font-semibold text-brand-primary">{lead.sender_name}</p>
                                            <p className="text-sm text-text-muted">
                                                <a href={`mailto:${lead.sender_email}`} className="hover:text-brand-primary">
                                                    {lead.sender_email}
                                                </a>
                                                {lead.sender_phone && (
                                                    <>
                                                        {" · "}
                                                        <a href={`tel:${lead.sender_phone}`} className="hover:text-brand-primary">
                                                            {lead.sender_phone}
                                                        </a>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-xs text-text-muted text-left sm:text-right">
                                            {listingNames.get(lead.listing_id) && (
                                                <p className="font-medium text-brand-primary/70 mb-0.5">
                                                    {listingNames.get(lead.listing_id)}
                                                </p>
                                            )}
                                            {lead.created_at && (
                                                <time dateTime={lead.created_at}>
                                                    {new Date(lead.created_at).toLocaleString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </time>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text whitespace-pre-wrap">{lead.message}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
