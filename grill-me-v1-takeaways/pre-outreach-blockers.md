# Pre-Outreach Blockers: Three Must-Fix Items

## Decision
These three features must be functional before any groomer outreach begins. They are table stakes for the beta barter program to be credible.

## Why This Matters
The beta barter asks groomers to trust GroomLocal with their brand (backlink, testimonial). If they claim and find a half-built dashboard, that trust breaks immediately. A groomer who feels burned won't add a backlink, won't give a quote, and will tell other groomers.

## The Three Blockers

### 1. Real Photo Upload
- **Current state**: Mocked. Cycles through hardcoded Unsplash URLs. No file input.
- **Needed**: Upload to Supabase Storage, display real images, respect tier limits (but all unlocked during beta)
- **Why first**: Photos are the #1 thing a groomer will want to add. Their work IS visual.

### 2. Self-Service Services/Specialties Editing
- **Current state**: Locked. "Contact support to update services and specialties."
- **Needed**: Toggle-based UI using existing tag taxonomy from `src/lib/tags.ts` (15 service tags, 15 specialty tags)
- **Why**: A groomer who does mobile grooming but their listing says "salon only" will be frustrated they can't fix it themselves.

### 3. Working Contact Form
- **Current state**: Mocked. 1.5s timeout then fake success message. No email sent.
- **Needed**: Server action that sends email via Resend to the groomer (or stores in leads table for inbox)
- **Why**: This is the core value prop of a directory. If someone finds a groomer and tries to contact them, nothing happens. That's broken for the groomer AND the pet owner.

## What Can Stay Aspirational
- Analytics / view counts
- Lead inbox (premium feature, can come later)
- Badges and top placement logic
- Profile completeness meter
- Backlink checker automation

## Action Items
- [ ] Implement Supabase Storage photo upload (replace mocked upload)
- [ ] Build services/specialties toggle UI on edit page (using existing tag taxonomy)
- [ ] Wire contact form to Resend (send email to groomer's listed email)
- [ ] Remove "contact support" gates on services/specialties
- [ ] QA the full claim-to-edit flow end to end before first outreach visit
