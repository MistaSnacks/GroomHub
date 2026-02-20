import { Star, Quotes, PawPrint } from "@phosphor-icons/react/dist/ssr";
import type { Review } from "@/lib/types";

interface ReviewCardProps {
  review: Review;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          weight="fill"
          className={`w-4 h-4 shrink-0 ${star <= rating
            ? "text-[#FBC02D]"
            : "text-text-muted/30"
            }`}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const initials = review.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const formattedDate = new Date(review.date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-border p-5 relative overflow-hidden">
      <Quotes weight="fill" className="absolute top-4 right-4 w-8 h-8 text-brand-secondary/20" />

      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-secondary to-brand-accent flex items-center justify-center text-brand-primary font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-medium text-sm text-text">{review.authorName}</div>
          {review.petName && (
            <div className="text-xs text-text-muted">
              <PawPrint weight="fill" className="inline-block w-3 h-3 text-brand-secondary mr-1" /> {review.petName} {review.petBreed ? `the ${review.petBreed}` : ""}
            </div>
          )}
        </div>
      </div>

      <StarRating rating={review.rating} />

      <p className="mt-3 text-sm text-text/80 leading-relaxed">
        &quot;{review.text}&quot;
      </p>

      <div className="mt-3 text-xs text-text-muted">{formattedDate}</div>
    </div>
  );
}
