"use server";

import {
  renderBrandedEmail,
  emailDetailCard,
  emailParagraph,
  escapeHtml,
} from "@/lib/email/template";

export type ContactMessageResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(
  formData: FormData
): Promise<ContactMessageResult> {
  if (formData.get("hp_field")?.toString()) {
    return { ok: true };
  }

  const firstName = formData.get("first_name")?.toString().trim() || "";
  const lastName = formData.get("last_name")?.toString().trim() || "";
  const name = `${firstName} ${lastName}`.trim();
  const email = formData.get("email")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";
  const subject = formData.get("subject")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";

  if (!name || name.length > 120) {
    return { ok: false, error: "Please enter your name (120 characters or fewer)." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (phone.length > 40) {
    return { ok: false, error: "Phone number must be 40 characters or fewer." };
  }
  if (subject.length > 200) {
    return { ok: false, error: "Subject must be 200 characters or fewer." };
  }
  if (message.length < 10 || message.length > 2000) {
    return { ok: false, error: "Message must be between 10 and 2000 characters." };
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL || "hello@groomlocal.com";
  if (!key) {
    console.error("Contact notify failed: RESEND_API_KEY not set");
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  try {
    const html = renderBrandedEmail({
      preheader: subject || "New website contact message",
      heading: "New contact form message",
      body:
        emailParagraph(
          `A visitor sent a message from the GroomLocal contact page.`
        ) +
        emailDetailCard("Message details", [
          { label: "From", value: name },
          { label: "Email", value: email },
          { label: "Phone", value: phone || "Not provided" },
          { label: "Subject", value: subject || "Website contact" },
          { label: "Message", value: message },
        ]),
      footerNote: escapeHtml("Reply directly to the sender's email address."),
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.QUOTE_FROM_EMAIL || "GroomLocal <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: subject ? `Contact: ${subject}` : `Contact form: ${name}`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Contact notify failed:", res.status);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  } catch {
    console.error("Contact notify failed");
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}
