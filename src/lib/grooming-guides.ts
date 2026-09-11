import type { BlogPostMeta } from "./blog";

export const GUIDE_TOPICS = [
  {
    id: "getting-started",
    title: "Getting Started",
    subtitle: "New to grooming? Start here.",
    slugs: [
      "choosing-the-right-groomer-for-your-pet",
      "puppy-first-grooming-guide",
      "how-often-should-you-groom-your-dog",
      "how-long-does-dog-grooming-take",
    ],
  },
  {
    id: "cost-pricing",
    title: "Cost & Pricing",
    subtitle: "Know what to expect before you book.",
    slugs: [
      "dog-nail-trimming-cost-guide",
      "dog-grooming-cost-seattle-portland-2026",
      "mobile-dog-grooming-cost-guide",
      "senior-dog-grooming-budget-guide",
    ],
  },
  {
    id: "special-situations",
    title: "Special Situations",
    subtitle: "Extra care for pets that need it.",
    slugs: [
      "dog-ear-cleaning-grooming-guide",
      "grooming-anxious-dogs-stress-free-guide",
      "severely-matted-dog-grooming-guide",
      "cat-grooming-what-to-expect",
    ],
  },
  {
    id: "seasonal-pnw",
    title: "Seasonal & PNW Care",
    subtitle: "Year-round grooming for Pacific Northwest weather.",
    slugs: [
      "pnw-seasonal-dog-grooming-guide",
      "rain-mud-fur-pnw-grooming-survival-guide",
      "winter-grooming-tips-pnw-dogs",
      "summer-dog-grooming-pnw",
      "dog-halloween-costume-ideas",
    ],
  },
  {
    id: "breed-guides",
    title: "Breed Guides",
    subtitle: "Breed-specific grooming, coat care, and styles.",
    slugs: ["goldendoodle-grooming-guide"],
  },
];

// Topic links and legacy category URLs are alternative views, never combined filters.
export function getGuideListing<T extends BlogPostMeta>(
  posts: T[],
  filters: { topic?: string | string[]; category?: string | string[] },
) {
  const topic = GUIDE_TOPICS.find((item) => item.id === filters.topic);
  const category = !topic && typeof filters.category === "string"
    && posts.some((post) => post.category === filters.category)
    ? filters.category
    : undefined;

  return {
    topic,
    category,
    posts: posts.filter((post) => topic
      ? topic.slugs.includes(post.slug)
      : !category || post.category === category),
  };
}
