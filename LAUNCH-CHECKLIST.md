# GroomingBook Directory — Launch Checklist

## Must-Fix Before Launch (Blockers)

- [ ] **1. Brand name consistency** — Split between "GroomingBook" and "Groomingdale's" across layout metadata, footer, about page, contact emails. Pick one and apply everywhere.
- [ ] **2. Privacy Policy page** — Footer links to `/` instead of a real `/privacy` page. Legal requirement since you collect data via forms.
- [ ] **3. Contact form doesn't work** — Submits to nowhere. Wire to Formspree, Resend, or similar. Email shows `hello@groomingdales.com` in one place and `hello@groomingbook.com` in another.
- [ ] **4. Quote Wizard is fake** — Shows "You're all set!" but sends nothing. Either wire it up or remove pre-launch.
- [x] **5. ~Random data on every render~** — FIXED: Deleted `mock-data.ts` entirely. Listings were dead code (Supabase is the real source). Extracted `pricingTiers` to `src/lib/pricing.ts`. Removed fake reviews from groomer profiles. Cleaned up old scripts.
- [ ] **6. Add `metadataBase`** to root `layout.tsx` — Required for OG/social URLs to resolve correctly.
- [ ] **7. Custom 404 page** — No global `not-found.tsx`. "Ruh-roh" copy exists in groomer page, just needs to be a proper global 404.

## High Priority (Before Launch)

- [ ] **8. Analytics** — Zero tracking set up. Add Vercel Analytics or Plausible for traffic data from day one.
- [ ] **9. OG image** — No social sharing image. Shares look blank on Twitter/Facebook/LinkedIn.
- [ ] **10. Newsletter form** — Subscribe button does nothing. Wire to ConvertKit, Resend, etc., or remove it.
- [ ] **11. Fix `<img>` tags** — 3 places using raw `<img>` instead of Next.js `<Image />`. Hurts Core Web Vitals.
- [ ] **12. Remove dead packages** — `stripe`, `three`, `@react-three/fiber`, `animejs` installed but unused. Bloats bundle.
- [ ] **13. Terms of Service page**

## Nice-to-Have (Post-Launch)

- [ ] **14. Global `error.tsx` boundary**
- [ ] **15. `apple-icon.png` for iOS**
- [ ] **16. Twitter card metadata**
- [ ] **17. Clean up 26 lint warnings** (unused imports)
- [ ] **18. More blog content** (only 4 posts)
- [ ] **19. Ad network wiring** (`AdSlot` is a placeholder)
