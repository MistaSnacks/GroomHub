# Resources Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/resources` page that organizes existing blog posts into curated, need-based sections.

**Architecture:** Static Server Component page with hardcoded section-to-post mappings. Reuses existing `BlogCard`, `WaveDivider`, `AnimatedSection`, `AnimatedItem`, and `NewsletterCta` components. Adds CollectionPage JSON-LD schema.

**Tech Stack:** Next.js App Router, existing blog system (`src/lib/blog.ts`), Phosphor icons

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/app/resources/page.tsx` | Resources hub page (Server Component) |
| Modify | `src/lib/schema.ts` | Add `resourcesPageSchema()` function |
| Modify | `src/app/sitemap.ts` | Add `/resources` to static pages |
| Modify | `src/components/site-header.tsx` | Add "Resources" link to desktop + mobile nav |

---

### Task 1: Create the resources page

**Files:**
- Create: `src/app/resources/page.tsx`

- [ ] **Step 1: Create the page file**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CaretRight, BookOpenText, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getBlogPostBySlug } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { NewsletterCta } from "@/components/newsletter-cta";
import { WaveDivider } from "@/components/wave-divider";
import { AnimatedSection, AnimatedItem } from "@/components/animated-section";
import { resourcesPageSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Pet Owner Resources | GroomLocal",
  description:
    "Grooming guides organized by what you need: getting started, costs, special situations, seasonal care, and breed-specific tips.",
  openGraph: {
    title: "Pet Owner Resources | GroomLocal",
    description:
      "Grooming guides organized by what you need: getting started, costs, special situations, seasonal care, and breed-specific tips.",
    type: "website",
    url: "/resources",
    siteName: "GroomLocal",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GroomLocal Resources" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet Owner Resources | GroomLocal",
    description:
      "Grooming guides organized by what you need: getting started, costs, special situations, seasonal care, and breed-specific tips.",
    images: ["/og-image.png"],
  },
};

const RESOURCE_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    subtitle: "New to grooming? Start here.",
    slugs: [
      "choosing-the-right-groomer-for-your-pet",
      "puppy-first-grooming-guide",
      "how-often-should-you-groom-your-dog",
    ],
  },
  {
    id: "cost-pricing",
    title: "Cost & Pricing",
    subtitle: "Know what to expect before you book.",
    slugs: [
      "dog-grooming-cost-seattle-portland-2026",
      "mobile-dog-grooming-cost-guide",
      "senior-dog-grooming-budget-guide",
    ],
  },
  {
    id: "special-situations",
    title: "Special Situations",
    subtitle: "Extra care for dogs that need it.",
    slugs: [
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
    ],
  },
  {
    id: "breed-guides",
    title: "Breed Guides",
    subtitle: "Breed-specific grooming, coat care, and styles.",
    slugs: ["goldendoodle-grooming-guide"],
  },
];

export default function ResourcesPage() {
  const sections = RESOURCE_SECTIONS.map((section) => ({
    ...section,
    posts: section.slugs
      .map((slug) => getBlogPostBySlug(slug))
      .filter(Boolean),
  }));

  // Flatten all posts for schema
  const allPosts = sections.flatMap((s) => s.posts);

  // Alternate bg: even index = white, odd = cream
  const bgColors = ["bg-white", "bg-bg"];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-bg py-12 md:py-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-brand-accent mb-5 font-semibold tracking-wide">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <CaretRight weight="bold" className="w-3 h-3 text-text-muted" />
            <span className="text-brand-primary">Resources</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-brand-accent/15 border border-brand-accent/30 rounded-full px-4 py-1.5 text-sm text-brand-accent font-semibold mb-6">
            <BookOpenText weight="fill" className="w-4 h-4 text-brand-secondary" />
            Pet Owner Resources
          </div>

          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3 text-brand-primary">
            Pet Owner <span className="text-brand-secondary">Resources</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Guides to help you find the right groomer, understand costs, and keep
            your pet looking their best.
          </p>
        </div>
      </section>

      <WaveDivider variant="gentle" fromColor="#FDF8F0" toColor="#FFFFFF" />

      {/* Resource Sections */}
      {sections.map((section, index) => {
        const bg = bgColors[index % 2];
        const fromColor = index % 2 === 0 ? "#FFFFFF" : "#FDF8F0";
        const toColor = index % 2 === 0 ? "#FDF8F0" : "#FFFFFF";

        return (
          <div key={section.id}>
            <section id={section.id} className={`${bg} py-12 md:py-16`}>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="font-heading text-2xl font-semibold text-brand-primary mb-1">
                  {section.title}
                </h2>
                <p className="text-text-muted text-sm mb-8">{section.subtitle}</p>

                <AnimatedSection
                  variant="stagger"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {section.posts.map((post) => (
                    <AnimatedItem key={post!.slug}>
                      <BlogCard post={post!} />
                    </AnimatedItem>
                  ))}
                </AnimatedSection>
              </div>
            </section>

            {index < sections.length - 1 && (
              <WaveDivider
                variant="asymmetric"
                fromColor={fromColor}
                toColor={toColor}
              />
            )}
          </div>
        );
      })}

      {/* View All Posts link */}
      <section className={`${bgColors[sections.length % 2]} py-8`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:text-brand-primary transition-colors"
          >
            View all posts
            <ArrowRight weight="bold" className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <WaveDivider
        variant="steep"
        fromColor={sections.length % 2 === 0 ? "#FFFFFF" : "#FDF8F0"}
        toColor="#FF7E67"
      />

      {/* Newsletter CTA */}
      <NewsletterCta />

      <WaveDivider variant="footer" fromColor="#FF7E67" toColor="#4ECDC4" />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(resourcesPageSchema(allPosts)),
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify the page builds without errors**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npx next build 2>&1 | tail -20`

