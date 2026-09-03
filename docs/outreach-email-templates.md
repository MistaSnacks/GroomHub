# GroomLocal Outreach Email Templates

> Use with `data/scraped-emails.csv`. Personalization tokens: `{{name}}`, `{{city}}`, `{{slug}}`, `{{website}}`
> Claim link format: `https://groomlocal.com/claim/{{slug}}`
> Profile link format: `https://groomlocal.com/groomer/{{slug}}`

---

## Email 1: Initial Outreach

**Subject line options (A/B test):**
- A: `{{name}} is already on GroomLocal`
- B: `Free listing upgrade for {{city}} groomers`
- C: `Quick question for {{name}}`

**From:** [Your name] <hello@groomlocal.com>

**Body:**

Hi there,

I'm building GroomLocal, a free grooming directory for the Pacific Northwest. Your business is already listed:

https://groomlocal.com/groomer/{{slug}}

Right now I'm looking for founding members to help shape the directory. In exchange for adding a small GroomLocal badge on your website, you get all Premium features free for 90 days:

- Verified badge on your listing (stands out to pet parents searching your area)
- Unlimited photo uploads to showcase your work
- Priority placement on the {{city}} page
- Your own dashboard to update hours, services, and contact info

It takes about 2 minutes to claim your profile:
https://groomlocal.com/claim/{{slug}}

No credit card, no catch. I'm a groomer myself and built this because the big directories charge too much and don't care about our industry.

Happy to answer any questions.

[Your name]
GroomLocal
https://groomlocal.com

P.S. You can see what your listing looks like right now at the link above. If anything is wrong (hours, address, services), claiming lets you fix it yourself.

---

## Email 2: Follow-Up (send 4 days after Email 1, no reply)

**Subject:** Re: {{name}} is already on GroomLocal

**Body:**

Hi again,

Just floating this back to the top of your inbox. Your {{city}} listing is live on GroomLocal and ready to claim:

https://groomlocal.com/claim/{{slug}}

A few other groomers in the area have already claimed theirs, and their profiles now show a Verified badge when pet parents search {{city}}.

The founding member offer (free Premium for 90 days) is still open. No credit card needed.

[Your name]

---

## Email 3: Final Follow-Up (send 7 days after Email 2, no reply)

**Subject:** Last note about your GroomLocal listing

**Body:**

Hi,

Last email about this. Your business is listed on GroomLocal and anyone searching for dog grooming in {{city}} can find it:

https://groomlocal.com/groomer/{{slug}}

If you'd like to control what shows up (photos, hours, services, contact info), you can claim it here:

https://groomlocal.com/claim/{{slug}}

If you're not interested, no worries at all. I won't email again.

[Your name]

---

## Email 4: Post-Claim Welcome (send after groomer claims, automated via Resend)

**Subject:** Welcome to GroomLocal, {{name}}!

**Body:**

Hey, welcome aboard!

Your listing is now claimed and showing a Verified badge to anyone searching for groomers in {{city}}. Here's what to do next:

1. **Add your best photos.** Listings with photos get significantly more clicks. Head to your dashboard: https://groomlocal.com/dashboard

2. **Update your hours and services.** Make sure pet parents see accurate info.

3. **Add the GroomLocal badge to your website.** This is the one thing we ask in return for the free Premium features. You'll find the copy-paste code on your success page, or grab it here: https://groomlocal.com/claim/{{slug}}/success

That's it. Your Premium features (priority placement, unlimited photos, Verified + Paw-Verified badges) are active for 90 days.

If you have questions or feedback, just reply to this email. I read every one.

[Your name]

---

## Email 5: 2-Week Badge Reminder (send 14 days after claim if no backlink detected)

**Subject:** Quick reminder about your GroomLocal badge

**Body:**

Hi {{name}},

Hope you're getting settled on GroomLocal. Quick reminder: as part of the founding member program, we ask that you add the GroomLocal badge somewhere on your website (footer, about page, sidebar).

Here's the code to paste:

```html
<a href="https://groomlocal.com/groomer/{{slug}}" target="_blank" rel="noopener noreferrer">
  <img src="https://groomlocal.com/verified-badge.svg" alt="Verified on GroomLocal" width="240" height="80" />
</a>
```

If you need help adding it, just reply and I'll walk you through it. It takes about 30 seconds if you have access to your website editor.

Thanks for being a founding member.

[Your name]

---

## Email 6: 6-Week Check-In (send 42 days after claim)

**Subject:** Your GroomLocal listing: {{name}} update

**Body:**

Hi {{name}},

Quick update on your GroomLocal listing. In the past 6 weeks:

- Your profile has been viewed [X] times
- [X] pet parents clicked through to your website
- You're currently ranked [X] on the {{city}} page

[If no backlink:]
One thing: we haven't been able to find the GroomLocal badge on your website yet. Your free Premium features continue through [date], but we do need the badge in place to keep them active after that. Reply if you need a hand adding it.

[If backlink confirmed:]
Thanks for keeping the GroomLocal badge on your site. Your Premium features will automatically renew for another 90 days.

[Your name]

---

## Text Message Templates (for phone outreach follow-up)

**Initial text (after missed call):**

Hi, this is [name] from GroomLocal. I called about your free grooming directory listing. Your business is already on our site: groomlocal.com/groomer/{{slug}}. You can claim it and get a Verified badge at groomlocal.com/claim/{{slug}}. No cost, takes 2 min. Questions? Just text back.

**Follow-up text (3 days later):**

Hey, just following up. Your {{city}} listing on GroomLocal is ready to claim. Other groomers in the area are already showing Verified badges. Claim yours free: groomlocal.com/claim/{{slug}}

---

## Notes on Sending

**Tool:** Use Resend (already integrated via Supabase) or a simple mail merge tool like Mailmeteor, GMass, or Instantly.

**Volume:** Start with 20-30 per day to warm up the sending domain. Don't blast all 262 at once.

**Timing:** Tuesday-Thursday, 9-11am local time. Groomers are often busy mornings but check email before their first appointment.

**Personalization matters:** The claim link and profile link are unique per groomer. This makes the email feel personal, not mass-produced.

**Tracking:** Add UTM params to links if using analytics: `?utm_source=email&utm_medium=outreach&utm_campaign=founding-member`

**CAN-SPAM compliance:**
- Include your physical address in the footer
- Include an unsubscribe mechanism (even a simple "reply STOP")
- Don't use deceptive subject lines
- Honor opt-outs immediately
