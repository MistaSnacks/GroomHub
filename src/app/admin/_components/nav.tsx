"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { refreshConsoleData } from "./refresh-action";
import {
  Activity,
  ChartLine,
  Inbox,
  LayoutDashboard,
  MapPinned,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  UsersRound,
  ExternalLink,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react";

const GROUPS: { label: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Run the business",
    items: [
      { href: "/admin/dashboard", label: "Today", icon: LayoutDashboard },
      { href: "/admin/dashboard/outreach", label: "Outreach", icon: Send },
      { href: "/admin/dashboard/listings", label: "Owners", icon: UsersRound },
      { href: "/admin/dashboard/claims", label: "Claims", icon: ShieldCheck },
      { href: "/admin/dashboard/leads", label: "Inbox", icon: Inbox },
    ],
  },
  {
    label: "Know the market",
    items: [
      { href: "/admin/dashboard/traffic", label: "Traffic", icon: ChartLine },
      { href: "/admin/dashboard/clicks", label: "Recent clicks", icon: MousePointerClick },
      { href: "/admin/dashboard/cities", label: "Cities", icon: MapPinned },
      { href: "/admin/dashboard/directory", label: "Directory", icon: Store },
    ],
  },
  {
    label: "Keep it running",
    items: [{ href: "/admin/dashboard/health", label: "Health", icon: Activity }],
  },
];

export interface NavBadge {
  count: number;
  tone: "warn" | "info";
}

function isActive(pathname: string, href: string): boolean {
  return href === "/admin/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ badges, loadedAt }: { badges: Record<string, NavBadge>; loadedAt: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stamp, setStamp] = useState(loadedAt);

  function refresh() {
    startTransition(async () => {
      await refreshConsoleData();
      router.refresh();
      setStamp(new Date().toISOString());
    });
  }

  const time = new Date(stamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });

  return (
    <aside className="sticky top-0 z-40 flex shrink-0 flex-col bg-adm-rail text-slate-300 md:h-screen md:w-60">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:block md:px-5 md:py-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-secondary bg-white">
            <Image src="/maui-logo-circle.svg" alt="" width={36} height={36} className="h-full w-full object-cover" />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg font-semibold text-white">GroomLocal</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-secondary">Operator console</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-white md:mt-4"
          title="Reload every number on this page"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} aria-hidden />
          {pending ? "Refreshing" : `Data as of ${time}`}
        </button>
      </div>

      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0 md:overflow-y-auto md:pb-5">
        {GROUPS.map((group) => (
          <div key={group.label} className="flex gap-1 md:mb-5 md:block">
            <p className="hidden px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:block">{group.label}</p>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              const badge = badges[href];
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors md:mb-0.5 ${
                    active ? "bg-white/10 font-medium text-white" : "hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {active && <span className="absolute inset-y-1.5 left-0 hidden w-[3px] rounded-full bg-brand-secondary md:block" aria-hidden />}
                  <Icon className={`h-4 w-4 ${active ? "text-brand-secondary" : "text-slate-500 group-hover:text-slate-300"}`} aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                  {badge && badge.count > 0 && (
                    <span
                      className={`ml-auto rounded-full px-1.5 text-[10px] font-bold leading-[18px] tabular-nums ${
                        badge.tone === "warn" ? "bg-brand-accent text-slate-900" : "bg-white/15 text-white"
                      }`}
                    >
                      {badge.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-white/10 px-5 py-4 text-xs md:block">
        <a href="/" target="_blank" className="flex items-center gap-1.5 text-slate-400 hover:text-white">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open the live site
        </a>
        <Link href="/dashboard" className="mt-2 block text-slate-500 hover:text-white">
          Owner dashboard
        </Link>
      </div>
    </aside>
  );
}
