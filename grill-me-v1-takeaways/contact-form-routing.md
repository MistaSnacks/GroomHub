# Contact Form: Store in DB + Email Notification

## Decision
Option B - every contact form submission gets stored in a `leads` table in Supabase AND triggers an email notification to the groomer via Resend.

## Why Both
- Email ensures groomers actually see the lead (they won't check a dashboard)
- DB storage gives us the data trail needed for the 90-day upgrade pitch
- "You received 12 inquiries through GroomLocal this quarter" is the single most powerful conversion line

## Leads Table Schema (proposed)
- id (uuid)
- listing_id (FK to business_listings)
- sender_name (text)
- sender_email (text)
- message (text)
- created_at (timestamp)
- read (boolean, default false) - for future dashboard inbox

## Email via Resend
- Send to groomer's listed email address
- Simple template: "You have a new inquiry on GroomLocal" with sender name, message, and link to their listing
- Resend has sending limits on current plan but can upgrade if needed

## Future Use
- Dashboard inbox page already scaffolded, can wire up to leads table later
- Lead count becomes a key metric for analytics dashboard
- Aggregate lead data across all listings = proof of platform value for investor/partner conversations

## Action Items
- [ ] Create `leads` table in Supabase
- [ ] Build server action for contact form submission
- [ ] Set up Resend email template for lead notifications
- [ ] Wire contact form component to server action
- [ ] Add RLS policy (groomers can read their own leads, anon can insert)
