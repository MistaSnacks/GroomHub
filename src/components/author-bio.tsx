import { User } from "@phosphor-icons/react/dist/ssr";
import type { BlogAuthor } from "@/lib/blog";

interface AuthorBioProps {
  author: BlogAuthor;
}

export function AuthorBio({ author }: AuthorBioProps) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-2xl border border-border bg-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent shrink-0">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={author.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User weight="fill" className="w-7 h-7" />
        )}
      </div>
      <div>
        <p className="font-heading font-semibold text-brand-primary text-lg">
          {author.name}
        </p>
        <p className="text-sm text-text-muted leading-relaxed mt-1">
          {author.bio}
        </p>
      </div>
    </div>
  );
}
