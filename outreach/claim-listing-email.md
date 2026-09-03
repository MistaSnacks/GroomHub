# Claim Your Listing - Email Template

## Subject Line Options
1. Your grooming business is listed on GroomLocal
2. [Business Name], you have a free listing on GroomLocal
3. Pet owners in [City] are finding you on GroomLocal

---

## Email Body

**From:** GroomLocal Team <hello@groomlocal.com>
**Reply-To:** hello@groomlocal.com

---

Hi [First Name / Business Name],

Your business, **[Business Name]**, is already listed on [GroomLocal](https://groomlocal.com/groomer/[slug]), the Pacific Northwest's dog grooming directory.

Pet owners in [City] are using GroomLocal to find and compare groomers by services, pricing, specialties, and location. Your profile is live and showing up in search results right now.

**Here's what your listing currently includes:**
- Business name, address, and phone number
- Your services ([Service Tag 1], [Service Tag 2], etc.)
- Pricing range and business hours
- A link to your website

**Claim your listing (free) to:**
- Update your description, photos, and service details
- Respond to inquiries from pet owners
- Add your booking link so clients can schedule directly
- Get a verified badge on your profile

**[Claim Your Free Listing →](https://groomlocal.com/claim/[slug])**

You can also add a GroomLocal badge to your website to let clients know where to find your reviews and profile. Here's what it looks like:

![GroomLocal Verified Badge](https://groomlocal.com/verified-badge.svg)

Just copy the code from your profile page after claiming, or reply to this email and we'll send it over.

Thanks for grooming the dogs of [City].

Cheers,
The GroomLocal Team

P.S. If this isn't your business or you'd like to be removed, just reply and we'll take care of it.

---

## Segmentation Notes

### Priority 1: Groomers with websites (highest badge adoption)
- Filter: `website IS NOT NULL`
- These businesses already have a site to place the badge on
- Estimated count: ~800 of 1,177 listings

### Priority 2: Groomers with email addresses
- Filter: `email IS NOT NULL`
- Direct send, no research needed
- Personalize with their actual service tags and city

### Priority 3: Groomers with only phone numbers
- Skip for email outreach
- Consider a follow-up SMS or postcard campaign later

### Personalization Variables
| Variable | Source |
|----------|--------|
| `[Business Name]` | `name` column |
| `[First Name]` | Parse from name or use business name |
| `[City]` | `city` column |
| `[slug]` | `slug` column |
| `[Service Tag 1, 2]` | First 2-3 items from `service_tags` |
| `[State]` | `state` column |

---

## Follow-Up Sequence

### Email 2 (Day 5): The badge nudge
**Subject:** Add a GroomLocal badge to your website

Hi [Business Name],

Quick follow-up. We noticed you haven't claimed your listing yet.

Your profile at groomlocal.com/groomer/[slug] is getting views from pet owners in [City]. Claiming takes about 60 seconds and gives you full control over your listing.

We also have an embeddable badge you can add to your site. It links visitors to your GroomLocal profile where they can see your services, hours, and contact info all in one place.

**[Claim Your Listing →](https://groomlocal.com/claim/[slug])**

Cheers,
The GroomLocal Team

### Email 3 (Day 12): Social proof
**Subject:** [X] groomers in [City] have claimed their listings

Hi [Business Name],

[X] groomers in [City] have already claimed their free listings on GroomLocal. Claimed listings get a verified badge, which helps build trust with new clients searching for groomers in [City].

Your listing is still unclaimed: groomlocal.com/groomer/[slug]

**[Claim it now (free) →](https://groomlocal.com/claim/[slug])**

Cheers,
The GroomLocal Team

---

## Compliance Notes
- Include physical mailing address in footer (CAN-SPAM)
- Include unsubscribe link
- Do not send more than 3 emails per business
- Respect opt-outs immediately
- Since these are B2B transactional/informational emails about an existing listing, CAN-SPAM applies but TCPA (for SMS) has stricter rules. Stick with email for now.
