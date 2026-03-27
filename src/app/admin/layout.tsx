import Link from "next/link";
import Image from "next/image";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
                        <a href="/admin/dashboard" className="bg-blue-50 text-blue-700 focus:bg-blue-50 font-medium rounded-lg px-3 py-2 flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Platform Analytics
                        </a>
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
