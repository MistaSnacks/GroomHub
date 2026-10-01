"use client";

import { logClickAction } from "@/lib/analytics";

type ClickAction = "website_click" | "directions_click" | "phone_click";

interface TrackedLinkProps {
  href: string;
  listingId: string;
  action: ClickAction;
  className?: string;
  children: React.ReactNode;
}

/** Link that records a per-listing click in analytics_events (the groomer's lead actions). */
export function TrackedLink({ href, listingId, action, className, children }: TrackedLinkProps) {
  const external = action !== "phone_click";
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => logClickAction(listingId, action)}
      className={className}
    >
      {children}
    </a>
  );
}

export function TrackedWebsiteLink(props: Omit<TrackedLinkProps, "action">) {
  return <TrackedLink {...props} action="website_click" />;
}
