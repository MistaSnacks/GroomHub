import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ReactNode } from "react";

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-brand-accent/5 border border-brand-accent/20 p-5 md:p-6 my-6">
      <div className="text-sm text-brand-primary leading-relaxed font-medium">
        {children}
      </div>
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  Callout,
  h2: (props) => (
    <h2
      className="font-heading text-xl md:text-2xl font-bold text-brand-primary mt-8 mb-3"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="font-heading text-lg md:text-xl font-semibold text-brand-primary mt-6 mb-2"
      {...props}
    />
  ),
  p: (props) => (
    <p className="text-text-muted leading-relaxed" {...props} />
  ),
  ul: (props) => (
    <ul
      className="text-text-muted leading-relaxed list-disc pl-6 space-y-1.5"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="text-text-muted leading-relaxed list-decimal pl-6 space-y-1.5"
      {...props}
    />
  ),
  li: (props) => <li className="text-text-muted" {...props} />,
  strong: (props) => (
    <strong className="font-semibold text-brand-primary" {...props} />
  ),
  a: ({ href, children, ...props }) => {
    if (href?.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-brand-accent hover:text-brand-accent/80 underline underline-offset-2 transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="text-brand-accent hover:text-brand-accent/80 underline underline-offset-2 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-brand-accent/30 pl-4 italic text-text-muted"
      {...props}
    />
  ),
  hr: () => <hr className="border-border my-8" />,
  table: (props) => (
    <div className="overflow-x-auto my-4">
      <table
        className="w-full text-sm text-text-muted border-collapse"
        {...props}
      />
    </div>
  ),
  thead: (props) => (
    <thead className="bg-bg text-left" {...props} />
  ),
  th: (props) => (
    <th
      className="font-semibold text-brand-primary px-3 py-2 border-b border-border"
      {...props}
    />
  ),
  td: (props) => (
    <td className="px-3 py-2 border-b border-border/50" {...props} />
  ),
};
