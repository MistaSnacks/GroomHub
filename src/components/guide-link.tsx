import Link from "next/link";
import { LINK_TOKEN, type GuideLink } from "@/lib/internal-links";

interface GuideLinkSentenceProps {
  link: GuideLink;
  /** Block name written to `data-link-src` so the link audit can tell template links from editorial ones. */
  source: string;
  className?: string;
}

export function GuideLinkSentence({ link, source, className = "text-sm text-text-muted leading-relaxed" }: GuideLinkSentenceProps) {
  const [before, after] = link.sentence.split(LINK_TOKEN);
  return (
    <p className={className}>
      {before}
      <Link
        href={`/blog/${link.slug}`}
        data-link-src={source}
        className="text-brand-accent underline hover:text-brand-primary"
      >
        {link.anchor}
      </Link>
      {after}
    </p>
  );
}
