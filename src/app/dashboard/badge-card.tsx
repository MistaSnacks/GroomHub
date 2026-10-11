"use client";

import { useState } from "react";
import { Check, Copy, DownloadSimple, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { BADGE_ALT, BADGE_HEIGHT, BADGE_PNG_PATH, BADGE_WIDTH, badgeLinkUrl, badgeSnippet } from "@/lib/badge";

interface BadgeCardProps {
  slug: string;
  name: string;
  /** Websites where the badge image has loaded, most recent first. */
  installs: { host: string; lastSeen: string }[];
}

type Builder = "squarespace" | "wix" | "godaddy" | "wordpress" | "other";

const BUILDERS: { key: Builder; label: string }[] = [
  { key: "squarespace", label: "Squarespace" },
  { key: "wix", label: "Wix" },
  { key: "godaddy", label: "GoDaddy" },
  { key: "wordpress", label: "WordPress" },
  { key: "other", label: "Something else" },
];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-brand-primary/90"
    >
      {copied ? <Check weight="bold" className="h-4 w-4" /> : <Copy weight="bold" className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function Steps({ builder, link }: { builder: Builder; link: string }) {
  const code = <span className="font-semibold text-brand-primary">Copy code</span>;
  const download = <span className="font-semibold text-brand-primary">Download image</span>;
  const linkWord = <span className="font-semibold text-brand-primary">Copy link</span>;
  const steps: Record<Builder, React.ReactNode[]> = {
    squarespace: [
      <>Click {code} above.</>,
      <>In Squarespace, edit the page or footer where you want the badge.</>,
      <>Add a block, choose <strong>Code</strong>, and paste the code into it.</>,
      <>Save, then open that page on your live site once so we can confirm it.</>,
    ],
    wix: [
      <>Click {download} and {linkWord} above.</>,
      <>In the Wix editor, add an <strong>Image</strong> and upload the badge picture.</>,
      <>Click the image, choose <strong>Link</strong>, pick <strong>Web Address</strong>, and paste your link.</>,
      <>Publish. (Wix puts pasted code in a frame that Google cannot follow, so the image is the better choice.)</>,
    ],
    godaddy: [
      <>Click {download} and {linkWord} above.</>,
      <>In the GoDaddy editor, add an image to a section or your footer and upload the badge picture.</>,
      <>In the image settings, set its link to your GroomLocal link.</>,
      <>Publish your site.</>,
    ],
    wordpress: [
      <>Click {code} above.</>,
      <>Edit the page, or open Appearance, then Widgets, for your footer.</>,
      <>Add a <strong>Custom HTML</strong> block and paste the code.</>,
      <>Update or publish, then open that page once so we can confirm it.</>,
    ],
    other: [
      <>If your site lets you paste HTML, click {code} above and paste it.</>,
      <>If it only takes images, click {download}, upload it, and link it with {linkWord}.</>,
      <>
        A plain text link works too: add the words &quot;Find us on GroomLocal&quot; and link them to <span className="break-all">{link}</span>
      </>,
    ],
  };
  return (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
      {steps[builder].map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}

export function BadgeCard({ slug, name, installs }: BadgeCardProps) {
  const [builder, setBuilder] = useState<Builder>("squarespace");
  const snippet = badgeSnippet(slug);
  const link = badgeLinkUrl(slug);
  const live = installs[0];

  return (
    <section id="badge" className="scroll-mt-6 rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <h2 className="font-heading text-xl font-semibold text-brand-primary">Show you&apos;re Owner Confirmed on your website</h2>
          <p className="mt-2 text-sm text-text-muted">
            Add this badge to your own website. It links to your GroomLocal page for {name}, where customers can see your photos and
            hours and send you a message. It also helps more people find your page. While your listing is featured, the badge code
            shows &quot;Featured on GroomLocal&quot;.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- the exact image owners will embed */}
        <img src={BADGE_PNG_PATH} alt={BADGE_ALT} width={BADGE_WIDTH} height={BADGE_HEIGHT} className="shrink-0" />
      </div>

      {live ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-secondary/10 px-3 py-2 text-sm text-brand-primary">
          <SealCheck weight="fill" className="h-4 w-4 shrink-0 text-brand-secondary" />
          <span>
            Your badge is live on <strong>{live.host}</strong>
            {installs.length > 1 ? ` and ${installs.length - 1} more ${installs.length === 2 ? "site" : "sites"}` : ""}. Thank you!
          </span>
        </p>
      ) : null}

      <div className="mt-5">
        <label htmlFor={`badge-code-${slug}`} className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Badge code
        </label>
        <textarea
          id={`badge-code-${slug}`}
          readOnly
          value={snippet}
          rows={3}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1 w-full resize-none rounded-xl border border-border bg-bg px-3 py-2 font-mono text-xs text-text"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton value={snippet} label="Copy code" />
          <CopyButton value={link} label="Copy link" />
          <a
            href={BADGE_PNG_PATH}
            download="groomlocal-owner-confirmed.png"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold text-brand-primary transition-colors hover:border-brand-primary"
          >
            <DownloadSimple weight="bold" className="h-4 w-4" />
            Download image
          </a>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-brand-primary">How to add it</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="tablist" aria-label="Your website builder">
          {BUILDERS.map((b) => (
            <button
              key={b.key}
              type="button"
              role="tab"
              aria-selected={builder === b.key}
              onClick={() => setBuilder(b.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                builder === b.key ? "bg-brand-primary text-white" : "bg-border/60 text-text-muted hover:text-brand-primary"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <Steps builder={builder} link={link} />
        {!live && (
          <p className="mt-4 text-xs text-text-muted">
            After you paste the code, open the page on your live site once and this box will confirm it. If you uploaded the image
            instead, we can&apos;t see it from here, and that&apos;s fine.
          </p>
        )}
      </div>
    </section>
  );
}
