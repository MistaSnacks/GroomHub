"use client";

import { logClickAction } from "@/lib/analytics";

interface TrackedWebsiteLinkProps {
  href: string;
  listingId: string;
  className?: string;
  children: React.ReactNode;
}

export function TrackedWebsiteLink({ href, listingId, className, children }: TrackedWebsiteLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => logClickAction(listingId, "website_click")}
      className={className}
    >
      {children}
    </a>
  );
}
