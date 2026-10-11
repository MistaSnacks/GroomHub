import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { loadCore } from "@/lib/admin-console/data";
import { logEvent, errorFields } from "@/lib/log";
import { AdminNav, type NavBadge } from "./_components/nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s - GroomLocal admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireAdmin())) {
    redirect("/login?redirect=/admin/dashboard");
  }

  // Badge counts are a convenience; a failed load must not lock the console.
  const badges: Record<string, NavBadge> = {};
  try {
    const core = await loadCore();
    const pendingClaims = core.claims.filter((c) => c.status === "pending").length;
    const inbox =
      core.quotes.filter((q) => q.status === "new").length +
      core.leads.filter((l) => l.status === "new").length +
      core.submissions.filter((s) => s.status === "new").length;
    badges["/admin/dashboard/claims"] = { count: pendingClaims, tone: "warn" };
    badges["/admin/dashboard/leads"] = { count: inbox, tone: "info" };
  } catch (err) {
    logEvent("error", "admin", "badge_load_failed", errorFields(err));
  }

  return (
    <div data-admin-shell className="flex min-h-screen flex-col bg-adm-plane text-slate-800 md:flex-row">
      <AdminNav badges={badges} loadedAt={new Date().toISOString()} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
