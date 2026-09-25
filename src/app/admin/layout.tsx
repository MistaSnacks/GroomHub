import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    if (!(await requireAdmin())) {
        redirect("/login?redirect=/admin/dashboard");
    }
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navbar - Reused from SiteHeader but minimal */}
            <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md shadow-sm py-0 border-b border-gray-200">
                <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-[2.5px] border-brand-secondary flex-shrink-0 transition-transform group-hover:scale-105">
                                <Image src="/maui-logo.svg" alt="GroomLocal mascot Maui" width={40} height={40} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-heading text-xl font-bold text-brand-primary leading-tight" style={{ letterSpacing: "-0.02em" }}>
                                    GroomLocal
                                </span>
                                <span className="text-[9px] leading-none tracking-[2px] uppercase font-medium" style={{ color: "#956A46" }}>
                                    Admin Dashboard
                                </span>
                            </div>
                        </Link>

                        {/* Right side placeholder - could add admin profile/logout here */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors"
                            >
                                Exit Admin
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Quick minimal admin sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                    <nav className="flex-1 p-4 space-y-1">
                        <Link href="/admin/dashboard" className="bg-blue-50 text-blue-700 focus:bg-blue-50 font-medium rounded-lg px-3 py-2 flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Platform Analytics
                        </Link>
                        <Link href="/admin/dashboard/listings" className="text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            Claimed Listings
                        </Link>
                        <Link href="/admin/dashboard/claims" className="text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Claim Requests
                        </Link>
                        <Link href="/admin/dashboard/leads" className="text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Leads and Quotes
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
