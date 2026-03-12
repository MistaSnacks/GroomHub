"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

interface CopyBadgeProps {
    listingSlug: string;
}

export function CopyBadge({ listingSlug }: CopyBadgeProps) {
    const [copied, setCopied] = useState(false);

    // Generates absolute URL depending on environment, defaulting to standard domain if not available 
    // (In a real app you might pull NEXT_PUBLIC_SITE_URL or similar, we'll hardcode the production domain here for simplicity and safety)
    const siteUrl = "https://groomlocal.com";
    const profileUrl = `${siteUrl}/groomer/${listingSlug}`;
    const badgeUrl = `${siteUrl}/verified-badge.svg`;

    const htmlSnippet = `<a href="${profileUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${badgeUrl}" alt="Verified on GroomLocal" width="240" height="80" style="width:240px;height:80px;" />\n</a>`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(htmlSnippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy snippet", err);
        }
    };

    return (
        <div className="bg-bg rounded-xl border border-brand-accent/20 p-6 shadow-sm flex flex-col items-center">
            <div className="mb-6 flex justify-center">
                {/* Visual Preview */}
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-90 transition-opacity">
                    <img src="/verified-badge.svg" alt="Verified on GroomLocal" width={240} height={80} className="w-[240px] h-[80px]" />
                </a>
            </div>

            <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-brand-primary">HTML Snippet</span>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition-colors bg-white px-2.5 py-1 rounded-md border border-brand-accent/10 shadow-sm"
                    >
                        {copied ? (
                            <>
                                <Check weight="bold" className="w-3.5 h-3.5" /> Copied!
                            </>
                        ) : (
                            <>
                                <Copy weight="bold" className="w-3.5 h-3.5" /> Copy Code
                            </>
                        )}
                    </button>
                </div>

                <div className="bg-white rounded-lg border border-border overflow-hidden relative group">
                    <textarea
                        readOnly
                        value={htmlSnippet}
                        className="w-full h-24 p-3 text-xs font-mono text-text-muted bg-transparent resize-none focus:outline-none"
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                </div>
                <p className="text-xs text-text-muted mt-3 text-center">
                    Paste this code anywhere on your website (like your footer or about page) to show potential clients you&apos;re a verified local business.
                </p>
            </div>
        </div>
    );
}
