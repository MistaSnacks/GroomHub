import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import {
    Buildings,
    ChartLineUp,
    PencilSimple,
    EnvelopeSimpleOpen,
    User,
    GearSix
} from "@phosphor-icons/react/dist/ssr";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Fetch user's first listing slug for the edit link
    const { data: listings } = await supabase
        .from("business_listings")
        .select("slug")
        .eq("owner_id", user.id)
        .limit(1);
    const listingSlug = listings?.[0]?.slug;

    const navLinks = [
        { name: "Overview", href: "/dashboard", icon: ChartLineUp, exact: true },
        ...(listingSlug ? [{ name: "Edit Profile", href: `/dashboard/listing/${listingSlug}`, icon: PencilSimple }] : []),
        { name: "Lead Inbox", href: "/dashboard/inbox", icon: EnvelopeSimpleOpen },
        { name: "Account", href: "/dashboard/account", icon: User },
        { name: "Settings", href: "/dashboard/settings", icon: GearSix },
    ];

    return (
        <div className="flex-1 flex flex-col md:flex-row bg-bg min-h-[calc(100vh-80px)]">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-border flex-shrink-0">
                <div className="p-6">
                    <h2 className="font-heading text-lg font-bold text-brand-primary mb-6 flex items-center gap-2">
                        <Buildings weight="duotone" className="w-6 h-6 text-brand-secondary" />
                        Dashboard
                    </h2>
                    <nav className="space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-primary/5 text-text transition-colors text-sm font-medium group"
                            >
                                <link.icon className="w-5 h-5 text-text-muted group-hover:text-brand-accent transition-colors" />
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto">
                {children}
            </main>
        </div>
    );
}