This will fail because `resourcesPageSchema` doesn't exist yet. That's expected - we add it in Task 2.

- [ ] **Step 3: Commit the page file**

```bash
git add src/app/resources/page.tsx
git commit -m "feat: add /resources page with curated blog sections"
```

---

### Task 2: Add CollectionPage JSON-LD schema

**Files:**
- Modify: `src/lib/schema.ts` (add after `blogPostSchema` at ~line 360)

- [ ] **Step 1: Add the resourcesPageSchema function**

Add this at the end of `src/lib/schema.ts`:

```typescript
export function resourcesPageSchema(
  posts: { title: string; slug: string; excerpt: string; date: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Pet Owner Resources",
    description:
      "Grooming guides organized by what you need: getting started, costs, special situations, seasonal care, and breed-specific tips.",
    url: `${BASE_URL}/resources`,
    publisher: {
      "@type": "Organization",
      name: "GroomLocal",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icon.svg`,
      },
    },
    hasPart: posts.map((post) => ({
      "@type": "Article",
      headline: post.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      description: post.excerpt,
    })),
  };
}
```

- [ ] **Step 2: Verify the build succeeds**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npx next build 2>&1 | tail -20`

Expected: Build succeeds, `/resources` appears in the output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schema.ts
git commit -m "feat: add CollectionPage JSON-LD schema for resources page"
```

---

### Task 3: Add /resources to sitemap

**Files:**
- Modify: `src/app/sitemap.ts:26-41` (add to `staticPages` array)

- [ ] **Step 1: Add the resources entry to staticPages**

In `src/app/sitemap.ts`, add this line after the `/blog` entry (line 37) inside the `staticPages` array:

```typescript
      { url: `${BASE_URL}/resources`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
```

- [ ] **Step 2: Verify build still succeeds**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && npx next build 2>&1 | tail -20`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add /resources to sitemap"
```

---

### Task 4: Add Resources link to navigation

**Files:**
- Modify: `src/components/site-header.tsx:87-98` (desktop nav)
- Modify: `src/components/site-header.tsx:181-201` (mobile nav)

- [ ] **Step 1: Add "Resources" to desktop nav**

In `src/components/site-header.tsx`, find the desktop nav `<Link>` for `/blog` (lines 87-92) and add a "Resources" link right before it:

```tsx
            <Link
              href="/resources"
              className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors"
            >
              Resources
            </Link>
```

This goes between the `<NavDropdown label="Specialties" ... />` and the existing Blog link.

- [ ] **Step 2: Add "Resources" to mobile nav**

In the mobile nav section, find the Blog link (lines 182-187) and add a Resources link right before it:

```tsx
              <Link
                href="/resources"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-primary/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Resources
              </Link>
```

- [ ] **Step 3: Verify build succeeds and nav renders**

Run: `cd "/Users/admin/GroomingBook Directory/pnw-grooming-directory" && PORT=3005 npx next dev &`

Open http://localhost:3005 and verify "Resources" appears in both desktop and mobile nav. Then visit http://localhost:3005/resources and confirm the page loads with all 5 sections.

- [ ] **Step 4: Commit**

```bash
git add src/components/site-header.tsx
git commit -m "feat: add Resources link to site navigation"
```
