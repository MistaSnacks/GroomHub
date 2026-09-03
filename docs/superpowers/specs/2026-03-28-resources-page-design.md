# Resources Page Design

**Date:** 2026-03-28
**URL:** `/resources`
**Status:** Approved

## Overview

A curated pet owner resources hub that organizes the existing 13 blog posts by audience need rather than chronology. Acts as the primary content discovery path, with `/blog` remaining as the chronological archive. Includes a "View all posts" link back to `/blog`.

## Page Structure

### Hero Section

- Matches existing `/services` and `/blog` hero pattern
- Breadcrumb: Home > Resources
- Badge with Phosphor `BookOpenText` icon: "Pet Owner Resources"
- Heading: `Pet Owner **Resources**` (teal highlight on "Resources")
- Subtitle: "Guides to help you find the right groomer, understand costs, and keep your pet looking their best."

### Content Sections

Five need-based sections, each with a heading, subtitle, and 3-column `BlogCard` grid. Sections alternate between white (`bg-white`) and cream (`bg-bg`) backgrounds, separated by `WaveDivider` components.

**1. Getting Started** - "New to grooming? Start here."
- `choosing-the-right-groomer-for-your-pet`
- `puppy-first-grooming-guide`
- `how-often-should-you-groom-your-dog`

**2. Cost & Pricing** - "Know what to expect before you book."
- `dog-grooming-cost-seattle-portland-2026`
- `mobile-dog-grooming-cost-guide`
- `senior-dog-grooming-budget-guide`

**3. Special Situations** - "Extra care for dogs that need it."
- `grooming-anxious-dogs-stress-free-guide`
- `severely-matted-dog-grooming-guide`
- `cat-grooming-what-to-expect`

**4. Seasonal & PNW Care** - "Year-round grooming for Pacific Northwest weather."
- `pnw-seasonal-dog-grooming-guide`
- `rain-mud-fur-pnw-grooming-survival-guide`
- `winter-grooming-tips-pnw-dogs`

**5. Breed Guides** - "Breed-specific grooming, coat care, and styles."
- `goldendoodle-grooming-guide`

### Footer Elements

- "View All Posts" link to `/blog` after the last section
- `NewsletterCta` component (existing, reused)
- Standard wave dividers into newsletter and footer

## Technical Details

### Components

- **Server Component** (no client JS needed)
- Reuses: `BlogCard`, `WaveDivider`, `AnimatedSection`, `AnimatedItem`, `NewsletterCta`
- No new components required

### Data

Post-to-section mapping is a hardcoded array of section definitions, each containing:
- `id` (string, for anchor links)
- `title` (string)
- `subtitle` (string)
- `slugs` (string array of blog post slugs)

Posts are fetched via existing `getBlogPostBySlug()` from `src/lib/blog.ts`. If a slug is not found (post deleted), it is silently skipped.

### SEO

- Title: "Pet Owner Resources | GroomLocal"
- Description: "Grooming guides organized by what you need: getting started, costs, special situations, seasonal care, and breed-specific tips."
- OpenGraph + Twitter card metadata
- JSON-LD: `CollectionPage` schema with `hasPart` referencing each article
- Add `/resources` to `sitemap.ts`

### Navigation

- Add "Resources" link to the nav dropdown (alongside Blog)

### Files to Create/Modify

- **Create:** `src/app/resources/page.tsx`
- **Modify:** `src/app/sitemap.ts` (add `/resources`)
- **Modify:** Nav component (add Resources link)
