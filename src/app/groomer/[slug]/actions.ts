"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { headers } from "next/headers";
import { after } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import {
  renderBrandedEmail,
  emailDetailCard,
  emailParagraph,
  escapeHtml,
} from "@/lib/email/template";

export type GroomerMessageResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function notifyOwner(opts: {
  to: string;
  listingName: string;
  listingSlug: string;
  leadId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  message: string;
}) {
  const html = renderBrandedEmail({
    preheader: `New message about ${opts.listingName}`,
    heading: "A pet parent sent you a message",
    body:
      emailParagraph(
        `Someone contacted <strong>${escapeHtml(opts.listingName)}</strong> through GroomLocal.`
      ) +
      emailDetailCard("Message details", [
        { label: "From", value: opts.senderName },
        { label: "Email", value: opts.senderEmail },
        { label: "Phone", value: opts.senderPhone || "Not provided" },
        { label: "Message", value: opts.message },
      ]),
    cta: {
      label: "Open your inbox",
      url: "https://groomlocal.com/dashboard/inbox",
    },
    footerNote: `This message was sent via the contact form on your GroomLocal listing.`,
  });

  return sendEmail({
    site: "lead",
    to: opts.to,
    subject: `New GroomLocal message for ${opts.listingName}`,
    html,
    replyTo: opts.senderEmail,
    context: { slug: opts.listingSlug, leadId: opts.leadId },
  });
}

export async function sendGroomerMessage(
  formData: FormData
): Promise<GroomerMessageResult> {
  if (formData.get("hp_field")?.toString()) {
    return { ok: true };
  }

  if (!rateLimit(`lead:${clientKey(await headers())}`, 5, 10 * 60_000).ok) {
    return { ok: false, error: "Too many messages from this connection. Please try again in a few minutes." };
  }

  const listingId = formData.get("listingId")?.toString().trim() || "";
  const listingSlug = formData.get("listingSlug")?.toString().trim() || "";
  const name = formData.get("name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";
  const petDetails = formData.get("pet_details")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";

  if (!listingId || !listingSlug) {
    return { ok: false, error: "Missing listing information." };
  }
  if (!name || name.length > 120) {
    return { ok: false, error: "Please enter your name (120 characters or fewer)." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (phone.length > 40) {
    return { ok: false, error: "Phone number must be 40 characters or fewer." };
  }
  if (message.length < 10 || message.length > 2000) {
    return { ok: false, error: "Message must be between 10 and 2000 characters." };
  }

  const storedMessage = petDetails
    ? `${message}\n\nPet details: ${petDetails}`
    : message;

  const admin = createAdminClient();
  const { data: listing, error: listingError } = await admin
    .from("business_listings")
    .select("id, name, slug, email, owner_id")
    .eq("id", listingId)
    .eq("slug", listingSlug)
    .single();

  if (listingError || !listing || !listing.owner_id) {
    return { ok: false, error: "This listing is not accepting messages." };
  }

  const { data: lead, error: insertError } = await admin
    .from("leads")
    .insert({
      listing_id: listing.id,
      sender_name: name,
      sender_email: email,
      sender_phone: phone || null,
      message: storedMessage,
      status: "new",
    })
    .select("id")
    .single();

  if (insertError || !lead) {
    console.error(JSON.stringify({ scope: "lead", event: "insert_failed", slug: listing.slug, code: insertError?.code, message: insertError?.message }));
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  const leadId = lead.id as string;

  // Notify after the response is sent; the lead row is already the source of truth.
  after(async () => {
  // Notify the verified account email first; the scraped listing email is a fallback only.
  let ownerEmail: string | null = null;
  const { data: ownerData, error: ownerError } = await admin.auth.admin.getUserById(listing.owner_id);
  if (ownerError) {
    console.error(JSON.stringify({ scope: "lead", event: "owner_lookup_failed", slug: listing.slug, leadId, message: ownerError.message }));
  } else {
    ownerEmail = ownerData.user?.email ?? null;
  }
  if (!ownerEmail) ownerEmail = (listing.email as string | null) || null;

  const outcome = ownerEmail
    ? await notifyOwner({
        to: ownerEmail,
        listingName: listing.name,
        listingSlug: listing.slug,
        leadId,
        senderName: name,
        senderEmail: email,
        senderPhone: phone || null,
        message: storedMessage,
      })
    : ({ ok: false, error: "no owner email on file" } as const);

  await admin
    .from("leads")
    .update(
      outcome.ok
        ? { notified_at: new Date().toISOString(), resend_id: outcome.id, notify_error: null }
        : { notify_error: outcome.error.slice(0, 500) }
    )
    .eq("id", leadId);
  });

  return { ok: true };
}
